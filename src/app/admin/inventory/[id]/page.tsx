import { notFound } from 'next/navigation';
import { getItem, listBrandNames, listCollections } from '@/lib/data';
import ItemForm from '@/components/admin/ItemForm';

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, collections, brands] = await Promise.all([
    getItem(id),
    listCollections(),
    listBrandNames(),
  ]);

  if (!item) notFound();

  return (
    <section className="page">
      <div className="ptop">
        <div>
          <h1 className="ph">{item.name}</h1>
          <p className="psub">
            Last updated{' '}
            {new Date(item.updated_at).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
            .
          </p>
        </div>
      </div>

      <ItemForm collections={collections} brands={brands} item={item} />
    </section>
  );
}
