'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { logout } from '@/app/admin/actions/auth';
import type { StaffRole } from '@/lib/data/types';

const ALL_LINKS = [
  { href: '/admin', ic: '◧', label: 'Dashboard', roles: ['super', 'editor', 'viewer'] },
  { href: '/admin/inventory', ic: '◈', label: 'Inventory', roles: ['super', 'editor', 'viewer'] },
  { href: '/admin/inventory/new', ic: '＋', label: 'Add an item', roles: ['super', 'editor'] },
  { href: '/admin/brands', ic: '◆', label: 'Brands', roles: ['super', 'editor', 'viewer'] },
  { href: '/admin/enquiries', ic: '✉', label: 'Enquiries', roles: ['super', 'editor', 'viewer'] },
  { href: '/admin/shop', ic: '⌖', label: 'Shop details', roles: ['super'] },
  { href: '/admin/staff', ic: '⚿', label: 'Staff accounts', roles: ['super'] },
];

export default function Sidebar({
  displayName,
  role,
}: {
  displayName: string;
  role: StaffRole;
}) {
  const pathname = usePathname();
  const links = ALL_LINKS.filter((l) => l.roles.includes(role));

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
        {links.map((l) => {
          const on = isOn(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={on ? 'on' : undefined}
              aria-current={on ? 'page' : undefined}
            >
              <span className="ic" aria-hidden="true">{l.ic}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="aout">
        <span style={{ fontSize: 11, color: '#6F6490', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>
          {role.toUpperCase()}
        </span>
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
