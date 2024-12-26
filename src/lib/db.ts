import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { config } from '../config';

// PostgreSQL configuration
export const pgPool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

// Redis configuration
export const redis = new Redis(config.REDIS_URL);

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
    // Start a transaction
    await client.query('BEGIN');

    // Check if the users table exists
    const userTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);

    if (!userTableCheck.rows[0].exists) {
      console.log('Creating users table...');
      // Create users table
      await client.query(`
        CREATE TABLE users (
          telegram_id BIGINT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          telegram_username VARCHAR(255),
          gmail_address VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    // Check if the transactions table exists
    const transactionTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'transactions'
      );
    `);

    if (!transactionTableCheck.rows[0].exists) {
      console.log('Creating transactions table...');
      // Create transactions table
      await client.query(`
        CREATE TABLE transactions (
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
    }

    // Commit the transaction
    await client.query('COMMIT');

    console.log('Database tables initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

