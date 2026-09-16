'use client';

import { useActionState, useState } from 'react';
import {
  createItemAction,
  updateItemAction,
  type ItemFormState,
} from '@/app/admin/actions/items';
import { brandName } from '@/lib/data/brand';
import MediaUploader, { type DraftMedia } from './MediaUploader';
import type { Collection, ItemWithRelations } from '@/lib/data/types';

type ColorRow = { key: string; name: string; hex: string };

let rowSeq = 0;
const newRow = (name = '', hex = '#C21E56'): ColorRow => ({
  key: `r${++rowSeq}`,
  name,
  hex,
});

/**
 * Field layout per design-reference/admin.html (#p-add).
 *
 * BRAND is a select, never a free-text input — free text is what let typos
 * create duplicate brands. In this commit its options are the distinct brand
 * values already on items; migration 0005 switches the source to the brands
 * table without changing this markup.
 */
export default function ItemForm({
  collections,
  brands,
  item,
}: {
  collections: Collection[];
  brands: string[];
  item?: ItemWithRelations;
}) {
  const [state, action, pending] = useActionState<ItemFormState | null, FormData>(
    item ? updateItemAction : createItemAction,
    null,
  );

  const [colors, setColors] = useState<ColorRow[]>(
    item?.item_colors.length
      ? item.item_colors.map((c) => newRow(c.name, c.hex))
      : [],
  );

  const initialMedia: DraftMedia[] =
    item?.item_media.map((m) => ({
      public_id: m.public_id,
      url: m.url,
      kind: m.kind,
      is_cover: m.is_cover,
    })) ?? [];

  const currentBrand = item ? brandName(item) : null;

  return (
    <form action={action}>
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="grid2">
        <div className="fbox">
          <h3>Item details</h3>

          <div className="f">
            <label htmlFor="f-name">ITEM NAME</label>
            <input
              id="f-name"
              name="name"
              defaultValue={item?.name}
              placeholder="Rani Bridal Lehenga"
              required
              maxLength={120}
            />
          </div>

          <div className="f2">
            <div className="f">
              <label htmlFor="f-brand">BRAND</label>
              <select id="f-brand" name="brand" defaultValue={currentBrand ?? ''}>
                <option value="">No brand</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="f">
              <label htmlFor="f-collection">COLLECTION</label>
              <select
                id="f-collection"
                name="collection_id"
                defaultValue={item?.collection_id ?? collections[0]?.id}
                required
              >
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="f2">
            <div className="f">
              <label htmlFor="f-price">BASE PRICE (₹)</label>
              <input
                id="f-price"
                name="base_price"
                type="number"
                min={0}
                step={1}
                defaultValue={item?.base_price ?? ''}
                placeholder="84500"
                required
              />
            </div>
            <div className="f">
              <label htmlFor="f-stock">PIECES IN STOCK</label>
              <input
                id="f-stock"
                name="stock_qty"
                type="number"
                min={0}
                step={1}
                defaultValue={item?.stock_qty ?? 1}
              />
            </div>
          </div>

          <div className="f2">
            <div className="f">
              <label htmlFor="f-badge">BADGE (OPTIONAL)</label>
              <input
                id="f-badge"
                name="badge"
                defaultValue={item?.badge ?? ''}
                placeholder="Bridal, New, Best seller"
                maxLength={24}
              />
            </div>
            <div className="f">
              <label htmlFor="f-lowat">LOW STOCK WARNING AT</label>
              <input
                id="f-lowat"
                name="low_stock_at"
                type="number"
                min={0}
                step={1}
                defaultValue={item?.low_stock_at ?? 3}
              />
            </div>
          </div>

          <div className="f">
            <label htmlFor="f-basecolor">BASE COLOUR</label>
            <input
              id="f-basecolor"
              name="base_color"
              type="color"
              defaultValue={item?.base_color ?? '#9E1039'}
              style={{ height: 44, padding: 4 }}
              required
            />
          </div>

          <div className="f">
            <label>OTHER COLOURS AVAILABLE (OPTIONAL)</label>
            <div className="chips">
              {colors.map((row, i) => (
                <span className="chip" key={row.key}>
                  <input
                    className="sw"
                    type="color"
                    name="color_hex"
                    defaultValue={row.hex}
                    aria-label={`Colour ${i + 1} swatch`}
                    style={{ padding: 0, border: 0 }}
                  />
                  <input
                    name="color_name"
                    defaultValue={row.name}
                    placeholder="Name"
                    aria-label={`Colour ${i + 1} name`}
                    maxLength={40}
                    style={{ width: 92, border: 0, background: 'none', padding: 0 }}
                  />
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() =>
                      setColors((prev) => prev.filter((r) => r.key !== row.key))
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                type="button"
                className="btn btn-s"
                style={{ padding: '5px 12px', fontSize: 12.5 }}
                onClick={() => setColors((prev) => [...prev, newRow()])}
              >
                Add colour
              </button>
            </div>
          </div>

          <div className="f">
            <label htmlFor="f-desc">DESCRIPTION</label>
            <textarea
              id="f-desc"
              name="description"
              defaultValue={item?.description ?? ''}
              placeholder="Fabric, work, blouse details, occasion."
              maxLength={2000}
            />
          </div>
        </div>

        <div className="fbox">
          <h3>Photos and video</h3>

          <MediaUploader initial={initialMedia} />

          <p className="note">
            Files are resized and stored in the media bucket; only the link is
            saved in the database.
          </p>

          <div
            className="f"
            style={{
              marginTop: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <label htmlFor="f-visible" style={{ margin: 0 }}>
              SHOW ON WEBSITE
            </label>
            <input
              id="f-visible"
              type="checkbox"
              name="is_visible"
              defaultChecked={item?.is_visible ?? true}
              style={{ width: 20, height: 20, accentColor: '#2E7D52' }}
            />
          </div>

          {state?.error && (
            <p className="note" role="alert" style={{ color: '#9B1F45' }}>
              {state.error}
            </p>
          )}

          <div className="savebar">
            <button className="btn btn-p" type="submit" disabled={pending}>
              {pending ? 'Saving…' : item ? 'Save changes' : 'Save item'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
