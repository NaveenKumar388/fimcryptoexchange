import { Bot, webhookCallback } from "grammy";
import { conversations } from "@grammyjs/conversations";
import { handleStart, handleHelp, handleRegister, handleExchange, handleAdmin } from "@/lib/commands";
import type { UserState } from "@/lib/types";

const bot = new Bot<UserState>(process.env.TELEGRAM_BOT_TOKEN || "");

// Configure bot
bot.use(conversations());
bot.command("start", handleStart);
bot.command("help", handleHelp);
bot.command("register", handleRegister);
bot.command("exchange", handleExchange);
bot.command("admin", handleAdmin);

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

