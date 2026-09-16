import type { ColourFamily } from './data/types';

/**
 * Port of family() in design-reference/index.html, and the twin of
 * public.colour_family(hex) in supabase/migrations/0002.
 *
 * The two implementations must agree: the swatch a shopper taps has to match
 * the rows the database returns. colour-family.test.ts asserts they do — if you
 * change a threshold here, change the SQL and re-run that test.
 */
export function family(hex: string): ColourFamily {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;

  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  if (l > 0.8 && s < 0.3) return 'Ivory';
  if (l < 0.18) return 'Black';
  if (s < 0.14) return 'Grey';

  let h = 0;
  if (mx === r) h = 60 * (((g - b) / d) % 6);
  else if (mx === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  if (h < 0) h += 360;

  if (h < 12 || h >= 340) return 'Red';
  if (h < 26) return 'Rust';
  if (h < 48) return 'Gold';
  if (h < 70) return 'Olive';
  if (h < 160) return 'Green';
  if (h < 200) return 'Teal';
  if (h < 255) return 'Blue';
  if (h < 290) return 'Purple';
  return 'Pink';
}

/** FAMILY_HEX from design-reference/index.html — the swatch shown per family. */
export const FAMILY_HEX: Record<ColourFamily, string> = {
  Red: '#9E1039',
  Pink: '#D4456A',
  Rust: '#D98E5C',
  Gold: '#D9A93C',
  Olive: '#6E8C3A',
  Green: '#1C7A6B',
  Teal: '#2E6E8E',
  Blue: '#2B2E7A',
  Purple: '#5A2A7A',
  Black: '#141216',
  Grey: '#5C5C66',
  Ivory: '#EFE8DA',
};
