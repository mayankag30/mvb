// Ported from design-reference/index.html — fabric(), shade(), fmt().
// Shared by the tile and the collection page so both render identically.

export function shade(hex: string, p: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) + p * 2.55;
  const g = ((n >> 8) & 255) + p * 2.55;
  const b = (n & 255) + p * 2.55;
  const q = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `rgb(${q(r)},${q(g)},${q(b)})`;
}

export function fabric(c: string): string {
  return `linear-gradient(145deg,${c} 0%,${shade(c, -18)} 48%,${shade(c, 14)} 100%)`;
}

/** `₹ 84,500` — space after the symbol, en-IN grouping, no "onwards". */
export function fmt(n: number): string {
  return `₹ ${n.toLocaleString('en-IN')}`;
}
