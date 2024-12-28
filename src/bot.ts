import { Bot, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import { RedisAdapter } from "@grammyjs/storage-redis";
import Redis from "ioredis";
import { config } from "./config";
import { handleStart, handleHelp, handleRegister, handleExchange, handleAdmin } from "./commands";
import { MyContext, SessionData } from "./types";

const redis = new Redis(config.REDIS_URL);

const bot = new Bot<MyContext>(config.TELEGRAM_BOT_TOKEN);

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
  }),
  storage: new RedisAdapter({ instance: redis })
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

bot.on("message", (ctx) => ctx.reply("I don't understand that command."));

export default bot;

