/* ─────────────────────────────────────────────────────────────
 * OPENING FILL · DIALKIT RIG (dev only — prod runs the bake)
 *
 * The color-load door, re-rigged so the POUR can be tuned. The
 * baked timeline poured on one uniform spring; here the pour is
 * a seeded GLUG CURVE — a few surges of uneven size, each with
 * a hesitation after its crest and a little lap-back over it —
 * so the ink rises the way liquid actually does: eagerly, then
 * not at all, then eagerly again.
 *
 * ANIMATION STORYBOARD (defaults = her tuned pour, 2026-08-19)
 *
 *   0.00s  drop — the gray girl lands from above (overshoot ease)
 *   0.43s  pour — level 0 → 1 through the glug curve (3 glugs,
 *          seed 11); shoreline, counter and log ride the level
 *   1.60s  settle — the boil drains out of the ink
 *   1.93s  sparks — six gold ticks flick outward and fade
 *   2.58s  veil — the wall fades, data-entrance fires, the
 *          landing rises. Click/key/wheel seeks straight here.
 *
 * Every frame is a pure function of (dials, tl.time), so the
 * dock can scrub the whole door — glugs included. When the pour
 * feels right, press BAKE: a paste-ready summary of the tuned
 * values lands in the console for OpeningFill.astro's script.
 * ──────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDialKit, useDialTimeline, DialRoot, DialTimeline } from 'dialkit';
import 'dialkit/styles.css';

const DEV = import.meta.env.DEV;
const TEX_O = 0.45; // the boil strength the settle drains from (the bake's value)

/* The honest part of the theater — these are real files this page loads. */
const LOG_LINES = [
  '> fetch junicode.woff2 … ok',
  '> fetch riso-icons.svg … ok',
  '> fetch textures/doodles.mp4 … ok',
  '> fetch voice/greeting-en.mp3 … ok',
];

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

/* Tiny seeded rng — one seed is one pour. */
const mulberry32 = (seed: number) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type Glug = { t0: number; t1: number; l0: number; l1: number };

/* The glug curve: pour progress (0..1) → fill level (0..1).
 * n surges split the pour; `uneven` jitters both their heights and their
 * durations (seeded, so a seed is an edition); each surge spends
 * `hesitate` of its time resting at its crest; `lap` is how far the crest
 * overshoots before lapping back — a back-ease, not a bounce, so the
 * surface never dips below where it's already risen. glugs=1, hesitate=0
 * recovers something very close to the baked single spring. */
function buildGlugCurve(n: number, uneven: number, hesitate: number, lap: number, seed: number) {
  const rand = mulberry32(seed * 1013 + 7);
  const count = Math.max(1, Math.round(n));
  const heights: number[] = [];
  const widths: number[] = [];
  for (let i = 0; i < count; i++) {
    heights.push(1 + uneven * (rand() * 2 - 1) * 0.9);
    widths.push(1 + uneven * (rand() * 2 - 1) * 0.9);
  }
  const hSum = heights.reduce((a, b) => a + b, 0);
  const wSum = widths.reduce((a, b) => a + b, 0);
  const glugs: Glug[] = [];
  let level = 0;
  let time = 0;
  for (let i = 0; i < count; i++) {
    const dl = heights[i] / hSum;
    const dt = widths[i] / wSum;
    glugs.push({ t0: time, t1: time + dt, l0: level, l1: level + dl });
    level += dl;
    time += dt;
  }
  const c1 = 1.70158 * lap * 2.2; // back-ease pull, scaled by the lap dial
  const c3 = c1 + 1;
  return (p: number) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    const g = glugs.find((s) => p < s.t1) ?? glugs[glugs.length - 1];
    const q = (p - g.t0) / (g.t1 - g.t0);
    const rise = Math.max(0.15, 1 - hesitate); // the rest of the glug is the wait
    if (q >= rise) return g.l1;
    const k = q / rise - 1;
    const eased = 1 + c3 * k * k * k + c1 * k * k;
    return g.l0 + (g.l1 - g.l0) * eased;
  };
}

