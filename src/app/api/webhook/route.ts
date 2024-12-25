import { Bot, webhookCallback } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import { handleStart, handleHelp, handleRegister, handleExchange, handleAdmin } from "@/lib/commands";
import { Context, SessionData } from "@/types";
import { config } from "@/config";

const bot = new Bot<Context>(config.TELEGRAM_BOT_TOKEN);

// Configure bot
bot.use(session({
  initial: (): SessionData => ({
    step: "",
    name: "",
    telegramUsername: "",
    gmailAddress: "",
    selectedCurrency: "",
    selectedNetwork: "",
    amount: 0,
    walletAddress: "",
    memo: "",
    transactionId: ""
  })
}));

bot.use(conversations());
bot.use(createConversation(handleRegister));
bot.use(createConversation(handleExchange));
bot.use(createConversation(handleAdmin));

bot.command("start", handleStart);
bot.command("help", handleHelp);
bot.command("register", (ctx) => ctx.conversation.enter("handleRegister"));
bot.command("exchange", (ctx) => ctx.conversation.enter("handleExchange"));
bot.command("admin", (ctx) => ctx.conversation.enter("handleAdmin"));

// Error handling
bot.catch((err) => {
  console.error("Error in bot:", err);
});

// Create the handler
const handler = webhookCallback(bot, "next-js");

export async function POST(req: Request) {
  try {
    await handler(req);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error in webhook:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

