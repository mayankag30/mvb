'use client';

import { useActionState } from 'react';
import { updateShopAction, type ShopState } from '@/app/admin/actions/shop';
import type { ShopSettings } from '@/lib/data/types';

/**
 * .grid2 > .fbox per design-reference/admin.html. The reference has two Save
 * buttons, one per panel; both write the same single shop_settings row, so
 * this is one form with the contact and map panels inside it.
 */
export default function ShopForm({ shop }: { shop: ShopSettings }) {
  const [state, action, pending] = useActionState<ShopState | null, FormData>(
    updateShopAction,
    null,
  );

  const d = 0.007;
  const bbox = [shop.lng - d, shop.lat - d / 1.4, shop.lng + d, shop.lat + d / 1.4]
    .map((n) => n.toFixed(4))
    .join('%2C');

  return (
    <form action={action}>
      <div className="grid2">
        <div className="fbox">
          <h3>Contact</h3>

          <div className="f">
            <label htmlFor="s-name">SHOP NAME</label>
            <input id="s-name" name="name" defaultValue={shop.name} required maxLength={120} />
          </div>

          <div className="f">
            <label htmlFor="s-address">ADDRESS</label>
            <textarea
              id="s-address"
              name="address"
              defaultValue={shop.address}
              required
              maxLength={400}
            />
          </div>

          <div className="f2">
            <div className="f">
              <label htmlFor="s-wa">WHATSAPP NUMBER</label>
              <input id="s-wa" name="whatsapp" defaultValue={shop.whatsapp} required />
            </div>
            <div className="f">
              <label htmlFor="s-phone">PHONE</label>
              <input id="s-phone" name="phone" defaultValue={shop.phone ?? ''} />
            </div>
          </div>

          <div className="f">
            <label htmlFor="s-email">EMAIL</label>
            <input id="s-email" name="email" type="email" defaultValue={shop.email ?? ''} />
          </div>

          <div className="f">
            <label htmlFor="s-hours">OPENING HOURS</label>
            <input id="s-hours" name="hours" defaultValue={shop.hours ?? ''} maxLength={200} />
          </div>
        </div>

        <div className="fbox">
          <h3>Map location</h3>

          <div className="f2">
            <div className="f">
              <label htmlFor="s-lat">LATITUDE</label>
              <input
                id="s-lat"
                name="lat"
                type="number"
                step="0.000001"
                min={-90}
                max={90}
                defaultValue={shop.lat}
                required
              />
            </div>
            <div className="f">
              <label htmlFor="s-lng">LONGITUDE</label>
              <input
                id="s-lng"
                name="lng"
                type="number"
                step="0.000001"
                min={-180}
                max={180}
                defaultValue={shop.lng}
                required
              />
            </div>
          </div>

          <div
            style={{
              border: '1px solid var(--line)',
              borderRadius: 3,
              overflow: 'hidden',
              height: 250,
            }}
          >
            <iframe
              title="Store location"
              style={{ width: '100%', height: '100%', border: 0 }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${shop.lat}%2C${shop.lng}`}
            />
          </div>
          <p className="note">
            Drag the pin or paste coordinates. The website map updates on save.
          </p>
        </div>
      </div>

      <div className="savebar" style={{ marginTop: 18 }}>
        <button className="btn btn-p" type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </button>
        {state?.error && <p className="note" style={{ color: '#9B1F45' }}>{state.error}</p>}
        {state?.ok && <p className="note">Saved. The website updates within a minute.</p>}
      </div>
    </form>
  );
}
