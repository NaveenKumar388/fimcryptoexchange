import type { Pool } from 'pg';
import { Redis } from 'ioredis';

// Parse Redis URL (Render provides a full URL)
function parseRedisUrl(url: string) {
  const parsedUrl = new URL(url);
  return {
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port),
    username: parsedUrl.username,
    password: parsedUrl.password,
    tls: {
      rejectUnauthorized: false // Required for Render Redis
    }
  };
}

// PostgreSQL configuration
export const pgPool: Pool = new (require('pg').Pool)({
  connectionString: process.env.INTERNAL_POSTGRES_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render PostgreSQL
  }
});

// Redis configuration
export const redis = new Redis(process.env.REDIS_URL);

// Test database connections
export async function testConnections() {
  try {
    // Test PostgreSQL
    const pgClient = await pgPool.connect();
    const pgResult = await pgClient.query('SELECT NOW()');
    console.log('PostgreSQL connected:', pgResult.rows[0]);
    pgClient.release();

    // Test Redis
    const redisResult = await redis.ping();
    console.log('Redis connected:', redisResult);

    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// Initialize database schema
export async function initializeDatabase() {
  const client = await pgPool.connect();
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        telegram_id BIGINT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        telegram_username VARCHAR(255),
        gmail_address VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id BIGINT REFERENCES users(telegram_id),
        currency VARCHAR(10) NOT NULL,
        network VARCHAR(50) NOT NULL,
        amount_usd DECIMAL(15,2) NOT NULL,
        amount_crypto DECIMAL(30,8) NOT NULL,
        wallet_address TEXT NOT NULL,
        memo TEXT,
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        transaction_hash VARCHAR(255),
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

