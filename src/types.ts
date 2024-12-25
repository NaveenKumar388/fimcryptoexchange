import { Context as GrammyContext, SessionFlavor } from "grammy";
import { ConversationFlavor } from "@grammyjs/conversations";

export interface SessionData {
  step: string;
  name: string;
  telegramUsername: string;
  gmailAddress: string;
  selectedCurrency: string;
  selectedNetwork: string;
  amount: number;
  walletAddress: string;
  memo: string;
  transactionId: string;
}


export type Context = GrammyContext & SessionFlavor<SessionData> & ConversationFlavor;

export type UserState = Context;


export enum BotCommand {
  START = "start",
  HELP = "help",
  REGISTER = "register",
  EXCHANGE = "exchange",
  ADMIN = "admin",
}

