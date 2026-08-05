/* Dev-only dials for the case-study album→reading switch ([slug].astro).
   Every slider writes a --sw-* custom property on <html>; the switch CSS
   reads them with the shipped values as fallbacks, so this panel never
   ships — deleting the mount changes nothing. The breakpoint dials write
   window.__albumSwitch, read live by the scroll handler. Play enter/exit
   replays the choreography in place via the album-switch:force event.

   PRESETS: the preset select applies a saved version wholesale, ignoring
   the individual dials — pick "custom (dials)" to hand-tune again. The
   dials' defaults are ver 3, so custom starts where ver 3 left off. */
import { useEffect } from 'react';
import { useDialKit, DialRoot } from 'dialkit';
import 'dialkit/styles.css';
import Lenis from 'lenis';

/* Named curves for the pour's fall — dialing bezier handles is noise;
   picking a character is the real decision. */
const EASE: Record<string, string> = {
  'accelerate (shipped)': 'cubic-bezier(0.55, 0, 0.7, 0.5)',
  'settle (ease-out)': 'cubic-bezier(0.22, 1, 0.36, 1)',
  standard: 'cubic-bezier(0.5, 0, 0.3, 1)',
  'anticipate (dip first)': 'cubic-bezier(0.36, -0.18, 0.66, 0.6)',
  linear: 'linear',
};

/* Saved tuning sessions (Aug 4). Ver 2 and ver 3 share the breakpoint and
   the pour numbers — they differ in variant and the collapse/article/player
   choreography around it. Ver 4 combines them: ver 3's pour structure
   (causality, continuous handoff) with the recede's calm borrowed as a
   soft blur on the exhaling copy, and the stagger widened so the rows
   read as dealt tracks instead of one slipping sheet. */
const V3 = {
  variant: 'pour',
  breakpoint: { enter: 80, land: 42, settle: 500 },
  pour: { fall: 54, fallDur: 300, fallFade: 220, stagger: 18, topFirst: false, shrink: 0.96, ease: 'accelerate (shipped)', copyBlur: 0 },
  cover: { flyDur: 380, fadeDelay: 210, endScale: 0.31 },
  collapse: { headerDur: 350, headerDelay: 140, shelfDur: 330, shelfDelay: 170 },
  article: { rise: 38, riseDur: 880, riseDelay: 370 },
  player: { arriveDelay: 60 },
  recede: { blur: 7, shrink: 0.935 },
};
const V2 = {
  ...V3,
  variant: 'recede',
  cover: { flyDur: 300, fadeDelay: 210, endScale: 0.32 },
  collapse: { headerDur: 270, headerDelay: 120, shelfDur: 250, shelfDelay: 170 },
  article: { rise: 33, riseDur: 880, riseDelay: 490 },
  player: { arriveDelay: 90 },
  recede: { blur: 7.5, shrink: 0.935 },
};
const V4 = {
  variant: 'pour',
  breakpoint: { enter: 80, land: 42, settle: 500 },
  /* Shellie's tune (Aug 4 evening): tight 16ms stagger — the pour reads as
     one sheet, speed over articulation; heavier 4.5px copy dissolve; cover
     flies longer (440ms) and fades late (370ms) at endScale 0.29 ≈ the
     thumb's real 0.26, restoring the literal merge onto the player. */
  pour: { fall: 54, fallDur: 300, fallFade: 240, stagger: 16, topFirst: false, shrink: 0.945, ease: 'accelerate (shipped)', copyBlur: 4.5 },
  cover: { flyDur: 440, fadeDelay: 370, endScale: 0.29 },
  collapse: { headerDur: 300, headerDelay: 140, shelfDur: 330, shelfDelay: 170 },
  article: { rise: 42, riseDur: 880, riseDelay: 300 },
  player: { arriveDelay: 40 },
  recede: { blur: 3.5, shrink: 0.955 }, // softened, if the variant is revisited
};
const V5 = {
  ...V4,
  cover: { ...V3.cover }, // ver 4's rhythm, ver 3's cover: the quick dart that vanishes mid-flight
};
const PRESETS: Record<string, typeof V3> = {
  'ver 5 — v4 + v3 cover': V5,
  'ver 4 — hybrid': V4,
  'ver 3 — pour': V3,
  'ver 2 — recede': V2,
};

