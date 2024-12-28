import { Context, SessionFlavor } from "grammy";
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
  __language_code: string;
}

export type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;

// Add this line to extend ConversationSessionData
declare module "@grammyjs/conversations" {
  interface ConversationSessionData extends SessionData {}
}

