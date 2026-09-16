import { getShopSettings } from '@/lib/data';
import ShopForm from '@/components/admin/ShopForm';

export default async function ShopPage() {
  const shop = await getShopSettings();

  return (
    <section className="page">
      <div className="ptop">
        <div>
          <h1 className="ph">Shop details</h1>
          <p className="psub">
            These fields appear on the website’s Visit section, footer and
            WhatsApp button.
          </p>
        </div>
      </div>

      <ShopForm shop={shop} />
    </section>
  );
}
