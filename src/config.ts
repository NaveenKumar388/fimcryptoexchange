export const config = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || '',
  PORT: process.env.PORT || '3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  RENDER_EXTERNAL_HOSTNAME: process.env.RENDER_EXTERNAL_HOSTNAME || '',
  BINANCE_API_KEY: process.env.BINANCE_API_KEY || '',
  BINANCE_API_SECRET: process.env.BINANCE_API_SECRET || '',
};

if (!config.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set');
}

if (!config.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

if (!config.REDIS_URL) {
  throw new Error('REDIS_URL is not set');
}

if (!config.BINANCE_API_KEY) {
  throw new Error('BINANCE_API_KEY is not set');
}

if (!config.BINANCE_API_SECRET) {
  throw new Error('BINANCE_API_SECRET is not set');
}

