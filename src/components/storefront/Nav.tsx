'use client';

import { useEffect, useRef, useState } from 'react';

const LINKS = [
  { href: '#lehengas', label: 'Lehengas' },
  { href: '#sarees', label: 'Sarees' },
  { href: '#suits', label: 'Suits' },
  { href: '#gowns', label: 'Gowns' },
  { href: '#extras', label: 'Extras' },
  { href: '#visit', label: 'Visit us' },
];

const RAIL = [
  { href: '#lehengas', label: 'Lehengas' },
  { href: '#sarees', label: 'Sarees' },
  { href: '#suits', label: 'Suits' },
  { href: '#gowns', label: 'Gowns' },
  { href: '#extras', label: 'Extras' },
  { href: '#enquire', label: 'Enquiry' },
];

const SPIED = ['lehengas', 'sarees', 'suits', 'gowns', 'extras', 'enquire'];

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [railShown, setRailShown] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState('');
  const burgerRef = useRef<HTMLButtonElement>(null);

  // nav.classList.toggle('solid', scrollY>80)
  // rail.classList.toggle('show', scrollY>innerHeight*.72)
  useEffect(() => {
    const onScroll = () => {
      setSolid(window.scrollY > 80);
      setRailShown(window.scrollY > window.innerHeight * 0.72);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // highlight the section you are in, on the rail
  useEffect(() => {
    const targets = SPIED.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!targets.length) return;
    const spy = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        }),
      { rootMargin: '-45% 0px -45% 0px' },
    );
    targets.forEach((el) => spy.observe(el));
    return () => spy.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const close = () => {
    setDrawerOpen(false);
    burgerRef.current?.focus();
  };

  return (
    <>
      <nav className={`nav${solid ? ' solid' : ''}`} id="nav">
        <a className="nav-brand" href="#top">
          MVB
        </a>
        <div className="nav-links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </div>
        <button
          ref={burgerRef}
          className="nav-burger"
          id="burger"
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          ☰
        </button>
      </nav>

      <div className={`drawer${drawerOpen ? ' open' : ''}`} id="drawer">
        <button
          className="drawer-close"
          aria-label="Close menu"
          onClick={close}
        >
          ×
        </button>
        {LINKS.map((l, i) => (
          <a
            key={l.href}
            href={l.href}
            onClick={close}
            style={{ animationDelay: `${0.05 + i * 0.045}s` }}
          >
            {l.label}
          </a>
        ))}
        <a
          className="d-cta"
          href="#enquire"
          onClick={close}
          style={{ animationDelay: `${0.05 + LINKS.length * 0.045}s` }}
        >
          Send an enquiry
        </a>
      </div>

      <nav
        className={`rail${railShown ? ' show' : ''}`}
        id="rail"
        aria-label="Jump to a collection"
      >
        {RAIL.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className={active === l.href.slice(1) ? 'on' : undefined}
            aria-current={active === l.href.slice(1) ? 'true' : undefined}
          >
            {l.label}
          </a>
        ))}
      </nav>
    </>
  );
}
