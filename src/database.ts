import { createClient } from "@supabase/supabase-js";
import { Pool } from 'pg';
import { config } from "./config";
import { MyContext } from "./types";
import { getBinanceTicker } from "./binanceApi";

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
const pgPool = new Pool({ connectionString: config.POSTGRESQL_URL });

export async function storeUserData(ctx: MyContext) {
  const userData = {
    telegram_id: ctx.from?.id,
    name: ctx.session.name,
    telegram_username: ctx.session.telegramUsername,
    gmail_address: ctx.session.gmailAddress,
  };

  // Store in PostgreSQL
  try {
    await pgPool.query(
      'INSERT INTO users (telegram_id, name, telegram_username, gmail_address) VALUES ($1, $2, $3, $4) ON CONFLICT (telegram_id) DO UPDATE SET name = $2, telegram_username = $3, gmail_address = $4',
      [userData.telegram_id, userData.name, userData.telegram_username, userData.gmail_address]
    );
  } catch (error) {
    console.error("Error storing user data in PostgreSQL:", error);
  }

  // Store in Supabase
  const { error } = await supabase.from('users').upsert(userData);
  if (error) {
    console.error("Error storing user data in Supabase:", error);
  }
}

export async function storeTransactionData(ctx: MyContext) {
  const transactionData = {
    user_id: ctx.from?.id,
    currency: ctx.session.selectedCurrency,
    network: ctx.session.selectedNetwork,
    amount_usd: ctx.session.amount,
    amount_crypto: ctx.session.amount / parseFloat((await getBinanceTicker(`${ctx.session.selectedCurrency}USDT`)).price),
    wallet_address: ctx.session.walletAddress,
    memo: ctx.session.memo,
    transaction_id: ctx.session.transactionId,
    status: 'pending',
  };

  // Store in PostgreSQL
  try {
    await pgPool.query(
      'INSERT INTO transactions (user_id, currency, network, amount_usd, amount_crypto, wallet_address, memo, transaction_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [transactionData.user_id, transactionData.currency, transactionData.network, transactionData.amount_usd, transactionData.amount_crypto, transactionData.wallet_address, transactionData.memo, transactionData.transaction_id, transactionData.status]
    );
  } catch (error) {
    console.error("Error storing transaction data in PostgreSQL:", error);
  }

  // Store in Supabase
  const { error } = await supabase.from('transactions').insert(transactionData);
  if (error) {
    console.error("Error storing transaction data in Supabase:", error);
  }
}

export async function updateTransactionStatus(ctx: MyContext, status: string, hash?: string, error?: string) {
  const updateData = {
    status,
    transaction_hash: hash,
    error_message: error,
  };

  // Update in PostgreSQL
  try {
    await pgPool.query(
      'UPDATE transactions SET status = $1, transaction_hash = $2, error_message = $3 WHERE transaction_id = $4',
      [status, hash, error, ctx.session.transactionId]
    );
  } catch (pgError) {
    console.error("Error updating transaction status in PostgreSQL:", pgError);
  }

  // Update in Supabase
  const { error: supabaseError } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('transaction_id', ctx.session.transactionId);

  if (supabaseError) {
    console.error("Error updating transaction status in Supabase:", supabaseError);
  }
}

export async function testDatabaseConnections() {
  try {
    // Test PostgreSQL
    const pgClient = await pgPool.connect();
    const pgResult = await pgClient.query('SELECT NOW()');
    console.log('PostgreSQL connected:', pgResult.rows[0]);
    pgClient.release();

    // Test Supabase
    const { data, error } = await supabase.from('users').select('count', { count: 'exact' });
    if (error) throw error;
    console.log('Supabase connected, user count:', data);

    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

export const testConnections = testDatabaseConnections;

