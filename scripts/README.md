# scripts/

## fingerprint.mjs

Semantic fingerprint of the running site: every fact the rendered pages
assert — item names, brands, prices, stock lines, badges, counts, admin
table shape, dashboard figures, shop settings, select options.

It deliberately ignores build ids, chunk names and RSC framing, and strips
React's `<!-- -->` text separators, so two runs are comparable across a
rebuild.

### Why it exists

B1 swaps the data layer from `mock.ts` to Supabase and **must produce no
visible change**. That is the whole point of splitting it from B2: if the
site looks different afterwards, the swap is wrong rather than the features.

`baseline-mock.json` is the fingerprint taken from `DATA_SOURCE=mock` before
the swap. After the swap, run the same script against Supabase and diff:

```bash
npm run dev                                  # DATA_SOURCE=supabase
node scripts/fingerprint.mjs > /tmp/after.json
diff <(jq -S . scripts/baseline-mock.json) <(jq -S . /tmp/after.json)
```

An empty diff is the pass condition for B1.

Two differences are expected and acceptable:
  - enquiry `created_at` values, and therefore "THIS WEEK" and the relative
    "N min ago" column, since the seeded timestamps are relative to when the
    seed ran
  - row ordering where `display_order` ties, unless the query adds a
    tiebreak

Everything else differing means a real defect: a missing join, a dropped
nullable, a wrong order-by, or a count computed over the wrong set.
