import { Context } from "grammy";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_PASSWORD, AVAILABLE_CURRENCIES, NETWORK_FEES, FIXED_DOLLAR_VALUE, ENHANCE_FEE_PER_DOLLAR, USDT_FIXED_DOLLAR_VALUE } from "./constants";
import { getBinanceTicker, createBinanceWithdrawal } from "src/lib/binanceApi";
import type { UserState } from "src/lib/types";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_KEY || ""
);

export async function handleStart(ctx: Context) {
  await ctx.reply("Welcome to FIM Crypto Exchange! Use /register to start the registration process.");
}

export async function handleHelp(ctx: Context) {
  await ctx.reply(
    "Available commands:\n" +
    "/start - Start the bot\n" +
    "/register - Register your account\n" +
    "/exchange - Start a new exchange\n" +
    "/help - Show this help message"
  );
}

export async function handleRegister(conversation: any, ctx: Context) {
  await ctx.reply("Welcome to FIM Crypto Exchange! Please provide your name:");
  const { message } = await conversation.wait();
  ctx.session.name = message?.text || "";

  await ctx.reply("Name saved! Please enter your Telegram username:");
  const { message: telegramMessage } = await conversation.wait();
  ctx.session.telegramUsername = telegramMessage?.text || "";

  await ctx.reply("Telegram username saved! Please enter your Gmail address:");
  const { message: gmailMessage } = await conversation.wait();
  ctx.session.gmailAddress = gmailMessage?.text || "";

  await storeUserData(ctx);
  await ctx.reply("Gmail address saved! Registration complete. Use /exchange to start a new exchange.");
}

