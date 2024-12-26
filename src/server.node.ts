import express from 'express';
import { Bot, webhookCallback } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import { handleStart, handleHelp, handleRegister, handleExchange, handleAdmin } from './lib/commands';
import { testConnections, initializeDatabase } from './lib/db';
import type { Context } from './types';
import { session } from 'grammy';
import type { SessionData } from './types';
import { config } from './config';

async function startServer() {
  console.log('Starting server...');
  console.log('Environment:', config.NODE_ENV);
  console.log('Port:', config.PORT);
  console.log('Database URL:', config.DATABASE_URL);
  console.log('Redis URL:', config.REDIS_URL);

  try {
    // Test database connections
    const connected = await testConnections();
    if (!connected) {
      throw new Error('Failed to connect to databases');
    }

    // Initialize database tables
    await initializeDatabase();

    const bot = new Bot<Context>(config.TELEGRAM_BOT_TOKEN);

    // Configure bot
    bot.use(session({
      initial: (): SessionData => ({
        step: "",
        name: "",
        telegramUsername: "",
        gmailAddress: "",
        selectedCurrency: "",
        selectedNetwork: "",
        amount: 0,
        walletAddress: "",
        memo: "",
        transactionId: ""
      })
    }));

    bot.use(conversations());
    bot.use(createConversation(handleRegister));
    bot.use(createConversation(handleExchange));
    bot.use(createConversation(handleAdmin));

    bot.command('start', async (ctx) => {
      console.log('Received /start command');
      await handleStart(ctx);
    });
    bot.command('help', async (ctx) => {
      console.log('Received /help command');
      await handleHelp(ctx);
    });
    bot.command('register', async (ctx) => {
      console.log('Received /register command');
      await ctx.conversation.enter('handleRegister');
    });
    bot.command('exchange', async (ctx) => {
      console.log('Received /exchange command');
      await ctx.conversation.enter('handleExchange');
    });
    bot.command('admin', async (ctx) => {
      console.log('Received /admin command');
      await ctx.conversation.enter('handleAdmin');
    });

    // Add a catch-all handler for debugging
    bot.on('message', (ctx) => {
      console.log('Received message:', ctx.message);
      return ctx.reply('I received your message, but I\'m not sure how to respond.');
    });

    // Error handling
    bot.catch((err) => {
      console.error('Error in bot:', err);
    });

    const app = express();
    app.use(express.json());

    // Webhook handler
    app.use('/webhook', (req, res, next) => {
      console.log('Received webhook request:', req.body);
      webhookCallback(bot, 'express')(req, res, next);
    });

    // Health check endpoint
    app.get('/health', async (_, res) => {
      const dbConnected = await testConnections();
      res.status(dbConnected ? 200 : 500).json({ 
        status: dbConnected ? 'ok' : 'error',
        timestamp: new Date().toISOString()
      });
    });

    console.log('Setting up Express server...');
    const port = parseInt(config.PORT, 10);
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server is running on port ${port}`);
      console.log('Express server setup complete');
    });

    console.log('Bot username:', bot.botInfo.username);
    console.log('Webhook URL:', `https://${config.RENDER_EXTERNAL_HOSTNAME}/webhook`);

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);

