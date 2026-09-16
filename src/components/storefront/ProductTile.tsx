'use client';

import { useState } from 'react';
import { fabric, fmt } from '@/lib/fabric';
import { brandName } from '@/lib/data/brand';
import type { ItemWithRelations } from '@/lib/data/types';

/** stockLine() from design-reference/index.html. */
function stockClass(qty: number, lowAt: number) {
  if (qty === 0) return 'tile-stock out';
  if (qty <= lowAt) return 'tile-stock low';
  return 'tile-stock';
}

function stockText(qty: number, lowAt: number) {
  if (qty === 0) return 'Sold out — ask us when it returns';
  if (qty <= lowAt) return `Only ${qty} left`;
  return `${qty} in stock`;
}

export default function ProductTile({ item }: { item: ItemWithRelations }) {
  const swatches = item.item_colors.length
    ? item.item_colors.map((c) => c.hex)
    : [item.base_color];

  const [selected, setSelected] = useState(swatches[0]);

  const soldOut = item.stock_qty === 0;
  const cover =
    item.item_media.find((m) => m.is_cover && m.kind === 'image') ??
    item.item_media.find((m) => m.kind === 'image');
  const showPhoto = cover && selected === swatches[0];

  return (
    <article className={`tile${soldOut ? ' sold' : ''}`}>
      <div className="tile-frame">
        {item.badge && <span className="tile-badge">{item.badge}</span>}
        <div className="tile-fab" style={{ background: fabric(selected) }}>
          {showPhoto && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={cover.url}
              alt={item.name}
              loading="lazy"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}
        </div>
      </div>

      <div className="tile-body">
        <h3 className="tile-name">{item.name}</h3>
        {/* always rendered, nbsp when absent, so rows stay aligned */}
        <p className="tile-brand">{brandName(item) || ' '}</p>

        <div className="tile-row">
          <span className="tile-price">{fmt(item.base_price)}</span>
          <div className="dots">
            {swatches.map((hex, i) => (
              <button
                key={`${hex}-${i}`}
                className="dot"
                style={{ background: hex }}
                aria-label={item.item_colors[i]?.name ?? `Colour ${i + 1}`}
                aria-pressed={selected === hex}
                onClick={() => setSelected(hex)}
              />
            ))}
          </div>
        </div>

        <p className={stockClass(item.stock_qty, item.low_stock_at)}>
          <i />
          {stockText(item.stock_qty, item.low_stock_at)}
        </p>

        <button
          className="tile-ask"
          onClick={() => {
            // write before scrolling so the form's IntersectionObserver sees them
            (window as Record<string, unknown>).__mvb_item_id = item.id;
            (window as Record<string, unknown>).__mvb_item_name = item.name;
            const msg = document.getElementById('f-msg') as HTMLTextAreaElement | null;
            if (msg) msg.value = `I am interested in: ${item.name}`;
            document.getElementById('enquire')?.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => document.getElementById('f-name')?.focus(), 700);
          }}
        >
          {soldOut ? 'Ask about restock' : 'Enquire about this'}
        </button>
      </div>
    </article>
  );
}
