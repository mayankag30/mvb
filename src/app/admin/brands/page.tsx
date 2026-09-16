import { listBrandNames, getBrandItemCount } from '@/lib/data';
import BrandsClient from '@/components/admin/BrandsClient';

/**
 * Brands admin page — design-reference/admin.html #p-brands.
 *
 * Left panel: table of brands with item counts, Rename and Delete per row,
 * plus a footer row showing unbranded count (read-only).
 * Right fbox: Add brand form.
 *
 * Rename cascades to every item. Delete leaves items unbranded — never
 * removes stock. Both of these facts are in the psub copy verbatim from
 * the reference.
 */
export default async function BrandsPage() {
  const names = await listBrandNames();
  const counts = await Promise.all(names.map((n) => getBrandItemCount(n)));
  const unbranded = await getBrandItemCount(null);

  const brands = names.map((name, i) => ({ name, count: counts[i] }));

  return (
    <section className="page">
      <div className="ptop">
        <div>
          <h1 className="ph">Brands</h1>
          <p className="psub">
            Rename a brand and every item using it updates. Deleting one leaves
            its items unbranded — it never removes stock.
          </p>
        </div>
      </div>

      <BrandsClient brands={brands} unbranded={unbranded} />
    </section>
  );
}
