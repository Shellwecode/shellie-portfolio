/* ─────────────────────────────────────────────────────────────
 * OPENING STORYBOARD — the galaxy front door (landing only)
 *
 * Read top-to-bottom. Times are seconds on the DialKit timeline.
 *
 *  0.00s  paper wall + print grain; galaxy hidden; the Figma-baked
 *         drift loops breathe beneath (Print › Drift can still them)
 *  0.00s  star dust breathes in across the whole sky (twinkle is
 *         an ambient CSS pulse, independent of the playhead)
 *  0.00s  sky settles — whole svg scale 0.94 → 1, rotate −5° → 0°
 *  0.03s  radial bloom — 34 stipple clusters fade/scale in, each
 *         delayed by its distance from the galaxy's heart; the
 *         `sweep` bar is the wave: longer bar = slower ripple
 *  0.00s… `shape` sculpts the whole galaxy over time — stretchX /
 *         stretchY / spin tracks, three retimable legs each
 *         (identity by default; edit a leg's target to bend it)
 *
 *  …then one of three endings (Release › Mode):
 *
 *  morph (default) — no waiting, no hint: at `reveal` the arms
 *         keep extending outward (scale track) while `dissolve`
 *         runs a second radial wave, heart → rim, that melts the
 *         clusters away; the wall track thins the paper and the
 *         landing performs its rise straight through the galaxy.
 *         Fully on the timeline — scrub the whole hand-off.
 *  travel — 2.30s hint rises; on click/hold the wall and dust fall
 *         away while the galaxy spring-flies home into the
 *         greeting's little universe (measured pre-entrance).
 *  lift  — 2.30s hint rises; on click/hold the galaxy drifts
 *         toward the viewer and the whole overlay fades.
 *
 *  In morph a click skips straight to `reveal`; in travel/lift it
 *  releases now. `data-entrance` + 'entered' always fire at the
 *  hand-off — Base.astro owns the landing's second act.
 *
 * Tuning: `npm run dev` — the timeline dock tunes the sequence
 * (Reveal expands into scale/opacity/wall tracks; Dissolve's bar
 * is the melt wave); the "Opening · feel" panel tunes the print
 * (grain amount/size/dot/color, dust level/hue, saturate,
 * contrast, blur, galaxy hue, drift on/off) and the release.
 * Edits persist locally (dev only; key `dialkit:opening*`). The
 * cluster waves ease with a fixed easeOutCubic; their speed,
 * window, and endpoints all come from the dock.
 * ──────────────────────────────────────────────────────────── */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDialKit, useDialTimeline, DialRoot, DialTimeline } from 'dialkit';
import { animate } from 'motion';
import 'dialkit/styles.css';

const DEV = import.meta.env.DEV;

/* Galaxy geometry — the SVG's viewBox center, where both waves start. */
const GALAXY = {
  centerX: 264, // viewBox 528 × 458
  centerY: 229,
};

/* The dissolve melt of one cluster, seconds — the wave bar staggers these. */
const MELT_S = 0.5;

type Cluster = { el: SVGGElement; r: number }; // r: 0 heart → 1 rim

const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

/* The paper's tooth, rebuilt live from the dials. */
const grainUri = (size: number, dot: number, color: string) =>
  `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><circle cx='1' cy='1' r='${dot}' fill='${color.replace('#', '%23')}'/></svg>")`;

