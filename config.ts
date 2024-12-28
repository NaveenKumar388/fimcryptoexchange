import dotenv from "dotenv";

dotenv.config();

export const config = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN!,
  POSTGRESQL_URL: process.env.POSTGRESQL_URL || "postgresql://fimcryptoexchange_db_user:a2tIWTfXciF6YshefoEttQ29VmV1fpJW@dpg-ctltnpaj1k6c73d2pbtg-a/fimcryptoexchange_db",
  REDIS_URL: process.env.REDIS_URL || "redis://red-ctltmrogph6c739msvag:6379",
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_KEY: process.env.SUPABASE_KEY!,
  PORT: process.env.PORT || "3000",
  NODE_ENV: process.env.NODE_ENV || "development",
  BINANCE_API_KEY: process.env.BINANCE_API_KEY!,
  BINANCE_API_SECRET: process.env.BINANCE_API_SECRET!,
};

Object.entries(config).forEach(([key, value]) => {
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }
});

/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.

