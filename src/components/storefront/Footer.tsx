import Link from 'next/link';

/** Structure and copy verbatim from design-reference/index.html. */
export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="f-brand">MVB</div>
        <p className="f-small" style={{ letterSpacing: '.24em', marginTop: 6 }}>
          MAHESH VASTRA BHANDAR
        </p>
        <div className="f-links">
          <a href="#lehengas">Lehengas</a>
          <a href="#sarees">Sarees</a>
          <a href="#suits">Suits</a>
          <a href="#gowns">Gowns</a>
          <a href="#extras">Extras</a>
          <a href="#enquire">Enquiry</a>
          <Link href="/admin">Staff login</Link>
        </div>
        <p className="f-small">
          © 2026 Mahesh Vastra Bhandar. Browsing only — orders are confirmed over
          WhatsApp with our team.
        </p>
      </div>
    </footer>
  );
}
