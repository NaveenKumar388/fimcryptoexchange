import { createClient } from "@supabase/supabase-js";
import { Context } from "@/types";
import { config } from '../config';
import { getBinanceTicker } from './binanceApi';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);

export async function storeUserData(ctx: Context) {
  const { error } = await supabase
    .from('users')
    .upsert({
      telegram_id: ctx.from?.id,
      name: ctx.session.name,
      telegram_username: ctx.session.telegramUsername,
      gmail_address: ctx.session.gmailAddress,
    });

  if (error) {
    console.error("Error storing user data:", error);
  }
}

export async function storeTransactionData(ctx: Context) {
  const { error } = await supabase
    .from('transactions')
    .insert({
      user_id: ctx.from?.id,
      currency: ctx.session.selectedCurrency,
      network: ctx.session.selectedNetwork,
      amount_usd: ctx.session.amount,
      amount_crypto: ctx.session.amount / parseFloat((await getBinanceTicker(`${ctx.session.selectedCurrency}USDT`)).price),
      wallet_address: ctx.session.walletAddress,
      memo: ctx.session.memo,
      transaction_id: ctx.session.transactionId,
      status: 'pending',
    });

  if (error) {
    console.error("Error storing transaction data:", error);
  }
}

export async function updateTransactionStatus(ctx: Context, status: string, hash?: string, error?: string) {
  const { error: updateError } = await supabase
    .from('transactions')
    .update({
      status,
      transaction_hash: hash,
      error_message: error,
    })
    .eq('transaction_id', ctx.session.transactionId);

  if (updateError) {
    console.error("Error updating transaction status:", updateError);
  }
}

export async function testConnections() {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact' });
    if (error) throw error;
    console.log('Supabase connected, user count:', data);
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

