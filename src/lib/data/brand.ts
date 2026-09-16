import type { Item } from './types';

/**
 * The one place that knows how a brand is stored.
 *
 * Commit A: `items.brand` is free text, as 0001 created it.
 * Commit B1: migration 0005 promotes brands to a table and this becomes
 *   `it.brand?.name ?? null` — every caller below stays untouched, so that
 *   commit's diff shows the schema change without component churn.
 *
 * Callers: ProductTile, the collection-page facet builder, the admin
 * inventory table, and the item form's select.
 */
export const brandName = (it: Pick<Item, 'brand'>): string | null =>
  it.brand ?? null;
