import Link from 'next/link';
import type { CollectionWithItems } from '@/lib/data/types';
import ProductTile from './ProductTile';
import Reveal from './Reveal';
import { Scenery } from './Scenery';

/**
 * A front-page collection section. The rack shows the first four items;
 * the "See all <collection>" button below opens /collections/[slug].
 */
export default function CollectionWorld({
  collection,
}: {
  collection: CollectionWithItems;
}) {
  return (
    <section className="world" id={collection.slug}>
      <Scenery slug={collection.slug} />

      <div className="wrap">
        <Reveal className="world-head">
          {collection.tagline && <p className="world-tag">{collection.tagline}</p>}
          <h2 className="world-h">{collection.heading ?? collection.name}</h2>
          {collection.blurb && <p className="world-p">{collection.blurb}</p>}
        </Reveal>

        <Reveal className="rack">
          {collection.items.map((item) => (
            <ProductTile key={item.id} item={item} />
          ))}
        </Reveal>

        <Reveal className="more-wrap">
          <Link className="more" href={`/collections/${collection.slug}`}>
            {/* no count in the label — it would change as stock moves,
                and the real count already shows in the page header */}
            <span>See all {collection.name.toLowerCase()}</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
