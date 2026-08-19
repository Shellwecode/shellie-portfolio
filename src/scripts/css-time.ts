// Read a CSS time custom property as milliseconds. parseFloat alone drops
// the unit, and the production CSS minifier rewrites `950ms` as `.95s` —
// so a bare parseFloat reader gets a thousandth of the tuned value, in
// builds only. Dev serves the source CSS, so the bug never shows there.
export function cssMs(raw: string, fallback: number): number {
  const v = raw.trim();
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return fallback;
  if (v.endsWith('ms')) return n;
  if (v.endsWith('s')) return n * 1000;
  return n; // unitless dials (e.g. --g-dwell-ms) already mean ms
}