/* Sparks — the baked keyframes, expressed as functions of progress. */
const sparkOpacity = (q: number) =>
  q < 0.27 ? q / 0.27 : q < 0.48 ? 1 : 1 - (q - 0.48) / 0.52;
const sparkScale = (q: number) => {
  if (q < 0.45) {
    const k = q / 0.45 - 1;
    return 0.6 + 0.4 * (1 + 2.7 * k * k * k + 1.7 * k * k); // little back-pop
  }
  return 1 + 0.1 * ((q - 0.45) / 0.55);
};

export default function OpeningFillDirector() {
  // TODO(production): DialKit's clip.current values are the scrubbable authoring preview.
  // Replace them with equivalent real Motion animations using the tuned timeline
  // timings and transitions, then remove useDialTimeline and <DialTimeline />.
  const tl = useDialTimeline(
    'Opening Fill',
    {
      drop: {
        at: 0,
        duration: 0.54,
        from: { opacity: 0.12, y: -19, scale: 0.98 },
        to: { opacity: 1, y: 0, scale: 1 },
        transition: { type: 'easing', duration: 0.54, ease: [0.5, 1.38, 0.36, 1] },
      },
      pour: { at: 0.43, duration: 1.02 }, // marker: level rides the glug curve
      settle: {
        at: 1.6,
        duration: 0.45,
        from: { boil: TEX_O },
        to: { boil: 0 },
        transition: { type: 'easing', duration: 0.45, ease: [0.33, 1, 0.68, 1] },
      },
      sparks: { at: 1.93, duration: 0.67 }, // marker: opacity/scale from the pure fns
      veil: {
        at: 2.58,
        duration: 0.56,
        from: { opacity: 1 },
        to: { opacity: 0 },
        transition: { type: 'easing', duration: 0.56, ease: [0.4, 0, 0.2, 0.72] },
      },
    },
    { id: 'opening-fill', autoplay: true, persist: DEV },
  );

  const feel = useDialKit(
    'Opening Fill · pour',
    {
      pour: {
        glugs: [3, 1, 9, 1], //          how many surges the pour arrives in
        uneven: [0.35, 0, 1, 0.01], //   how differently sized/paced they are
        hesitate: [0.21, 0, 0.8, 0.01], // the wait after each crest
        lap: [0.27, 0, 0.8, 0.01], //    crest overshoot that laps back
        seed: [11, 1, 99, 1], //         reshuffle the surge pattern
      },
      replay: { type: 'action' },
      bake: { type: 'action', label: 'Bake → console' },
    },
    {
      onAction: (action: string) => {
        if (action === 'replay') tlRef.current.replay();
        if (action === 'bake') {
          const t = tlRef.current;
          // eslint-disable-next-line no-console
          console.log(
            `/* OpeningFill pour bake ${new Date().toISOString().slice(0, 10)} */\n` +
              `const POUR = { glugs: ${feelRef.current.pour.glugs}, uneven: ${feelRef.current.pour.uneven}, ` +
              `hesitate: ${feelRef.current.pour.hesitate}, lap: ${feelRef.current.pour.lap}, seed: ${feelRef.current.pour.seed} };\n` +
              `const T = { girlMs: ${t.drop.duration}, pourAt: ${t.pour.at}, pourS: ${t.pour.duration}, ` +
              `settleAt: ${t.settle.at}, sparksAt: ${t.sparks.at}, releaseAt: ${t.veil.at}, veilS: ${t.veil.duration} };`,
          );
        }
      },
    },
  );

  const tlRef = useRef(tl);
  tlRef.current = tl;
  const feelRef = useRef(feel);
  feelRef.current = feel;
  const releasedRef = useRef(false);
  const [active, setActive] = useState(false);

  const glugCurve = useMemo(
    () =>
      buildGlugCurve(
        feel.pour.glugs,
        feel.pour.uneven,
        feel.pour.hesitate,
        feel.pour.lap,
        feel.pour.seed,
      ),
    [feel.pour.glugs, feel.pour.uneven, feel.pour.hesitate, feel.pour.lap, feel.pour.seed],
  );
  const glugRef = useRef(glugCurve);
  glugRef.current = glugCurve;

  useEffect(() => {
    const overlay = document.getElementById('fg-opening');
    if (!overlay) return;
    overlay.style.display = ''; // the rig owns the door — undo any skip guard
    document.documentElement.style.overflow = 'hidden';
    const stack = overlay.querySelector<HTMLElement>('.fg-stack');
    const shore = overlay.querySelector<SVGSVGElement>('.fg-shore');
    const sparks = overlay.querySelector<SVGSVGElement>('.fg-sparks');
    const counter = overlay.querySelector<HTMLElement>('.fg-counter');
    const log = overlay.querySelector<HTMLElement>('.fg-log');
    const video = overlay.querySelector<HTMLVideoElement>('.fg-tex');
    if (!stack || !shore || !sparks || !counter || !log || !video) return;
    setActive(true);
    tlRef.current.replay();

    let raf = 0;
    const frame = () => {
      const t = tlRef.current;
      const now = t.time;

      // the drop, settle and veil interpolate in the timeline
      const drop = t.drop.current;
      stack.style.opacity = String(drop.opacity);
      stack.style.transform = `translateY(${drop.y}px) scale(${drop.scale})`;

      const pourP = clamp01((now - t.pour.at) / Math.max(t.pour.duration, 0.01));
      const lv = clamp01(glugRef.current(pourP));
      overlay.style.setProperty('--fg-level', String(lv));

      const settled = now >= t.settle.at;
      overlay.style.setProperty('--fg-tex-o', String(Number(t.settle.current.boil)));
      if (settled && !video.paused) video.pause();
      if (!settled && video.paused) video.play().catch(() => {});

      const edge = clamp01(Math.min(lv / 0.06, (1 - lv) / 0.06));
      shore.style.opacity = String(edge);
      counter.style.opacity = lv > 0.01 && !settled ? '1' : '0';
      counter.textContent = `${Math.round(lv * 100)}%`;
      const lines = LOG_LINES.slice(0, Math.floor(lv * LOG_LINES.length));
      if (lv > 0.01 && lv < 1) lines.push(`> pour ink … ${Math.round(lv * 100)}%`);
      if (settled) lines.push('> ready.');
      log.textContent = lv > 0.01 ? lines.join('\n') : 'waking up…';
      log.style.opacity = settled ? '0.45' : '1';

      const sq = clamp01((now - t.sparks.at) / Math.max(t.sparks.duration, 0.01));
      sparks.style.opacity = now < t.sparks.at ? '0' : String(clamp01(sparkOpacity(sq)));
      sparks.style.transform = `scale(${sparkScale(sq)})`;

      overlay.style.opacity = String(t.veil.current.opacity);

      // release + un-release, so scrubbing back re-hangs the veil
      const releasing = now >= t.veil.at;
      if (releasing && !releasedRef.current) {
        releasedRef.current = true;
        overlay.style.pointerEvents = 'none';
        document.documentElement.setAttribute('data-entrance', '');
        document.documentElement.style.overflow = '';
        try {
          sessionStorage.setItem('entered', '1');
        } catch {
          /* private mode — the door just replays */
        }
      }
      if (!releasing && releasedRef.current) {
        releasedRef.current = false;
        overlay.style.pointerEvents = '';
        document.documentElement.removeAttribute('data-entrance'); // the landing re-rises at release
        document.documentElement.style.overflow = 'hidden';
      }
      overlay.style.visibility =
        releasing && Number(t.veil.current.opacity) <= 0.001 ? 'hidden' : '';

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    /* A click is impatience here too — but the rig seeks, not skips, so the
       timeline dock stays truthful. */
    const skip = () => {
      const t = tlRef.current;
      if (t.time < t.veil.at) t.seek(t.veil.at);
      if (!t.playing) t.play();
    };
    overlay.addEventListener('pointerdown', skip);
    window.addEventListener('keydown', skip);
    window.addEventListener('wheel', skip, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      overlay.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('wheel', skip);
      document.documentElement.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!active) return null;
  return (
    <>
      <DialRoot position="top-right" />
      <DialTimeline />
    </>
  );
}
