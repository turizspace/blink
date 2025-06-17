/**
 * Validates whether a given amount is a valid Bitcoin amount in satoshis
 * @param amount Amount in satoshis
 * @returns boolean indicating if the amount is valid
 */
export function isValidBitcoinAmount(amount: number): boolean {
  // Amount must be positive
  if (amount <= 0) return false;

  // Amount must be a whole number (satoshis are indivisible)
  if (!Number.isInteger(amount)) return false;

  // Amount must not exceed maximum Bitcoin supply (21 million BTC = 21e14 satoshis)
  const MAX_BITCOIN_SUPPLY_SATS = 21e14;
  if (amount > MAX_BITCOIN_SUPPLY_SATS) return false;

  return true;
}

/**
 * Validates a Lightning Network payment request/invoice
 * @param paymentRequest The BOLT11 invoice string
 * @returns boolean indicating if the payment request is valid
 */
export function isValidLightningInvoice(paymentRequest: string): boolean {
  // Basic validation - should start with 'ln' and be base58 encoded
  const LIGHTNING_INVOICE_REGEX = /^ln[0-9a-zA-Z]+$/;
  return LIGHTNING_INVOICE_REGEX.test(paymentRequest);
}

/**
 * Converts Bitcoin amount from BTC to satoshis
 * @param btc Amount in BTC
 * @returns Amount in satoshis
 */
export function btcToSats(btc: number): number {
  return Math.round(btc * 100000000);
}

/**
 * Converts Bitcoin amount from satoshis to BTC
 * @param sats Amount in satoshis
 * @returns Amount in BTC
 */
export function satsToBtc(sats: number): number {
  return sats / 100000000;
}
