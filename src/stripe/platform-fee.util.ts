/**
 * Platform fee on Askie fee (GBP-style tiers; £10 floor).
 * 15% for £10–20, 12.5% for £25–45 (and amounts under £50), 10% for £50+.
 */
export const ASK_AMOUNT_FLOOR = 10;

export function platformFeeRateForAmount(askieFee: number): number {
  const base = Math.max(askieFee, ASK_AMOUNT_FLOOR);
  if (base <= 20) {
    return 0.15;
  }
  if (base < 50) {
    return 0.125;
  }
  return 0.1;
}

export function calculatePlatformFee(askieFee: number): number {
  if (!Number.isFinite(askieFee) || askieFee < 0) {
    return 0;
  }
  const rate = platformFeeRateForAmount(askieFee);
  return Math.round(askieFee * rate * 100) / 100;
}

export function calculatePaymentTotal(askieFee: number): {
  askieFee: number;
  platformFee: number;
  total: number;
  rate: number;
} {
  const fee = Number.isFinite(askieFee) ? askieFee : 0;
  const platformFee = calculatePlatformFee(fee);
  return {
    askieFee: fee,
    platformFee,
    total: Math.round((fee + platformFee) * 100) / 100,
    rate: platformFeeRateForAmount(fee),
  };
}
