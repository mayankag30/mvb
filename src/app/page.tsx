import { getCollectionsWithItems, getShopSettings } from '@/lib/data';
import Nav from '@/components/storefront/Nav';
import Hero from '@/components/storefront/Hero';
import CollectionWorld from '@/components/storefront/CollectionWorld';
import ExtrasStrip from '@/components/storefront/ExtrasStrip';
import EnquiryForm from '@/components/storefront/EnquiryForm';
import VisitMap from '@/components/storefront/VisitMap';
import Footer from '@/components/storefront/Footer';
import Reveal from '@/components/storefront/Reveal';

export const revalidate = 60;

/** Section order and copy verbatim from design-reference/index.html. */
export default async function Page() {
  const [collections, shop] = await Promise.all([
    getCollectionsWithItems(),
    getShopSettings(),
  ]);

  const waDigits = shop.whatsapp.replace(/[^\d]/g, '');

  return (
    <>
      <Nav />

      <Hero />

      {/* extras is rendered as its signposting strip, not a rack */}
      {collections
        .filter((c) => c.slug !== 'extras')
        .map((c) => (
          <CollectionWorld
            key={c.id}
            collection={{ ...c, items: c.items.slice(0, 4) }}
          />
        ))}

      <ExtrasStrip />

      <section className="world" id="enquire">
        <div className="wrap">
          <Reveal className="world-head" style={{ maxWidth: 660 }}>
            <p className="world-tag">NO ONLINE CHECKOUT — ON PURPOSE</p>
            <h2 className="world-h">Tell us what caught your eye</h2>
            <p className="world-p">
              Leave your number and one of our team will message you on WhatsApp,
              share more photos and videos, check sizes and colours, and arrange
              delivery or a store visit.
            </p>
          </Reveal>

          <div className="enq-grid">
            <Reveal>
              <div className="enq-note">
                <h4>We reply on WhatsApp</h4>
                <p>Usually within a few working hours, between 11am and 8pm.</p>
              </div>
              <div className="enq-note">
                <h4>Ask for a video first</h4>
                <p>
                  Fabric never photographs honestly. We will send a short video
                  of the piece in daylight before you decide.
                </p>
              </div>
              <div className="enq-note">
                <h4>Colours beyond the photo</h4>
                <p>
                  Most designs are available in shades we have not listed. Tell
                  us the colour you want and we will check stock.
                </p>
              </div>
              <div className="enq-note">
                <h4>Alterations included</h4>
                <p>
                  Blouse stitching and fall-pico on sarees, and fitting on
                  lehengas and gowns.
                </p>
              </div>
            </Reveal>

            <EnquiryForm />
          </div>
        </div>
      </section>

      <section className="world" id="visit">
        <div className="wrap">
          <Reveal className="world-head">
            <p className="world-tag">COME SEE IT IN PERSON</p>
            <h2 className="world-h">The store</h2>
          </Reveal>

          <VisitMap shop={shop} />
        </div>
      </section>

      <Footer />

      <a
        className="wa"
        href={`https://wa.me/${waDigits}`}
        aria-label="Chat with us on WhatsApp"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.8-.6-3.1-1.3-5.1-4.4-5.3-4.6-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .7.5.2.6.8 2 .9 2.1.1.1.1.3 0 .5l-.4.6-.3.3c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.5.3.1.5.1.6 0l.9-1c.2-.2.4-.2.6-.1l2 1c.2.1.4.2.4.3.1.2.1.6-.1 1.3z" />
        </svg>
      </a>
    </>
  );
}
