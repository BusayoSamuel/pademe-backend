const ZERO_DECIMAL_CURRENCIES = new Set([
  'bif',
  'clp',
  'djf',
  'gnf',
  'jpy',
  'kmf',
  'krw',
  'mga',
  'pyg',
  'rwf',
  'ugx',
  'vnd',
  'vuv',
  'xaf',
  'xof',
  'xpf',
]);

export function toStripeUnitAmount(amount: string, currency: string): number {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Amount must be a positive number');
  }

  const currencyLower = currency.toLowerCase();
  if (ZERO_DECIMAL_CURRENCIES.has(currencyLower)) {
    return Math.round(value);
  }

  return Math.round(value * 100);
}