export async function handleExchange(conversation: any, ctx: Context) {
  await ctx.reply("Choose your crypto currency:", {
    reply_markup: {
      keyboard: AVAILABLE_CURRENCIES.map(currency => [currency]),
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  });

  const { message: currencyMessage } = await conversation.wait();
  ctx.session.selectedCurrency = currencyMessage?.text || "";

  if (!AVAILABLE_CURRENCIES.includes(ctx.session.selectedCurrency as any)) {
    await ctx.reply("Invalid currency selected. Please use /exchange to try again.");
    return;
  }

  const networkInfo = NETWORK_FEES[ctx.session.selectedCurrency as keyof typeof NETWORK_FEES];
  ctx.session.selectedNetwork = networkInfo.network;

  await ctx.reply(
    `Selected currency: ${ctx.session.selectedCurrency}\n` +
    `Network: ${ctx.session.selectedNetwork}\n` +
    `Minimum withdrawal: ${networkInfo.minWithdrawal} ${ctx.session.selectedCurrency}\n` +
    `Network fee: ${networkInfo.fee} ${ctx.session.selectedCurrency}`
  );

  await ctx.reply("Enter the amount in dollars:");
  const { message: amountMessage } = await conversation.wait();
  ctx.session.amount = parseFloat(amountMessage?.text || "0");

  if (isNaN(ctx.session.amount) || ctx.session.amount <= 0) {
    await ctx.reply("Invalid amount. Please use /exchange to try again.");
    return;
  }

  const ticker = await getBinanceTicker(`${ctx.session.selectedCurrency}USDT`);
  const cryptoAmount = ctx.session.amount / parseFloat(ticker.price);

  if (cryptoAmount < networkInfo.minWithdrawal) {
    await ctx.reply(`Amount is less than the minimum withdrawal. Please use /exchange to try again.`);
    return;
  }

  const inrAmount = ctx.session.selectedCurrency === "USDT" 
    ? ctx.session.amount * USDT_FIXED_DOLLAR_VALUE
    : ctx.session.amount * FIXED_DOLLAR_VALUE + networkInfo.fee * parseFloat(ticker.price) * FIXED_DOLLAR_VALUE + ctx.session.amount * ENHANCE_FEE_PER_DOLLAR;

  await ctx.reply(
    `Amount in ${ctx.session.selectedCurrency}: ${cryptoAmount.toFixed(8)}\n` +
    `Total amount in INR: ₹${inrAmount.toFixed(2)}`
  );

  await ctx.reply("Enter your wallet address:");
  const { message: walletMessage } = await conversation.wait();
  ctx.session.walletAddress = walletMessage?.text || "";

  if (ctx.session.selectedCurrency === "TON") {
    await ctx.reply("Do you have a memo or comment?", {
      reply_markup: {
        keyboard: [["Yes"], ["No"]],
        one_time_keyboard: true,
        resize_keyboard: true,
      },
    });

    const { message: memoChoice } = await conversation.wait();
    if (memoChoice?.text === "Yes") {
      await ctx.reply("Enter your memo or comment:");
      const { message: memoMessage } = await conversation.wait();
      ctx.session.memo = memoMessage?.text || "";
    }
  }

  await ctx.reply("Proceed to payment. Pay to this UPI ID: fimcryptobot@okhdfcbank");

  await ctx.reply("Payment complete? Enter your transaction ID:");
  const { message: transactionMessage } = await conversation.wait();
  ctx.session.transactionId = transactionMessage?.text || "";

  const confirmationMessage = `
Name: ${ctx.session.name}
Telegram ID: ${ctx.session.telegramUsername}
Gmail: ${ctx.session.gmailAddress}
Crypto currency: ${ctx.session.selectedCurrency}
Network: ${ctx.session.selectedNetwork}
Amount in USD: $${ctx.session.amount}
Amount in ${ctx.session.selectedCurrency}: ${cryptoAmount.toFixed(8)}
Total amount in INR: ₹${inrAmount.toFixed(2)}
Wallet address: ${ctx.session.walletAddress}
${ctx.session.memo ? `Memo: ${ctx.session.memo}` : ""}
Transaction ID: ${ctx.session.transactionId}
`;

  await ctx.reply(confirmationMessage);
  await ctx.reply("Confirm the details. Type 'yes' to proceed or 'no' to restart.");

  const { message: confirmationResponse } = await conversation.wait();
  if (confirmationResponse?.text?.toLowerCase() === "yes") {
    await storeTransactionData(ctx);
    await ctx.reply("Thank you for your order. An admin will process your transaction shortly.");
  } else {
    await ctx.reply("Order cancelled. Use /exchange to start a new order.");
  }
}

export async function handleAdmin(conversation: any, ctx: Context) {
  await ctx.reply("Enter admin password:");
  const { message: passwordMessage } = await conversation.wait();

  if (passwordMessage?.text !== ADMIN_PASSWORD) {
    await ctx.reply("Incorrect password. Access denied.");
    return;
  }

  await ctx.reply("Admin access granted. Choose an action:", {
    reply_markup: {
      keyboard: [["Automatic Transfer"], ["Manual Transfer"]],
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  });

  const { message: actionMessage } = await conversation.wait();

  if (actionMessage?.text === "Automatic Transfer") {
    const withdrawalResult = await createBinanceWithdrawal(
      ctx.session.selectedCurrency,
      ctx.session.walletAddress,
      ctx.session.amount,
      ctx.session.selectedNetwork
    );

    if (withdrawalResult.success) {
      await ctx.reply(`Automatic transfer successful. Transaction hash: ${withdrawalResult.id}`);
      await updateTransactionStatus(ctx, "completed", withdrawalResult.id);
    } else {
      await ctx.reply(`Automatic transfer failed. Error: ${withdrawalResult.msg}`);
      await updateTransactionStatus(ctx, "failed", undefined, withdrawalResult.msg);
    }
  } else if (actionMessage?.text === "Manual Transfer") {
    await ctx.reply("Manual transfer selected. Please process the transaction manually within 1 hour.");
    await updateTransactionStatus(ctx, "manual_processing");
  } else {
    await ctx.reply("Invalid action selected. The transaction will be processed manually within 1 hour.");
    await updateTransactionStatus(ctx, "manual_processing");
  }

  await ctx.reply("Thank you for using the admin panel.");
}

async function storeUserData(ctx: Context) {
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

async function storeTransactionData(ctx: Context) {
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

async function updateTransactionStatus(ctx: Context, status: string, hash?: string, error?: string) {
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

