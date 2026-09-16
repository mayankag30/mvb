import { listBrandNames, listCollections } from '@/lib/data';
import ItemForm from '@/components/admin/ItemForm';

export default async function NewItemPage() {
  const [collections, brands] = await Promise.all([
    listCollections(),
    listBrandNames(),
  ]);

  return (
    <section className="page">
      <div className="ptop">
        <div>
          <h1 className="ph">Add an item</h1>
          <p className="psub">
            It appears on the website as soon as you save it with “Show on
            website” on.
          </p>
        </div>
      </div>

      <ItemForm collections={collections} brands={brands} />
    </section>
  );
}
