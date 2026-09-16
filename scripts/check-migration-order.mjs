// Asserts that supabase/migrations applies in a dependency-correct order.
// The order must be explicit, not a side effect of filenames: two files both
// numbered 0002 once applied correctly only by alphabetical luck.
//
// Run: node scripts/check-migration-order.mjs

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'supabase/migrations';
const files = readdirSync(DIR).filter(f => f.endsWith('.sql')).sort();

function scan(sql) {
  const defs = [];
  const add = (re, kind, g = 1) => {
    for (const m of sql.matchAll(re)) defs.push([m.index, kind, m[g]]);
  };
  add(/create table (\w+)/g, 'table');
  add(/create or replace function (?:public\.)?(\w+)/g, 'function');

  const reqs = [];
  const need = (re, kind, g = 1) => {
    for (const m of sql.matchAll(re)) reqs.push([m.index, kind, g ? m[g] : kind]);
  };
  for (const m of sql.matchAll(/\bis_staff\(\)/g)) reqs.push([m.index, 'function', 'is_staff']);
  for (const m of sql.matchAll(/public\.colour_family\(hex\)\) stored/g))
    reqs.push([m.index, 'function', 'colour_family']);
  need(/references (\w+)\(/g, 'table');
  need(/alter table (\w+)/g, 'table');
  need(/\bfrom (items|brands)\b/g, 'table');
  need(/\bupdate (items|brands)\b/g, 'table');
  return { defs, reqs };
}

const available = new Set(['table:auth.users']);
let failed = false;

for (const f of files) {
  const sql = readFileSync(join(DIR, f), 'utf8');
  const { defs, reqs } = scan(sql);
  const localAt = new Map();
  for (const [pos, kind, name] of defs) {
    const k = `${kind}:${name}`;
    if (!localAt.has(k) || pos < localAt.get(k)) localAt.set(k, pos);
  }
  const unmet = new Set();
  for (const [pos, kind, name] of reqs) {
    const k = `${kind}:${name}`;
    if (name === 'auth.users' || available.has(k)) continue;
    if (localAt.has(k) && localAt.get(k) < pos) continue; // defined above in this file
    unmet.add(k);
  }
  if (unmet.size) {
    failed = true;
    console.error(`FAIL ${f}\n       unmet: ${[...unmet].sort().join(', ')}`);
  } else {
    console.log(`ok   ${f}`);
  }
  for (const [, kind, name] of defs) available.add(`${kind}:${name}`);
}

// the three orderings that actually matter
const where = (needle) =>
  files.filter(f => readFileSync(join(DIR, f), 'utf8').includes(needle));
const checks = [
  ['is_staff() defined before any policy calling it',
    where('function public.is_staff')[0], where('create policy').filter(f =>
      readFileSync(join(DIR, f), 'utf8').match(/create policy[\s\S]*?is_staff/))],
  ['colour_family() defined before its generated column',
    where('function public.colour_family')[0], where('colour_family(hex)) stored')],
  ['brands created before the brand_id backfill',
    where('create table brands')[0], where('set brand_id')],
];
for (const [label, definer, users] of checks) {
  const bad = users.filter(u => u < definer);
  if (bad.length) { failed = true; console.error(`FAIL ${label}: ${bad} precede ${definer}`); }
  else console.log(`ok   ${label}`);
}

// no duplicate numeric prefixes
const nums = files.map(f => f.slice(0, 4));
const dupes = nums.filter((n, i) => nums.indexOf(n) !== i);
if (dupes.length) { failed = true; console.error(`FAIL duplicate migration numbers: ${[...new Set(dupes)]}`); }
else console.log('ok   migration numbers are unique');

process.exit(failed ? 1 : 0);
