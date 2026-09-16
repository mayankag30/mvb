import Link from 'next/link';
import { listCollections, listItems } from '@/lib/data';
import { brandName } from '@/lib/data/brand';
import VisibilityToggle from '@/components/admin/VisibilityToggle';
import DeleteItemButton from '@/components/admin/DeleteItemButton';
import InventoryTools from '@/components/admin/InventoryTools';
import SortHeader from '@/components/admin/SortHeader';

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * Ten columns per design-reference/admin.html — two deliberately unlabelled,
 * the thumbnail at the left and the row actions at the right:
 *
 *   (thumb) ITEM COLLECTION BASE COLOUR OTHER COLOURS PRICE IN STOCK MEDIA ON SITE (actions)
 *
 * Search, filters and sort live in URL search params and are applied here on
 * the server, so a filtered view is shareable and the table never ships rows
 * it is not showing.
 *
 * The table scrolls horizontally inside .panel rather than squashing
 * (min-width:720px in admin.css). Never hide a column to make it fit — staff
 * need stock and visibility most on a small screen.
 */
export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v) ?? '';

  const q = one(sp.q).trim();
  const collectionSlug = one(sp.collection);
  const visibility = one(sp.visibility);
  const sort = one(sp.sort);
  const dir: 'asc' | 'desc' = one(sp.dir) === 'desc' ? 'desc' : 'asc';

  const [allItems, collections] = await Promise.all([
    listItems(),
    listCollections(),
  ]);
  const name = new Map(collections.map((c) => [c.id, c.name]));
  const slug = new Map(collections.map((c) => [c.id, c.slug]));

  // unrecognised values are ignored rather than trusted
  const validSlug = collections.some((c) => c.slug === collectionSlug)
    ? collectionSlug
    : '';
  const validVis = visibility === 'visible' || visibility === 'hidden' ? visibility : '';

  const needle = q.toLowerCase();
  let items = allItems.filter((it) => {
    if (validSlug && slug.get(it.collection_id) !== validSlug) return false;
    if (validVis === 'visible' && !it.is_visible) return false;
    if (validVis === 'hidden' && it.is_visible) return false;
    if (needle) {
      const brand = brandName(it) ?? '';
      const haystack = `${it.name} ${brand} ${it.badge ?? ''}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  if (sort === 'item' || sort === 'collection') {
    const key = (it: (typeof items)[number]) =>
      sort === 'item'
        ? it.name.toLowerCase()
        : (name.get(it.collection_id) ?? '').toLowerCase();
    items = [...items].sort((a, b) => {
      const cmp = key(a).localeCompare(key(b), 'en');
      return dir === 'desc' ? -cmp : cmp;
    });
  }

  return (
    <section className="page">
      <div className="ptop">
        <div>
          <h1 className="ph">Inventory</h1>
          <p className="psub">
            Turn the toggle off to hide an item from the website without
            deleting it.
          </p>
        </div>
        <Link className="btn btn-p" href="/admin/inventory/new">
          Add an item
        </Link>
      </div>

      <div className="panel">
        <InventoryTools
          collections={collections}
          total={allItems.length}
          shown={items.length}
          q={q}
          collection={validSlug}
          visibility={validVis}
        />
        <table>
          <thead>
            <tr>
              <th />
              <th aria-sort={sort === 'item' ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                <SortHeader
                  column="item"
                  label="ITEM"
                  active={sort === 'item'}
                  dir={dir}
                />
              </th>
              <th aria-sort={sort === 'collection' ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                <SortHeader
                  column="collection"
                  label="COLLECTION"
                  active={sort === 'collection'}
                  dir={dir}
                />
              </th>
              <th>BASE COLOUR</th>
              <th>OTHER COLOURS</th>
              <th>PRICE</th>
              <th>IN STOCK</th>
              <th>MEDIA</th>
              <th>ON SITE</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const brand = brandName(item);
              return (
                <tr key={item.id}>
                  <td>
                    <div
                      className="thumb"
                      style={{
                        background: `linear-gradient(150deg,${item.base_color},rgba(0,0,0,.35))`,
                      }}
                    />
                  </td>
                  <td>
                    <span className="iname">{item.name}</span>
                    <br />
                    <span className="ibrand">
                      {brand ?? (
                        <i style={{ fontStyle: 'normal', opacity: 0.6 }}>
                          No brand
                        </i>
                      )}
                    </span>
                  </td>
                  <td>{name.get(item.collection_id) ?? '—'}</td>
                  <td>
                    <span className="sws">
                      <span
                        className="sw"
                        style={{ background: item.base_color }}
                        title={item.base_color}
                      />
                    </span>
                  </td>
                  <td>
                    <span className="sws">
                      {item.item_colors.map((c) => (
                        <span
                          key={c.id}
                          className="sw"
                          style={{ background: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </span>
                  </td>
                  <td>{inr.format(item.base_price)}</td>
                  <td>
                    <StockCell qty={item.stock_qty} lowAt={item.low_stock_at} />
                  </td>
                  <td style={{ fontSize: 13, color: '#7A6D95' }}>
                    {item.item_media.length || '—'}
                  </td>
                  <td>
                    <VisibilityToggle
                      itemId={item.id}
                      isVisible={item.is_visible}
                    />
                  </td>
                  <td>
                    <span className="rowacts">
                      <Link className="lk" href={`/admin/inventory/${item.id}`}>
                        Edit
                      </Link>
                      <DeleteItemButton itemId={item.id} itemName={item.name} />
                    </span>
                  </td>
                </tr>
              );
            })}
            {!items.length && (
              <tr>
                <td colSpan={10} className="empty">
                  {allItems.length
                    ? 'No items match that search or filter.'
                    : 'No items yet. Add your first piece to get the storefront populated.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * In Stock cell per design-reference/admin.html. No pulse here — the delta is
 * explicit that emberPulse is storefront-only; a blinking list is unusable.
 */
function StockCell({ qty, lowAt }: { qty: number; lowAt: number }) {
  if (qty === 0) {
    return (
      <span className="stk out">
        <b>0</b>
        <small>SOLD OUT</small>
      </span>
    );
  }
  if (qty <= lowAt) {
    return (
      <span className="stk low">
        <b>{qty}</b>
        <small>RUNNING LOW</small>
      </span>
    );
  }
  return (
    <span className="stk">
      <b>{qty}</b>
    </span>
  );
}
