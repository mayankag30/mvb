// Parity test for the two colour-family implementations:
//   - family()              in src/lib/colour-family.ts   (TS, used by mock mode)
//   - public.colour_family() in supabase/migrations/0003    (PL/pgSQL, used by Postgres)
//
// The delta calls this out as drifting silently: if the two disagree, the
// swatch a shopper taps will not match the rows the database returns.
//
// There is no database in Phase 1, so this does two things:
//   1. runs a reference implementation transcribed from the SQL and asserts it
//      agrees with the TS version on every catalogue hex and on the boundaries
//   2. parses the real thresholds out of 0003 and asserts they are the numbers
//      both implementations were written against — so editing one file without
//      the other fails here
//
// Run: node --test src/lib/colour-family.test.ts

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { family } from './colour-family.ts';

const SQL = readFileSync('supabase/migrations/0003_collections_filters_stock.sql', 'utf8');

/**
 * Transcribed line by line from public.colour_family() in 0003.
 * Deliberately a separate transcription rather than a call to family() —
 * if it were the same code the test would prove nothing.
 */
function sqlFamily(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255.0;
  const g = parseInt(hex.slice(3, 5), 16) / 255.0;
  const b = parseInt(hex.slice(5, 7), 16) / 255.0;

  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  if (l > 0.8 && s < 0.3) return 'Ivory';
  if (l < 0.18) return 'Black';
  if (s < 0.14) return 'Grey';

  let h: number;
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

/** Every hex in the seeded catalogue, from design-reference/index.html. */
const CATALOGUE_HEXES = [
  // lehengas
  '#9E1039', '#C21E56', '#7A0F2B', '#E0A73C',
  '#E39BB4', '#F2D98B', '#9FD0C4',
  '#EFE3CB', '#DCC79A', '#C9A96E',
  '#1E2A63', '#0F3B3A', '#5B1B4A',
  '#E8A317', '#EE8B2A',
  '#1C7A6B',
  '#C8D6E8', '#E8CFD8', '#DCE8D4',
  '#5A2A7A', '#0F4A3C',
  '#3A3A44', '#8E2540',
  '#6E8C3A', '#D98E5C',
  // sarees
  '#8C1C2E', '#0F6B62', '#D9A93C', '#2B2E7A',
  '#B0345A', '#1E5E52',
  '#9CC7D8', '#F0C6D4', '#EADFC6',
  '#6E1F3C', '#0E3B44',
  '#EFE8DA', '#D6E4E0', '#EADCC8',
  '#A6B7DA', '#C4D8C0',
  '#141216', '#C38E2E',
  '#E8DFC8',
  // suits
  '#F2EFE2', '#CFE0DA', '#E6D2C0',
  '#7FB6A5', '#E7A76A',
  '#4F8C7E', '#C6577A',
  '#2E6E8E', '#8C3D57', '#B7883F',
  '#2A4A6E', '#5C6E3A',
  '#C4A46A', '#7A3A2E', '#3A5A4A',
  '#4A1E5C',
  '#D8C4B0',
  '#3A6E6A', '#B0654A',
  '#D4456A',
  // gowns
  '#4A0E2C', '#123B3A',
  '#2A2A5E',
  '#E0AFB4', '#B6C7D8', '#EDD9B7',
  '#0F4A3C',
  // family swatches themselves
  '#6E8C3A', '#5C5C66',
];

test('TS and SQL agree on every hex in the catalogue', () => {
  for (const hex of CATALOGUE_HEXES) {
    assert.equal(
      family(hex),
      sqlFamily(hex),
      `${hex}: TS said ${family(hex)}, SQL said ${sqlFamily(hex)}`,
    );
  }
});

test('TS and SQL agree across the whole 24-bit-ish space', () => {
  // step through a coarse grid of the RGB cube rather than all 16.7M
  for (let r = 0; r < 256; r += 17) {
    for (let g = 0; g < 256; g += 17) {
      for (let b = 0; b < 256; b += 17) {
        const hex =
          '#' +
          [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
        const a = family(hex);
        const c = sqlFamily(hex);
        if (a !== c) {
          assert.fail(`${hex}: TS said ${a}, SQL said ${c}`);
        }
      }
    }
  }
});

test('threshold boundaries land in the same bucket', () => {
  // values chosen to sit either side of each documented cut
  const edges = [
    '#FFFFFF', // l=1  s=0      -> Ivory
    '#CCCCCC', // l>.8 s=0      -> Ivory
    '#000000', // l=0           -> Black
    '#2C2C2C', // l<.18         -> Black
    '#808080', // s<.14         -> Grey
    '#7F8081', // s just under .14
    '#FF0000', // h=0           -> Red
    '#FF3200', // h~12          -> Rust boundary
    '#FF6E00', // h~26          -> Gold boundary
    '#FFCC00', // h~48          -> Olive boundary
    '#E6FF00', // h~66          -> Olive
    '#00FF40', // h~135         -> Green
    '#00FFD4', // h~170         -> Teal
    '#0080FF', // h~210         -> Blue
    '#4000FF', // h~255         -> Purple boundary
    '#AA00FF', // h~280         -> Purple
    '#FF00AA', // h~320         -> Pink
    '#FF0055', // h~340         -> Red boundary
  ];
  for (const hex of edges) {
    assert.equal(family(hex), sqlFamily(hex), `${hex} disagrees at a boundary`);
  }
});

test('migration 0003 still carries the thresholds both sides assume', () => {
  // if someone edits the SQL thresholds without editing colour-family.ts
  // (or vice versa), this fails rather than drifting silently
  const expected: [string, RegExp][] = [
    ['ivory', /l > 0\.8\s+and s < 0\.3\s+then return 'Ivory'/],
    ['black', /l < 0\.18\s+then return 'Black'/],
    ['grey', /s < 0\.14\s+then return 'Grey'/],
    ['red', /h <\s+12 or h >= 340 then return 'Red'/],
    ['rust', /h <\s+26 then return 'Rust'/],
    ['gold', /h <\s+48 then return 'Gold'/],
    ['olive', /h <\s+70 then return 'Olive'/],
    ['green', /h < 160 then return 'Green'/],
    ['teal', /h < 200 then return 'Teal'/],
    ['blue', /h < 255 then return 'Blue'/],
    ['purple', /h < 290 then return 'Purple'/],
  ];
  for (const [name, re] of expected) {
    assert.match(SQL, re, `0003 no longer contains the ${name} threshold`);
  }
});

test('generated column and its index are declared', () => {
  assert.match(
    SQL,
    /alter table item_colors add column family text\s+generated always as \(public\.colour_family\(hex\)\) stored/,
  );
  assert.match(SQL, /create index on item_colors \(family\)/);
});
