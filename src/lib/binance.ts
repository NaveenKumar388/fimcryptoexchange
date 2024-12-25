import crypto from 'crypto';

const BINANCE_API_KEY = process.env.BINANCE_API_KEY || "";
const BINANCE_API_SECRET = process.env.BINANCE_API_SECRET || "";
const BINANCE_API_URL = "https://api.binance.com";

export async function getBinanceExchangeInfo() {
  const response = await fetch(`${BINANCE_API_URL}/api/v3/exchangeInfo`);
  return await response.json();
}

export async function getBinanceTicker(symbol: string) {
  const response = await fetch(`${BINANCE_API_URL}/api/v3/ticker/price?symbol=${symbol}`);
  return await response.json();
}

export async function convertCrypto(fromSymbol: string, toSymbol: string, amount: number) {
  const timestamp = Date.now();
  const queryString = `fromSymbol=${fromSymbol}&toSymbol=${toSymbol}&amount=${amount}&timestamp=${timestamp}`;
  const signature = crypto
    .createHmac('sha256', BINANCE_API_SECRET)
    .update(queryString)
    .digest('hex');

  const response = await fetch(`${BINANCE_API_URL}/sapi/v1/convert/getQuote?${queryString}&signature=${signature}`, {
    headers: {
      "X-MBX-APIKEY": BINANCE_API_KEY,
    },
  });

  return await response.json();
}

export async function createBinanceWithdrawal(coin: string, address: string, amount: number, network?: string) {
  const timestamp = Date.now();
  const queryString = `coin=${coin}&address=${address}&amount=${amount}${network ? `&network=${network}` : ''}&timestamp=${timestamp}`;
  const signature = crypto
    .createHmac('sha256', BINANCE_API_SECRET)
    .update(queryString)
    .digest('hex');

  const response = await fetch(`${BINANCE_API_URL}/sapi/v1/capital/withdraw/apply?${queryString}&signature=${signature}`, {
    method: "POST",
    headers: {
      "X-MBX-APIKEY": BINANCE_API_KEY,
    },
  });

  return await response.json();
}

