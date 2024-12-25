-- Users table
CREATE TABLE users (
  telegram_id BIGINT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  telegram_username VARCHAR(255),
  gmail_address VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
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

-- Indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);

