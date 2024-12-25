import { config } from '../config';

const BINANCE_API_URL = "https://api.binance.com";

async function createSignature(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

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
  const signature = await createSignature(queryString, config.BINANCE_API_SECRET);

  const response = await fetch(`${BINANCE_API_URL}/sapi/v1/convert/getQuote?${queryString}&signature=${signature}`, {
    headers: {
      "X-MBX-APIKEY": config.BINANCE_API_KEY,
    },
  });

  return await response.json();
}

export async function createBinanceWithdrawal(coin: string, address: string, amount: number, network?: string) {
  const timestamp = Date.now();
  const queryString = `coin=${coin}&address=${address}&amount=${amount}${network ? `&network=${network}` : ''}&timestamp=${timestamp}`;
  const signature = await createSignature(queryString, config.BINANCE_API_SECRET);

  const response = await fetch(`${BINANCE_API_URL}/sapi/v1/capital/withdraw/apply?${queryString}&signature=${signature}`, {
    method: "POST",
    headers: {
      "X-MBX-APIKEY": config.BINANCE_API_KEY,
    },
  });

  return await response.json();
}

