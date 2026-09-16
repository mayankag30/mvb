import Link from 'next/link';
import Reveal from './Reveal';

/**
 * Extras is a real collection. The six-card strip stays on the front page as
 * signposting, with a "See all extras" button below it; the actual items live
 * on /collections/extras. Copy and glyphs verbatim.
 */
const EXTRAS = [
  { ic: '◈', n: 'Dupattas', c: 'Organza, net, banarasi' },
  { ic: '✦', n: 'Jewellery', c: 'Kundan, polki, oxidised' },
  { ic: '❂', n: 'Potli bags', c: 'Beaded and embroidered' },
  { ic: '❖', n: 'Belts & waist chains', c: 'Saree and lehenga belts' },
  { ic: '✧', n: 'Juttis', c: 'Punjabi and mojari' },
  { ic: '❀', n: 'Hair accessories', c: 'Maang tikka, gajra, pins' },
];

export default function ExtrasStrip() {
  return (
    <section className="world" id="extras">
      <div className="wrap">
        <Reveal className="world-head">
          <p className="world-tag">FINISHING TOUCHES</p>
          <h2 className="world-h">The bits that change the whole look</h2>
        </Reveal>

        <Reveal className="extras-row">
          {EXTRAS.map((e) => (
            <div className="extra" key={e.n}>
              <div className="extra-ic">{e.ic}</div>
              <div className="extra-n">{e.n}</div>
              <div className="extra-c">{e.c}</div>
            </div>
          ))}
        </Reveal>

        <Reveal className="more-wrap">
          <Link className="more" href="/collections/extras">
            <span>See all extras</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
