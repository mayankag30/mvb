'use client';

import { useEffect, useState } from 'react';

/**
 * The themed reveal, one per collection — keyframes are in globals.css,
 * ported verbatim from design-reference/index.html.
 *
 *   lehengas  veil-drape   mandap curtain closes from both sides, then parts
 *   sarees    veil-unfurl  a band of silk sweeps diagonally across
 *   suits     veil-mist    hill mist lifts and clears upward
 *   gowns     veil-iris    spotlight iris opens from the centre of black
 *
 * Runs on mount, then unmounts so it never blocks a later interaction.
 * Under prefers-reduced-motion the global rule collapses every animation to
 * 0.01ms, so the veil resolves instantly without needing to branch here.
 */
const VEIL: Record<string, string> = {
  lehengas: 'veil-drape',
  sarees: 'veil-unfurl',
  suits: 'veil-mist',
  gowns: 'veil-iris',
  extras: 'veil-casket',
};

// veil-casket keyframes are 1s; clear at 1.1s (same margin as the others)
const TIMEOUT: Record<string, number> = {
  gowns: 1100,
  extras: 1100,
};

export default function CollectionReveal({ slug }: { slug: string }) {
  const veil = VEIL[slug];
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!veil) return;
    const t = setTimeout(() => setDone(true), TIMEOUT[slug] ?? 1200);
    return () => clearTimeout(t);
  }, [veil, slug]);

  if (!veil || done) return null;

  return <div className={`cview-veil ${veil}`} aria-hidden="true" />;
}