export default function OpeningDirector() {
  // TODO(production): DialKit's clip.current values are the scrubbable authoring preview.
  // Replace them with equivalent real Motion animations using the tuned timeline
  // timings and transitions, then remove useDialTimeline and <DialTimeline />.
  const tl = useDialTimeline(
    'Opening',
    {
      dust: {
        at: 0,
        duration: 1.0,
        from: { opacity: 0 },
        to: { opacity: 1 },
        transition: { type: 'easing', duration: 1.0, ease: [0.33, 1, 0.68, 1] },
      },
      sky: {
        at: 0.1,
        duration: 1.68,
        from: { scale: 0.94, rotate: -5 },
        to: { scale: 1, rotate: 0 },
        transition: { type: 'easing', duration: 1.68, ease: [0.16, 1, 0.3, 1] },
      },
      bloom: {
        // Per-cluster recipe: each cluster plays this once its wave moment arrives.
        at: 0.31,
        duration: 0.9,
        from: { opacity: 0, scale: 0.7 },
        to: { opacity: 1, scale: 1 },
        transition: { type: 'easing', duration: 0.9, ease: [0.22, 1, 0.36, 1] },
      },
      sweep: { at: 0.1, duration: 1.66 }, // marker: the bloom wave, heart → rim
      shape: {
        // The galaxy's overall geometry, sculptable at any point in time:
        // three legs per track (drag the boundaries to retime, click a leg to
        // set its target). Tuned: the final leg squashes the disc to 0.57 of
        // its height with a whisper of spin while the melt runs — the tilted
        // pointillist-galaxy read.
        at: 0,
        props: {
          stretchX: {
            from: 1,
            steps: [
              { duration: 1.1, to: 1, transition: { type: 'spring', bounce: 0.2 } },
              { duration: 1.1, to: 1, transition: { type: 'spring', bounce: 0 } },
              { duration: 1.2, to: 1, transition: { type: 'spring', bounce: 0.2 } },
            ],
          },
          stretchY: {
            from: 1,
            steps: [
              { duration: 1.1, to: 1, transition: { type: 'spring', bounce: 0.2 } },
              { duration: 1.1, to: 1, transition: { type: 'spring', bounce: 0.2 } },
              { duration: 1.2, to: 0.57, transition: { type: 'spring', bounce: 0.2 } },
            ],
          },
          spin: {
            // degrees, added on top of the sky's settle rotation
            from: 0,
            steps: [
              { duration: 1.1, to: 0, transition: { type: 'spring', bounce: 0.2 } },
              { duration: 1.1, to: 0, transition: { type: 'spring', bounce: 0.2 } },
              {
                duration: 1.23,
                to: 0.51,
                transition: { type: 'spring', stiffness: 200, damping: 25, mass: 2.9 },
              },
            ],
          },
        },
      },
      reveal: {
        // morph only — the arms extend on out and the paper thins away.
        at: 1.31,
        props: {
          scale: {
            from: 1,
            to: 1.11,
            duration: 0.86,
            transition: { type: 'easing', duration: 0.86, ease: [0.3, 1.15, 0.5, 1] },
          },
          opacity: {
            from: 1,
            to: 0,
            delay: 0.19,
            duration: 1.3,
            transition: { type: 'easing', duration: 1.3, ease: [0.14, 1.12, 0.5, 1] },
          },
          wall: {
            from: 1,
            to: 0,
            duration: 1.0,
            transition: { type: 'easing', duration: 1.0, ease: [1, -0.4, 0.5, 1] },
          },
        },
      },
      dissolve: { at: 1.95, duration: 0.9 }, // marker: the melt wave, heart → rim (morph)
      hint: {
        // travel / lift only — morph never waits, so it never asks.
        at: 2.3,
        duration: 0.7,
        from: { opacity: 0, y: 10 },
        to: { opacity: 0.7, y: 0 },
        transition: { type: 'easing', duration: 0.7, ease: [0.22, 1, 0.36, 1] },
      },
      hold: { at: 3.95, duration: 0.05 }, // marker: travel/lift auto-release (prod)
    },
    { id: 'opening', autoplay: true, persist: DEV },
  );

  const feel = useDialKit('Opening · feel', {
    print: {
      grain: [0.155, 0, 0.4, 0.005], //    the tooth's opacity
      grainSize: [7, 3, 12, 1], //         tile px — smaller = denser grain
      grainDot: [0.8, 0.2, 2, 0.05], //    dot radius px — bigger = coarser
      grainColor: { type: 'color', default: '#a398db' },
      dust: [0.47, 0, 1, 0.01], //         master level for the star field
      dustHue: [0, -180, 180, 1], //       spin the dust palette, degrees
      saturate: [0.9, 0.4, 1.4, 0.01], //  pull the galaxy's inks toward print
      contrast: [1.02, 0.8, 1.3, 0.01],
      blur: [0, 0, 3, 0.05], //            dreamy softening, px
      hue: [-2, -180, 180, 1], //          spin the galaxy's inks, degrees
      drift: true, //                      the baked Figma float loops
    },
    release: {
      mode: { type: 'select', options: ['morph', 'travel', 'lift'], default: 'morph' },
      durationS: [0.75, 0.3, 2.5, 0.05], // travel flight / lift fade
      bounce: [0.12, 0, 0.6, 0.01], //     spring bounce of the flight
      wallFadeS: [0.65, 0.2, 2, 0.05], //  travel/lift wall + dust fall-away
      liftScale: [1.08, 1, 1.3, 0.01], //  lift only: drift toward the viewer
    },
  });

  const clustersRef = useRef<Cluster[]>([]);
  const overlayRef = useRef<HTMLElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const wallRef = useRef<HTMLElement | null>(null);
  const grainRef = useRef<HTMLElement | null>(null);
  const dustRef = useRef<SVGSVGElement | null>(null);
  const hintRef = useRef<HTMLElement | null>(null);
  const releasedRef = useRef(false);
  const feelRef = useRef(feel);
  feelRef.current = feel;
  const tlRef = useRef(tl);
  tlRef.current = tl;
  const [active, setActive] = useState(false);

  const isMorph = feel.release.mode === 'morph';

  /* Gather the stage — the SVG is server-inlined by Opening.astro, not ours. */
  useEffect(() => {
    const overlay = document.getElementById('gx-opening');
    if (!overlay || overlay.style.display === 'none') return; // guard script sat us out
    overlayRef.current = overlay;
    svgRef.current = overlay.querySelector('.gx-stage svg');
    stageRef.current = overlay.querySelector('.gx-stage');
    wallRef.current = overlay.querySelector('.gx-wall');
    grainRef.current = overlay.querySelector('.gx-grain');
    dustRef.current = overlay.querySelector('.gx-dust');
    hintRef.current = overlay.querySelector('.gx-hint');

    const els = Array.from(overlay.querySelectorAll<SVGGElement>('.gx-cluster'));
    const rs = els.map((el) => {
      const b = el.getBBox();
      return Math.hypot(b.x + b.width / 2 - GALAXY.centerX, b.y + b.height / 2 - GALAXY.centerY);
    });
    const max = Math.max(...rs, 1);
    clustersRef.current = els.map((el, i) => ({ el, r: rs[i] / max }));

    setActive(true);
    tl.replay();

    const finish = () => {
      document.documentElement.style.overflow = '';
      if (!DEV && overlayRef.current) overlayRef.current.style.display = 'none';
    };

    /* travel — the galaxy flies home into the greeting's little universe. */
    const releaseTravel = (r: (typeof feelRef.current)['release']): boolean => {
      const stage = stageRef.current;
      const home = document.querySelector<HTMLElement>('.g-universe');
      if (!stage || !home) return false; // no destination — fall back to lift
      /* Measure before data-entrance so the rect is the resting layout,
         exactly where the greeting finishes its rise. */
      const to = home.getBoundingClientRect();
      const from = stage.getBoundingClientRect();
      if (!to.height || !from.height) return false;
      home.style.opacity = '0'; // one universe at a time
      document.documentElement.setAttribute('data-entrance', '');
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      /* The webm sits 22px tall; land a touch larger so the hand-off swap
         reads as a settle, not a pop. */
      const scale = (to.height * 1.15) / from.height;
      animate(
        stage,
        { x: dx, y: dy, scale },
        { type: 'spring', duration: r.durationS, bounce: r.bounce },
      ).then(() => {
        animate(stage, { opacity: 0 }, { duration: 0.14 });
        home.style.transition = 'opacity 160ms ease-out';
        home.style.opacity = '';
        setTimeout(() => {
          home.style.transition = '';
          finish();
        }, 200);
      });
      const fade = { duration: r.wallFadeS, ease: [0.4, 0, 0.2, 1] as const };
      if (wallRef.current) animate(wallRef.current, { opacity: 0 }, fade);
      if (dustRef.current) animate(dustRef.current, { opacity: 0 }, fade);
      if (hintRef.current) animate(hintRef.current, { opacity: 0 }, { duration: 0.25 });
      return true;
    };

    /* lift — galaxy toward the viewer, overlay away. */
    const releaseLift = (r: (typeof feelRef.current)['release']) => {
      if (svgRef.current) {
        animate(
          svgRef.current,
          { scale: r.liftScale },
          { duration: r.durationS, ease: [0.4, 0, 0.2, 1] },
        );
      }
      animate(overlay, { opacity: 0 }, { duration: r.durationS, ease: [0.4, 0, 0.2, 1] }).then(
        finish,
      );
    };

    const release = () => {
      if (releasedRef.current || !overlayRef.current) return;
      const r = feelRef.current.release;
      if (r.mode === 'morph') {
        /* Morph's ending lives on the timeline — a click just skips ahead. */
        const t = tlRef.current;
        if (t.time < t.reveal.at) t.seek(t.reveal.at);
        if (!t.playing) t.play();
        return;
      }
      releasedRef.current = true;
      try {
        sessionStorage.setItem('entered', '1');
      } catch {
        /* private mode — the landing entrance just replays next visit */
      }
      overlay.style.pointerEvents = 'none';
      const traveled = r.mode === 'travel' && releaseTravel(r);
      if (!traveled) {
        /* Act two for lift starts here; travel sets it pre-measure. */
        document.documentElement.setAttribute('data-entrance', '');
        releaseLift(r);
      }
    };
    overlay.addEventListener('pointerdown', release);
    const onKey = () => release();
    const onWheel = () => release();
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: true });
    (overlay as HTMLElement & { gxRelease?: () => void }).gxRelease = release;

    return () => {
      overlay.removeEventListener('pointerdown', release);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
      document.documentElement.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Morph act two: the landing rises the moment the reveal begins. */
  useEffect(() => {
    if (!active || !isMorph) return;
    if (tl.reveal.started && !releasedRef.current) {
      releasedRef.current = true;
      try {
        sessionStorage.setItem('entered', '1');
      } catch {
        /* private mode */
      }
      document.documentElement.setAttribute('data-entrance', '');
    }
  }, [tl.reveal.started, active, isMorph]);

  /* Morph curtain call: once the reveal has fully run, the overlay stops
     intercepting the page. Dev keeps the DOM for scrubbing. */
  useEffect(() => {
    if (!active || !isMorph) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    if (tl.reveal.done) {
      overlay.style.pointerEvents = 'none';
      document.documentElement.style.overflow = '';
      if (!DEV) overlay.style.display = 'none';
    } else if (DEV && !tl.reveal.started) {
      overlay.style.pointerEvents = '';
      document.documentElement.style.overflow = 'hidden';
    }
  }, [tl.reveal.done, tl.reveal.started, active, isMorph]);

  /* Dev replay from the dock: seeking home re-arms everything, including the
     landing's entrance so act two can play again. */
  useEffect(() => {
    if (!DEV || !releasedRef.current || tl.time > 0.2) return;
    const node = overlayRef.current;
    if (!node) return;
    releasedRef.current = false;
    node.style.pointerEvents = '';
    node.style.opacity = '1';
    for (const el of [stageRef.current, svgRef.current, wallRef.current]) {
      if (!el) continue;
      el.style.transform = '';
      el.style.scale = '';
      el.style.translate = '';
      el.style.opacity = '';
    }
    const home = document.querySelector<HTMLElement>('.g-universe');
    if (home) home.style.opacity = '';
    document.documentElement.removeAttribute('data-entrance');
    document.documentElement.style.overflow = 'hidden';
  }, [tl.time]);

  /* Travel/lift auto-release when the hold marker passes (prod). In dev the
     overlay waits for a click so the dock can scrub freely. */
  useEffect(() => {
    if (DEV || !active || releasedRef.current || isMorph) return;
    if (tl.hold.done) {
      (overlayRef.current as (HTMLElement & { gxRelease?: () => void }) | null)?.gxRelease?.();
    }
  }, [tl.hold.done, active, isMorph]);

  /* Every frame: paint the playhead's state onto the stage. Everything is a
     pure function of tl.time (+ the feel dials), so dock scrubbing is exact. */
  useLayoutEffect(() => {
    if (!active) return;
    const morphing = isMorph;
    /* travel/lift hand their exit to Motion — stop painting once released.
       morph stays playhead-driven all the way through. */
    if (releasedRef.current && !morphing) return;

    const overlay = overlayRef.current;
    const p = feel.print;
    if (overlay) {
      overlay.style.setProperty('--gx-sat', String(p.saturate));
      overlay.style.setProperty('--gx-con', String(p.contrast));
      overlay.style.setProperty('--gx-blur', `${p.blur}px`);
      overlay.style.setProperty('--gx-hue', `${p.hue}deg`);
      overlay.style.setProperty('--gx-dust-hue', `${p.dustHue}deg`);
      overlay.classList.toggle('gx-still', !p.drift);
    }
    if (grainRef.current) {
      grainRef.current.style.opacity = String(p.grain);
      grainRef.current.style.backgroundImage = grainUri(p.grainSize, p.grainDot, p.grainColor);
    }

    const rv = tl.reveal.current;
    const wallLevel = morphing ? Number(rv.wall) : 1;

    const sky = tl.sky.current;
    const shape = tl.shape.current;
    if (svgRef.current) {
      const scale = sky.scale * (morphing ? Number(rv.scale) : 1);
      const sx = scale * Number(shape.stretchX);
      const sy = scale * Number(shape.stretchY);
      const rot = sky.rotate + Number(shape.spin);
      svgRef.current.style.transform = `scale(${sx}, ${sy}) rotate(${rot}deg)`;
    }
    if (stageRef.current && morphing) {
      stageRef.current.style.opacity = String(rv.opacity);
    }
    if (wallRef.current && morphing) {
      wallRef.current.style.opacity = String(wallLevel);
    }
    if (dustRef.current) {
      dustRef.current.style.opacity = String(tl.dust.current.opacity * p.dust * wallLevel);
    }

    const bloomFrom = tl.bloom.from;
    const bloomTo = tl.bloom.to;
    const bloomDur = Math.max(tl.bloom.duration, 0.05);
    for (const { el, r } of clustersRef.current) {
      const inStart = tl.sweep.at + r * tl.sweep.duration;
      const pin = easeOutCubic(clamp01((tl.time - inStart) / bloomDur));
      let opacity = bloomFrom.opacity + (bloomTo.opacity - bloomFrom.opacity) * pin;
      if (morphing) {
        /* The melt wave — same heart-first order the bloom arrived in. */
        const outStart = tl.dissolve.at + r * tl.dissolve.duration;
        opacity *= 1 - easeOutCubic(clamp01((tl.time - outStart) / MELT_S));
      }
      el.style.opacity = String(opacity);
      const s = bloomFrom.scale + (bloomTo.scale - bloomFrom.scale) * pin;
      el.style.transform = `scale(${s})`;
    }

    const hint = tl.hint.current;
    if (hintRef.current) {
      hintRef.current.style.opacity = morphing ? '0' : String(hint.opacity);
      hintRef.current.style.transform = `translateY(${hint.y}px)`;
    }
  });

  return DEV ? (
    <>
      <DialRoot position="top-right" />
      <DialTimeline />
    </>
  ) : null;
}
