export const ADMIN_PASSWORD = "6383286204";
export const FIXED_DOLLAR_VALUE = 94;
export const ENHANCE_FEE_PER_DOLLAR = 2;
export const USDT_FIXED_DOLLAR_VALUE = 92;

export const AVAILABLE_CURRENCIES = [
  "BNB", "TON", "POL", "SUI", "NEAR", "LTC", "ARB", "TRX", "SOL", "USDT"
] as const;

export const NETWORK_FEES = {
  BNB: { network: "BNB Smart Chain (BEP20)", fee: 0.0002, minWithdrawal: 0.001 },
  LTC: { network: "Litecoin", fee: 0.0001, minWithdrawal: 0.014 },
  TON: { network: "The Open Network", fee: 0.02, minWithdrawal: 0.5 },
  POL: { network: "Polygon PoS", fee: 0.03, minWithdrawal: 20 },
  SUI: { network: "Sui", fee: 0.06, minWithdrawal: 1 },
  NEAR: { network: "NEAR Protocol", fee: 0.01, minWithdrawal: 0.26 },
  TRX: { network: "Tron (TRC20)", fee: 1, minWithdrawal: 5.5 },
  USDT: { network: "BNB Smart Chain (BEP20)", fee: 0, minWithdrawal: 10 },
  ARB: { network: "Arbitrum One", fee: 0.4, minWithdrawal: 0.8 },
  SOL: { network: "Solana", fee: 0.01, minWithdrawal: 0.01 },
} as const;

