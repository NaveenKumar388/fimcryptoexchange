import express from 'express';
import { Bot, webhookCallback } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import { handleStart, handleHelp, handleRegister, handleExchange, handleAdmin } from './lib/commands';
import { testConnections, initializeDatabase } from './lib/db';
import type { Context } from './types';
import { session } from 'grammy';
import type { SessionData } from './types';

async function startServer() {
  try {
    // Test database connections
    const connected = await testConnections();
    if (!connected) {
      console.error('Failed to connect to databases');
      process.exit(1);
    }

    // Initialize database tables
    await initializeDatabase();

    const bot = new Bot<Context>(process.env.TELEGRAM_BOT_TOKEN || '');

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

    bot.command('start', handleStart);
    bot.command('help', handleHelp);
    bot.command('register', (ctx) => ctx.conversation.enter('handleRegister'));
    bot.command('exchange', (ctx) => ctx.conversation.enter('handleExchange'));
    bot.command('admin', (ctx) => ctx.conversation.enter('handleAdmin'));

    // Error handling
    bot.catch((err) => {
      console.error('Error in bot:', err);
    });

    const app = express();
    app.use(express.json());

    // Webhook handler
    app.post('/webhook', webhookCallback(bot, 'express'));

    // Health check endpoint
    app.get('/health', async (_, res) => {
      const dbConnected = await testConnections();
      res.status(dbConnected ? 200 : 500).json({ 
        status: dbConnected ? 'ok' : 'error',
        timestamp: new Date().toISOString()
      });
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);

