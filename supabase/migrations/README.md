# Migrations

Apply in numeric order. The order is dependency-correct and **not incidental** —
`scripts/check-migration-order.mjs` asserts it.

| # | File | Adds | Depends on |
|---|---|---|---|
| 0001 | `init.sql` | enums, staff, collections, items (`brand` free text), item_colors, item_media, enquiries, enquiry_notes, shop_settings, touch triggers | `auth.users` |
| 0002 | `rls.sql` | RLS on every table, `is_staff()`, all policies, enquiry rate-limit trigger | 0001 |
| 0003 | `collections_filters_stock.sql` | `items.stock_qty`, `items.low_stock_at`, `colour_family()`, `item_colors.family` generated column, indexes | 0001 |
| 0004 | `seed_stock.sql` | stock values on seeded rows | 0003 |
| 0005 | `brands.sql` | `brands` table, `items.brand_id`, backfill from `items.brand`, drops `items.brand`, RLS + policies | 0002 (`is_staff`), 0001 (`items.brand`) |

## Three orderings that matter

- **`is_staff()` before any policy that calls it.** Defined in 0002; the only
  later caller is 0005.
- **`colour_family()` before the generated column using it.** Both in 0003,
  function first.
- **`brands` before the `brand_id` backfill.** Both in 0005, table first.

## Numbering

DELTA-01 names these files `0002` and `0004`. Those numbers mean *next free*,
not literal: `0002` was already taken by `rls.sql` and `0004` by the stock
seed. Two files both numbered `0002` applied in the right order only by
alphabetical luck, which would have broken the moment anything was renamed.

## Do not edit a migration that has run

`0001` and `0002` ran before delta 01. Corrections go in a new file.

## After 0004

`stock_qty` defaults to 0, so **every item reads "Sold out" until 0004 runs.**
It sets a spread of stock and zeroes the three items the reference has as sold
out: `Raw Silk Mehendi Lehenga`, `Afghani Salwar Set`, `Mirror Work Mojari`.
