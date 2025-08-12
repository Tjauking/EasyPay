export type QuoteRequest = {
  sourceCurrency: string;
  targetCountry: 'IN' | 'ZW';
  targetChannel: 'ECOCASH' | 'AGENT' | 'PHONEPE';
  amount: { currency: string; value: number };
};

export type QuoteResponse = {
  rate: number;
  fees: { type: string; amount: number; currency: string }[];
  targetEstAmount: { currency: string; value: number };
};

const STATIC_RATES: Record<string, number> = {
  'INR-USD': 0.012, // 1 INR = 0.012 USD
  'USD-INR': 83.0,
  'USD-ZWL': 13.0, // placeholder
  'USD-USD': 1,
};

export function getRate(pair: string): number {
  return STATIC_RATES[pair] ?? 1;
}

export function quote(req: QuoteRequest): QuoteResponse {
  const { amount, targetCountry } = req;
  // Normalize to USD internal token (USDt)
  let usdValue: number;
  if (amount.currency === 'INR') {
    usdValue = amount.value * getRate('INR-USD');
  } else if (amount.currency === 'USD') {
    usdValue = amount.value;
  } else {
    usdValue = amount.value;
  }
  const fees = [{ type: 'platform', amount: Math.max(1, usdValue * 0.01), currency: 'USD' }];
  const targetCurrency = targetCountry === 'IN' ? 'INR' : 'USD';
  let targetEst = usdValue - fees[0].amount;
  if (targetCurrency === 'INR') targetEst = targetEst * getRate('USD-INR');
  return { rate: usdValue / amount.value, fees, targetEstAmount: { currency: targetCurrency, value: Number(targetEst.toFixed(2)) } };
}