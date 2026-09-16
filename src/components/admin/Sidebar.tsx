'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { logout } from '@/app/admin/actions/auth';

/** .anav per design-reference/admin.html. Glyphs and labels verbatim. */
const LINKS = [
  { href: '/admin', ic: '◧', label: 'Dashboard' },
  { href: '/admin/inventory', ic: '◈', label: 'Inventory' },
  { href: '/admin/inventory/new', ic: '＋', label: 'Add an item' },
  { href: '/admin/brands', ic: '◆', label: 'Brands' },
  { href: '/admin/enquiries', ic: '✉', label: 'Enquiries' },
  { href: '/admin/shop', ic: '⌖', label: 'Shop details' },
  { href: '/admin/staff', ic: '⚿', label: 'Staff accounts' },
];

export default function Sidebar({ displayName }: { displayName: string }) {
  const pathname = usePathname();

  const isOn = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    if (href === '/admin/inventory') {
      return pathname === '/admin/inventory' || /^\/admin\/inventory\/(?!new)/.test(pathname);
    }
    return pathname.startsWith(href);
  };

  return (
    <aside>
      <div className="abrand">
        MVB
        <small>MAHESH VASTRA BHANDAR</small>
      </div>

      <nav className="anav" id="anav" aria-label="Admin sections">
        {LINKS.map((l) => {
          const on = isOn(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={on ? 'on' : undefined}
              aria-current={on ? 'page' : undefined}
            >
              <span className="ic" aria-hidden="true">
                {l.ic}
              </span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="aout">
        <button
          type="button"
          onClick={() => {
            if (confirm(`Sign out of the admin panel, ${displayName}?`)) logout();
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
