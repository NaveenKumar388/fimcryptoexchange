import { Bot, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import { handleStart, handleHelp, handleRegister, handleExchange, handleAdmin } from "./lib/commands";
import { UserState } from "./types";
import { config } from "./config";

const bot = new Bot<UserState>(config.TELEGRAM_BOT_TOKEN);

bot.use(session({ initial: () => ({} as UserState) }));
bot.use(conversations());

bot.use(createConversation(handleRegister));
bot.use(createConversation(handleExchange));
bot.use(createConversation(handleAdmin));

bot.command("start", handleStart);
bot.command("help", handleHelp);
bot.command("register", (ctx) => ctx.conversation.enter("handleRegister"));
bot.command("exchange", (ctx) => ctx.conversation.enter("handleExchange"));
bot.command("admin", (ctx) => ctx.conversation.enter("handleAdmin"));

bot.catch((err) => {
  console.error("Error in bot:", err);
});

export function startBot() {
  bot.start({
    onStart: (botInfo) => {
      console.log(`Bot ${botInfo.username} started`);
    },
  });
}

