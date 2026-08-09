/* Dev-only dials for the case-study reading format (.prose--album).
   Every dial writes a --pr-* custom property on <html>; the CSS reads them
   with the shipped aug-8 values as fallbacks, so this panel never ships —
   deleting the mount changes nothing.

   PRESETS: the preset select applies a saved format wholesale, ignoring the
   individual dials — pick "custom (dials)" to hand-tune. Dial defaults are
   the aug-8 frame, so custom starts where the shipped format is. */
import { useEffect } from 'react';
import { useDialKit, DialRoot } from 'dialkit';
import 'dialkit/styles.css';

/* Saved formats. SHIPPED = Shellie's aug-8 dial tune (the Paper frame's
   Bold headings, rhythm opened back up) — also the CSS fallbacks. The
   frame's dense cut and the aug-6 roomy cut stay for A/B. */
const SHIPPED = {
  layout: { measure: 736, top: 0, pGap: 24 },
  h2: { size: 22, lh: 36, weight: '700', above: 28, below: 20 },
  h3: { size: 18, lh: 28, weight: '700', above: 20, below: 16 },
  body: { size: 17.5, lh: 32 },
  bullet: { weight: '600', lh: 32 },
  emScale: 1.0625,
};
const AUG8_FRAME = {
  layout: { measure: 768, top: 0, pGap: 8 },
  h2: { size: 20, lh: 25, weight: '700', above: 20, below: 20 },
  h3: { size: 18, lh: 25, weight: '700', above: 16, below: 16 },
  body: { size: 16, lh: 27 },
  bullet: { weight: '600', lh: 30 },
  emScale: 1.0625,
};
const AUG6 = {
  layout: { measure: 768, top: 0, pGap: 20 },
  h2: { size: 20, lh: 25, weight: '600', above: 50, below: 20 },
  h3: { size: 18, lh: 23, weight: '600', above: 36, below: 20 },
  body: { size: 16, lh: 27 },
  bullet: { weight: '600', lh: 27 },
  emScale: 1.0625,
};
const PRESETS: Record<string, typeof SHIPPED> = {
  'shipped — aug 8 tune': SHIPPED,
  'aug 8 frame — dense': AUG8_FRAME,
  'aug 6 — roomy': AUG6,
};

export default function ProseDirector() {
  const p = useDialKit('Reading format', {
    preset: {
      type: 'select',
      options: ['shipped — aug 8 tune', 'aug 8 frame — dense', 'aug 6 — roomy', 'custom (dials)'],
      default: 'custom (dials)',
    },
    layout: {
      measure: [736, 560, 960, 8], // reading column width
      top: [0, 0, 120, 4], //         air above the first heading
      pGap: [24, 0, 40, 1], //        ¶ gap — the density dial
    },
    h2: {
      size: [22, 16, 30, 1],
      lh: [36, 18, 44, 1],
      weight: { type: 'select', options: ['600', '700'], default: '700' },
      above: [28, 0, 80, 2], //       collapses with pGap — the larger wins
      below: [20, 0, 48, 2],
    },
    h3: {
      size: [18, 14, 24, 1],
      lh: [28, 18, 36, 1],
      weight: { type: 'select', options: ['600', '700'], default: '700' },
      above: [20, 0, 64, 2],
      below: [16, 0, 40, 2],
    },
    body: {
      size: [17.5, 14, 19, 0.5],
      lh: [32, 20, 40, 1],
    },
    bullet: {
      /* strong — the numbered-lead voice */
      weight: { type: 'select', options: ['600', '700'], default: '600' },
      lh: [32, 20, 40, 1],
    },
    emScale: [1.0625, 1, 1.2, 0.0125], // serif italic runs optically small
  });

  useEffect(() => {
    const root = document.documentElement;
    /* A preset overrides the dials wholesale; "custom (dials)" hands back. */
    const v = PRESETS[p.preset] ?? p;
    const vars: Record<string, string> = {
      '--pr-measure': `${v.layout.measure}px`,
      '--pr-top': `${v.layout.top}px`,
      '--pr-p-gap': `${v.layout.pGap}px`,
      '--pr-h2-size': `${v.h2.size}px`,
      '--pr-h2-lh': `${v.h2.lh}px`,
      '--pr-h2-weight': `${v.h2.weight}`,
      '--pr-h2-above': `${v.h2.above}px`,
      '--pr-h2-below': `${v.h2.below}px`,
      '--pr-h3-size': `${v.h3.size}px`,
      '--pr-h3-lh': `${v.h3.lh}px`,
      '--pr-h3-weight': `${v.h3.weight}`,
      '--pr-h3-above': `${v.h3.above}px`,
      '--pr-h3-below': `${v.h3.below}px`,
      '--pr-body-size': `${v.body.size}px`,
      '--pr-body-lh': `${v.body.lh}px`,
      '--pr-strong-weight': `${v.bullet.weight}`,
      '--pr-strong-lh': `${v.bullet.lh}px`,
      '--pr-em-size': `${v.emScale}em`,
    };
    for (const [k, val] of Object.entries(vars)) root.style.setProperty(k, val);
  }, [p]);

  return <DialRoot position="top-right" />;
}
