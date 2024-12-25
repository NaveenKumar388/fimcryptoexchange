export interface UserState {
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

export enum BotCommand {
  START = "start",
  HELP = "help",
  REGISTER = "register",
  EXCHANGE = "exchange",
  ADMIN = "admin",
}

