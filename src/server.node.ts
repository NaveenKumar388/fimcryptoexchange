import express from 'express';
import { Bot, webhookCallback } from 'grammy';
import { conversations } from '@grammyjs/conversations';
import { handleStart, handleHelp, handleRegister, handleExchange, handleAdmin } from './lib/commands';
import { testConnections, initializeDatabase } from './lib/db';
import type { UserState } from './lib/types';

async function startServer() {
  // Test database connections
  const connected = await testConnections();
  if (!connected) {
    console.error('Failed to connect to databases');
    process.exit(1);
  }

  // Initialize database tables
  await initializeDatabase();

  const bot = new Bot<UserState>(process.env.TELEGRAM_BOT_TOKEN || '');

  // Configure bot
  bot.use(conversations());
  bot.command('start', handleStart);
  bot.command('help', handleHelp);
  bot.command('register', handleRegister);
  bot.command('exchange', handleExchange);
  bot.command('admin', handleAdmin);

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
}

startServer().catch(console.error);
