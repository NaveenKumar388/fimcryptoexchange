import { Conversation } from "@grammyjs/conversations";
import { MyContext } from "./types";
import { storeUserData, storeTransactionData, updateTransactionStatus } from "./database";
import { getBinanceTicker, createBinanceWithdrawal } from "./binanceApi";
import { ADMIN_PASSWORD, AVAILABLE_CURRENCIES, NETWORK_FEES, FIXED_DOLLAR_VALUE, ENHANCE_FEE_PER_DOLLAR, USDT_FIXED_DOLLAR_VALUE } from "./constants";

export async function handleStart(ctx: MyContext) {
  await ctx.reply("Welcome to FIM Crypto Exchange! Use /register to start the registration process.");
}

export async function handleHelp(ctx: MyContext) {
  await ctx.reply(
    "Available commands:\n" +
    "/start - Start the bot\n" +
    "/register - Register your account\n" +
    "/exchange - Start a new exchange\n" +
    "/help - Show this help message"
  );
}

export async function handleRegister(conversation: Conversation<MyContext>, ctx: MyContext) {
  await ctx.reply("Welcome to FIM Crypto Exchange! Please provide your name:");
  ctx.session.name = await conversation.form.text();

  await ctx.reply("Name saved! Please enter your Telegram username:");
  ctx.session.telegramUsername = await conversation.form.text();

  await ctx.reply("Telegram username saved! Please enter your Gmail address:");
  ctx.session.gmailAddress = await conversation.form.text();

  await storeUserData(ctx);
  await ctx.reply("Gmail address saved! Registration complete. Use /exchange to start a new exchange.");
}

export async function handleExchange(conversation: Conversation<MyContext>, ctx: MyContext) {
  await ctx.reply("Choose your crypto currency:", {
    reply_markup: {
      keyboard: AVAILABLE_CURRENCIES.map(currency => [currency]),
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  });

  ctx.session.selectedCurrency = await conversation.form.select(AVAILABLE_CURRENCIES);

  const networkInfo = NETWORK_FEES[ctx.session.selectedCurrency as keyof typeof NETWORK_FEES];
  ctx.session.selectedNetwork = networkInfo.network;

  await ctx.reply(
    `Selected currency: ${ctx.session.selectedCurrency}\n` +
    `Network: ${ctx.session.selectedNetwork}\n` +
    `Minimum withdrawal: ${networkInfo.minWithdrawal} ${ctx.session.selectedCurrency}\n` +
    `Network fee: ${networkInfo.fee} ${ctx.session.selectedCurrency}`
  );

  await ctx.reply("Enter the amount in dollars:");
  ctx.session.amount = await conversation.form.number();

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
  ctx.session.walletAddress = await conversation.form.text();

  if (ctx.session.selectedCurrency === "TON") {
    await ctx.reply("Do you have a memo or comment?", {
      reply_markup: {
        keyboard: [["Yes"], ["No"]],
        one_time_keyboard: true,
        resize_keyboard: true,
      },
    });

    const hasMemo = await conversation.form.select(["Yes", "No"]) === "Yes";
    if (hasMemo) {
      await ctx.reply("Enter your memo or comment:");
      ctx.session.memo = await conversation.form.text();
    }
  }

  await ctx.reply("Proceed to payment. Pay to this UPI ID: fimcryptobot@okhdfcbank");

  await ctx.reply("Payment complete? Enter your transaction ID:");
  ctx.session.transactionId = await conversation.form.text();

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

  const confirmation = await conversation.form.select(["yes", "no"]);
  if (confirmation === "yes") {
    await storeTransactionData(ctx);
    await ctx.reply("Thank you for your order. An admin will process your transaction shortly.");
  } else {
    await ctx.reply("Order cancelled. Use /exchange to start a new order.");
  }
}

export async function handleAdmin(conversation: Conversation<MyContext>, ctx: MyContext) {
  await ctx.reply("Enter admin password:");
  const password = await conversation.form.text();

  if (password !== ADMIN_PASSWORD) {
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

  const action = await conversation.form.select(["Automatic Transfer", "Manual Transfer"]);

  if (action === "Automatic Transfer") {
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
  } else {
    await ctx.reply("Manual transfer selected. Please process the transaction manually within 1 hour.");
    await updateTransactionStatus(ctx, "manual_processing");
  }

  await ctx.reply("Thank you for using the admin panel.");
}