export default function AlbumSwitchDirector() {
  /* Dial defaults = ver 4 (Aug 4). */
  const p = useDialKit('Album switch', {
    preset: {
      type: 'select',
      options: ['ver 5 — v4 + v3 cover', 'ver 4 — hybrid', 'ver 3 — pour', 'ver 2 — recede', 'custom (dials)'],
      default: 'ver 5 — v4 + v3 cover',
    },
    breakpoint: {
      enter: [80, 20, 400, 5], //  px scrolled — the absolute point
      land: [42, 0, 200, 2], //    where the switch deposits the reader
      settle: [500, 0, 1500, 20], // ms the pin holds off flick inertia; 0 = off
    },
    variant: { type: 'select', options: ['pour', 'recede'], default: 'pour' },
    smoothScroll: true, //          Lenis glide; off = native scroll, no momentum
    pour: {
      fall: [54, 0, 220, 2], //     px the rows drop toward the player
      fallDur: [300, 100, 900, 10],
      fallFade: [240, 60, 900, 10],
      stagger: [16, 0, 140, 2], //  ms between rows — tight: one sheet, not a deal
      topFirst: false, //           flip the deal: top row leaves first
      shrink: [0.945, 0.85, 1, 0.005],
      ease: { type: 'select', options: Object.keys(EASE), default: 'accelerate (shipped)' },
      copyBlur: [4.5, 0, 8, 0.5], // soft dissolve on the exhaling copy (the recede's calm)
    },
    cover: {
      flyDur: [440, 200, 1400, 10],
      fadeDelay: [370, 0, 1200, 10], // late — the cover rides visibly onto the thumb
      endScale: [0.29, 0.08, 1, 0.01],
    },
    collapse: {
      headerDur: [300, 100, 1000, 10],
      headerDelay: [140, 0, 800, 10],
      shelfDur: [330, 100, 1000, 10], // the tracklist's shelf
      shelfDelay: [170, 0, 800, 10],
    },
    article: {
      rise: [42, 0, 90, 1], //      px the prose climbs as it appears
      riseDur: [880, 100, 1200, 10],
      riseDelay: [300, 0, 1200, 10],
    },
    player: {
      arriveDelay: [40, 0, 900, 10], // the catch — player surfaces as rows land
    },
    recede: {
      blur: [3.5, 0, 12, 0.5],
      shrink: [0.955, 0.9, 1, 0.005],
    },
    playEnter: { type: 'action', label: 'Play enter' },
    playExit: { type: 'action', label: 'Play exit' },
  }, {
    onAction: (action: string) => {
      window.dispatchEvent(
        new CustomEvent('album-switch:force', { detail: action === 'playEnter' })
      );
    },
  });

  useEffect(() => {
    const root = document.documentElement;
    /* A preset overrides the dials wholesale; "custom (dials)" hands back. */
    const v = PRESETS[p.preset] ?? p;
    (window as any).__albumSwitch = {
      enter: v.breakpoint.enter,
      land: v.breakpoint.land,
      settle: v.breakpoint.settle,
    };
    if (v.variant === 'recede') root.setAttribute('data-motion', 'recede');
    else root.removeAttribute('data-motion');
    const vars: Record<string, string> = {
      '--sw-fall': `${v.pour.fall}px`,
      '--sw-fall-dur': `${v.pour.fallDur}ms`,
      '--sw-fall-fade': `${v.pour.fallFade}ms`,
      '--sw-stagger': `${v.pour.stagger}ms`,
      '--sw-top-first': v.pour.topFirst ? '1' : '0',
      '--sw-fall-scale': `${v.pour.shrink}`,
      '--sw-fall-ease': EASE[v.pour.ease] ?? EASE['accelerate (shipped)'],
      '--sw-copy-blur': `${v.pour.copyBlur}px`,
      '--sw-fly-dur': `${v.cover.flyDur}ms`,
      '--sw-fly-fade-delay': `${v.cover.fadeDelay}ms`,
      '--sw-fly-scale': `${v.cover.endScale}`,
      '--sw-collapse-dur': `${v.collapse.headerDur}ms`,
      '--sw-collapse-delay': `${v.collapse.headerDelay}ms`,
      '--sw-shelf-dur': `${v.collapse.shelfDur}ms`,
      '--sw-shelf-delay': `${v.collapse.shelfDelay}ms`,
      '--sw-rise': `${v.article.rise}px`,
      '--sw-rise-dur': `${v.article.riseDur}ms`,
      '--sw-rise-delay': `${v.article.riseDelay}ms`,
      '--sw-player-delay': `${v.player.arriveDelay}ms`,
      '--sw-recede-blur': `${v.recede.blur}px`,
      '--sw-recede-scale': `${v.recede.shrink}`,
    };
    for (const [k, v2] of Object.entries(vars)) root.style.setProperty(k, v2);
  }, [p]);

  /* The "delayed momentum" is Lenis, not the switch: wheel input lerps
     toward a target on its raf loop, so the page glides after the gesture.
     Off tears the instance down — native scroll; on rebuilds it. Floating
     instruments already fall back to window.scrollTo when lenis is gone. */
  useEffect(() => {
    const w = window as any;
    if (p.smoothScroll) {
      if (!w.lenis && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        w.lenis = new Lenis({ autoRaf: true });
      }
    } else if (w.lenis) {
      w.lenis.destroy();
      w.lenis = null;
    }
  }, [p.smoothScroll]);

  return <DialRoot position="top-right" />;
}
