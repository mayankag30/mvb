-- Stock backfill. Run after 0003, which adds the column.
-- stock_qty defaults to 0, so without this every item reads "Sold out".
-- Kept separate from 0003 so the DDL stays independent of the seed data.

update items set stock_qty = 4 + (abs(hashtext(id::text)) % 15);

-- The three items design-reference/index.html has as sold out. DELTA-01 names
-- only the first two; Mirror Work Mojari arrived with the extras collection.
update items set stock_qty = 0
where name in ('Raw Silk Mehendi Lehenga', 'Afghani Salwar Set', 'Mirror Work Mojari');
