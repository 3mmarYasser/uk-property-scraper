/** Price-change decision logic, kept pure so it is trivially unit-testable. */

export type PriceChange = 'INITIAL' | 'INCREASE' | 'DECREASE' | null;

/**
 * Decide whether (and how) to record a price-history row.
 *  - new property, or first time we have a price  -> INITIAL
 *  - price went up / down                          -> INCREASE / DECREASE
 *  - unchanged price, or no price at all           -> null (record nothing)
 */
export function priceChangeType(
  oldPrice: number | null | undefined,
  newPrice: number | null | undefined,
  isNew: boolean,
): PriceChange {
  if (newPrice == null) return null;
  if (isNew || oldPrice == null) return 'INITIAL';
  if (newPrice > oldPrice) return 'INCREASE';
  if (newPrice < oldPrice) return 'DECREASE';
  return null;
}
