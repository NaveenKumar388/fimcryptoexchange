import { Elysia } from 'elysia';
import { Bot, webhookCallback } from 'grammy';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { conversations } from '@grammyjs/conversations';
import { handleStart, handleHelp, handleRegister, handleExchange, handleAdmin } from './lib/commands';
import type { UserState } from './types';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Initialize PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

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

const app = new Elysia()
  .post('/webhook', async ({ request }) => {
    const handler = webhookCallback(bot, 'callback');
    return handler(request);
  })
  .get('/health', () => ({ status: 'ok' }))
  .listen(process.env.PORT || 3000);

console.log(`Server is running on port ${app.server?.port}`);

