import type { ShopSettings } from '@/lib/data/types';
import Reveal from './Reveal';

/**
 * Structure and labels verbatim from design-reference/index.html.
 * Values come from shop_settings so staff can edit them; the reference's
 * hardcoded strings are the same data.
 */
export default function VisitMap({ shop }: { shop: ShopSettings }) {
  const d = 0.007;
  const bbox = [
    shop.lng - d,
    shop.lat - d / 1.4,
    shop.lng + d,
    shop.lat + d / 1.4,
  ]
    .map((n) => n.toFixed(4))
    .join('%2C');
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${shop.lat}%2C${shop.lng}`;
  const waDigits = shop.whatsapp.replace(/[^\d]/g, '');

  return (
    <div className="visit-grid">
      <Reveal className="visit-card">
        <dl>
          <div className="vline">
            <dt>ADDRESS</dt>
            {/* the reference breaks address and hours across two lines */}
            <dd id="s-addr" style={{ whiteSpace: 'pre-line' }}>
              {shop.address}
            </dd>
          </div>
          <div className="vline">
            <dt>WHATSAPP</dt>
            <dd>
              <a href={`https://wa.me/${waDigits}`} id="s-wa">
                {shop.whatsapp}
              </a>
            </dd>
          </div>
          {shop.phone && (
            <div className="vline">
              <dt>CALL</dt>
              <dd>
                <a href={`tel:${shop.phone.replace(/[^\d+]/g, '')}`} id="s-tel">
                  {shop.phone}
                </a>
              </dd>
            </div>
          )}
          {shop.email && (
            <div className="vline">
              <dt>EMAIL</dt>
              <dd>
                <a href={`mailto:${shop.email}`} id="s-mail">
                  {shop.email}
                </a>
              </dd>
            </div>
          )}
          {shop.hours && (
            <div className="vline">
              <dt>OPEN</dt>
              <dd id="s-hours" style={{ whiteSpace: 'pre-line' }}>
                {shop.hours}
              </dd>
            </div>
          )}
        </dl>
      </Reveal>

      <Reveal className="map">
        <iframe
          title="Store location on map"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={embed}
        />
      </Reveal>
    </div>
  );
}
