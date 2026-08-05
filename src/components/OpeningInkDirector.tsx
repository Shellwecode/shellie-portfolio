/* ─────────────────────────────────────────────────────────────
 * OPENING B — "gold ink universe" (generative alt to the galaxy)
 *
 * A seeded generative print, fxhash-style: one seed drives every
 * grain, so a seed is an edition. No p5 dependency — raw pixels
 * in a Uint32 buffer; every frame is a pure function of
 * (seed, dials, tl.time), so the dock can scrub it.
 *
 * TWO SUBJECTS share one choreography (Universe › Subject):
 *
 *  galaxy — Shellie's orbiting galaxy. The SVG's 378 stipple
 *    stamps are parsed at build time (OpeningInk.astro) into
 *    anchors grouped by the 34 clusters; each scatters a gaussian
 *    grain puff, so the print inherits the artwork's exact
 *    density. Blooms heart-first, drifts in little orbits.
 *  comet — the Hale-Bopp film photo: blazing head lower-right, a
 *    dust-tail fan trailing up-left, a faint second tail, pale
 *    stars, film-grain sky in night blues. It FALLS HEAD-FIRST:
 *    the head ignites at the top of its trajectory and rides the
 *    sweep down the axis (Comet › Travel = start distance); each
 *    tail band lights as the head passes, so the tail expands
 *    behind it like deposited glow. At the dissolve the head
 *    burns out first and the trail lingers, fading top-down.
 *
 *  0.00s  dark paper; stars/dust breathe in
 *  0.10s  sky settles — scale 0.94 → 1, rotate −5° → 0°
 *  0.10s  radial bloom, heart-first (sweep bar = wave speed)
 *  1.31s  reveal — gentle push (1 → 1.11) while the wall thins
 *  1.95s  dissolve — heart-first melt; the landing rises through
 *   any   click / key / wheel = skip to the reveal
 *
 * Timings mirror the tuned galaxy opening so every variant feels
 * like the same piece in different media.
 *
 * TODO(production): bake the tuned timings into a self-driven
 * rAF loop and drop DialKit + React from the shipped bundle.
 * ──────────────────────────────────────────────────────────── */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDialKit, useDialTimeline, DialRoot, DialTimeline } from 'dialkit';
import 'dialkit/styles.css';

const DEV = import.meta.env.DEV;

/* The source SVG's viewBox — galaxy anchors live in this space. */
const VIEW = { w: 528, h: 458, cx: 264, cy: 229 };
const MELT_S = 0.5; // per-cluster melt length, seconds (matches iteration one)
const COMET_BANDS = 24; // develop/melt granularity along the tail

const mulberry32 = (seed: number) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;
const smooth = (v: number) => v * v * (3 - 2 * v);
const inkToInt = (hex: string, alpha = 255) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return ((alpha << 24) | ((n & 0xff) << 16) | (n & 0xff00) | ((n >> 16) & 0xff)) >>> 0;
};
/* channel-wise lerp of two ABGR ints — for the film-grain sky tone */
const lerpInt = (a: number, b: number, t: number) => {
  const ar = a & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = (a >> 16) & 0xff;
  const br = b & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = (b >> 16) & 0xff;
  return (
    ((0xff << 24) |
      (((ab + (bb - ab) * t) & 0xff) << 16) |
      (((ag + (bg - ag) * t) & 0xff) << 8) |
      ((ar + (br - ar) * t) & 0xff)) >>>
    0
  );
};

type ClusterMeta = { r: number; phase: number; phase2: number };
type Scene = {
  mode: 'galaxy' | 'comet';
  /* flat grain arrays — galaxy: viewBox coords; comet: canvas px */
  gx: Float32Array;
  gy: Float32Array;
  gu: Float32Array; // acceptance threshold
  gb: Float32Array; // brightness multiplier on the accept test
  gc: Uint16Array; //  cluster / band index
  gk: Uint8Array; //   ink: 0 base, 1 highlight, 2 sky-noise
  clusters: ClusterMeta[];
  /* star/dust field, canvas fractions */
  fx: Float32Array;
  fy: Float32Array;
  fu: Float32Array;
  fm: Float32Array;
  key: string;
};

export default function OpeningInkDirector() {
  const tl = useDialTimeline(
    'Opening B',
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
        at: 0.31,
        duration: 0.9,
        from: { density: 0 },
        to: { density: 1 },
        transition: { type: 'easing', duration: 0.9, ease: [0.22, 1, 0.36, 1] },
      },
      sweep: { at: 0.1, duration: 1.66 }, // marker: the bloom wave, heart → rim
      reveal: {
        at: 1.31,
        props: {
          scale: {
            from: 1,
            to: 1.11,
            duration: 0.86,
            transition: { type: 'easing', duration: 0.86, ease: [0.3, 1.15, 0.5, 1] },
          },
          wall: {
            from: 1,
            to: 0,
            duration: 1.0,
            transition: { type: 'easing', duration: 1.0, ease: [1, -0.4, 0.5, 1] },
          },
        },
      },
      dissolve: { at: 1.95, duration: 0.9 }, // marker: the melt wave, heart → rim
    },
    { id: 'opening-b', autoplay: true, persist: DEV },
  );

  const feel = useDialKit('Opening B · feel', {
    print: {
      ink: { type: 'color', default: '#c99a3e' }, //   galaxy: the gold riso ink
      inkHi: { type: 'color', default: '#efd9a0' }, // galaxy: overprint highlight
      ground: { type: 'color', default: '#171310' }, // galaxy: the dark paper
      grain: [1, 0.3, 2.5, 0.05], //  dither density
      pixel: [2, 1, 4, 1], //         grain chunk size, device px
    },
    night: {
      // the comet's film palette (subject: comet)
      skyBlue: { type: 'color', default: '#2c3053' },
      tail: { type: 'color', default: '#d8b478' },
      head: { type: 'color', default: '#fff3dc' },
      filmGrain: [0.16, 0, 0.5, 0.01], // the emulsion's speckle over the sky
    },
    universe: {
      subject: { type: 'select', options: ['galaxy', 'comet'], default: 'galaxy' },
      seed: [7, 1, 999, 1], //        the edition — reroll the grain
      scale: [0.62, 0.2, 1.1, 0.01], // galaxy size, fraction of viewport
      driftAmp: [1, 0, 3, 0.05], //   orbit wobble / tail shimmer
      driftSpeed: [1, 0, 3, 0.05],
      field: [0.5, 0, 1, 0.01], //    star-dust level
    },
    comet: {
      x: [0.72, 0.2, 1, 0.01], //     head position, viewport fractions
      y: [0.84, 0.2, 1.1, 0.01],
      angle: [-116, -180, -60, 1], // tail climb direction, degrees
      length: [0.82, 0.3, 1.4, 0.01], // fraction of viewport height
      spread: [15, 4, 40, 1], //      fan half-angle, degrees
      travel: [1, 0, 1.2, 0.01], //   head start distance up-axis, × length
    },
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLElement | null>(null);
  const anchorsRef = useRef<[number, number, number][][] | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const releasedRef = useRef(false);
  const tlRef = useRef(tl);
  tlRef.current = tl;
  const [active, setActive] = useState(false);

  useEffect(() => {
    const overlay = document.getElementById('gi-opening');
    if (!overlay || overlay.style.display === 'none') return;
    overlayRef.current = overlay;
    canvasRef.current = overlay.querySelector('canvas');
    try {
      anchorsRef.current = JSON.parse(document.getElementById('gi-galaxy')?.textContent ?? '[]');
    } catch {
      anchorsRef.current = [];
    }
    setActive(true);
    tl.replay();

    const skip = () => {
      const t = tlRef.current;
      if (t.time < t.reveal.at) t.seek(t.reveal.at);
      if (!t.playing) t.play();
    };
    overlay.addEventListener('pointerdown', skip);
    const onKey = () => skip();
    const onWheel = () => skip();
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      overlay.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
      document.documentElement.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Act two + curtain call — identical contract to the galaxy morph. */
  useEffect(() => {
    if (!active) return;
    if (tl.reveal.started && !releasedRef.current) {
      releasedRef.current = true;
      try {
        sessionStorage.setItem('entered', '1');
      } catch {
        /* private mode */
      }
      document.documentElement.setAttribute('data-entrance', '');
    }
  }, [tl.reveal.started, active]);

  useEffect(() => {
    if (!active) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const over = tl.reveal.done && tl.dissolve.done;
    if (over) {
      overlay.style.pointerEvents = 'none';
      document.documentElement.style.overflow = '';
      if (!DEV) overlay.style.display = 'none';
    } else if (DEV) {
      overlay.style.pointerEvents = '';
      document.documentElement.style.overflow = 'hidden';
      if (!tl.reveal.started && releasedRef.current) {
        releasedRef.current = false;
        document.documentElement.removeAttribute('data-entrance');
      }
    }
  }, [tl.reveal.done, tl.dissolve.done, tl.reveal.started, active]);

  /* ── Scene builders — deterministic from the seed ─────────── */

  const buildGalaxy = (rand: () => number, scene: Partial<Scene>) => {
    const anchors = anchorsRef.current ?? [];
    const xs: number[] = [];
    const ys: number[] = [];
    const us: number[] = [];
    const bs: number[] = [];
    const cs: number[] = [];
    const ks: number[] = [];
    const clusters: ClusterMeta[] = [];
    anchors.forEach((pts, ci) => {
      let mx = 0;
      let my = 0;
      for (const [x, y] of pts) {
        mx += x;
        my += y;
      }
      mx /= pts.length;
      my /= pts.length;
      clusters.push({
        r: Math.hypot(mx - VIEW.cx, my - VIEW.cy),
        phase: rand() * Math.PI * 2,
        phase2: rand() * Math.PI * 2,
      });
      for (const [x, y, s] of pts) {
        const k = Math.max(3, Math.round((4 + s * 150) * feel.print.grain));
        const sigma = 2 + s * 34;
        for (let i = 0; i < k; i++) {
          const g1 = (rand() + rand() + rand() - 1.5) * sigma;
          const g2 = (rand() + rand() + rand() - 1.5) * sigma;
          xs.push(x + g1);
          ys.push(y + g2);
          us.push(rand());
          bs.push(1);
          cs.push(ci);
          ks.push(Math.abs(g1) + Math.abs(g2) < sigma * 0.5 && rand() < 0.5 ? 1 : 0);
        }
      }
    });
    const rMax = Math.max(...clusters.map((c) => c.r), 1);
    clusters.forEach((c) => (c.r /= rMax));
    scene.gx = Float32Array.from(xs);
    scene.gy = Float32Array.from(ys);
    scene.gu = Float32Array.from(us);
    scene.gb = Float32Array.from(bs);
    scene.gc = Uint16Array.from(cs);
    scene.gk = Uint8Array.from(ks);
    scene.clusters = clusters;
  };

  const buildComet = (rand: () => number, scene: Partial<Scene>, w: number, h: number) => {
    const cm = feel.comet;
    const xs: number[] = [];
    const ys: number[] = [];
    const us: number[] = [];
    const bs: number[] = [];
    const cs: number[] = [];
    const ks: number[] = [];
    const clusters: ClusterMeta[] = [];
    for (let i = 0; i < COMET_BANDS; i++) {
      clusters.push({
        r: i / (COMET_BANDS - 1),
        phase: rand() * Math.PI * 2,
        phase2: rand() * Math.PI * 2,
      });
    }
    /* The head is its own band at r = 0: it ignites the moment the sweep
       starts and rides down the axis (motion applied at render time). */
    clusters.push({ r: 0, phase: rand() * Math.PI * 2, phase2: rand() * Math.PI * 2 });
    const hx = cm.x * w;
    const hy = cm.y * h;
    const len = cm.length * h;
    const ang = (cm.angle * Math.PI) / 180;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    const nx = -dy; // transverse
    const ny = dx;
    const spread = (cm.spread * Math.PI) / 180;
    const headR = 0.028 * h;
    /* Falling: band 0 (develops first) is the TAIL TIP, the last band is the
       head — the wave washes down the axis and the head ignites at arrival. */
    const band = (s: number) =>
      Math.min(COMET_BANDS - 1, ((1 - s) * (COMET_BANDS - 1)) | 0);
    const push = (x: number, y: number, u: number, b: number, c: number, k: number) => {
      xs.push(x);
      ys.push(y);
      us.push(u);
      bs.push(b);
      cs.push(c);
      ks.push(k);
    };

    /* The head — blown-out core with a warm coma fringe. */
    const headN = Math.round(4200 * feel.print.grain);
    for (let i = 0; i < headN; i++) {
      const rr = Math.abs(rand() + rand() - 1) * headR * (i % 3 === 0 ? 2.4 : 1);
      const th = rand() * Math.PI * 2;
      push(
        hx + Math.cos(th) * rr,
        hy + Math.sin(th) * rr,
        rand(),
        2.2 - rr / headR,
        COMET_BANDS, // the head band — first to ignite, and it moves
        1,
      );
    }

    /* The main dust tail — a fan, dense at the head, feathering out. */
    const tailN = Math.round(15000 * feel.print.grain);
    for (let i = 0; i < tailN; i++) {
      const s = Math.pow(rand(), 1.55); // most ink near the head
      const a = (rand() + rand() + rand() - 1.5) * spread * (0.5 + s * 1.1);
      const dist = s * len;
      const px = hx + (dx * Math.cos(a) - dy * Math.sin(a)) * dist;
      const py = hy + (dx * Math.sin(a) + dy * Math.cos(a)) * dist;
      const edge = 1 - Math.abs(a) / (spread * (0.5 + s * 1.1) * 1.9);
      const b = (1.25 - s) * clamp01(0.35 + edge) * 0.95;
      push(px, py, rand(), b, band(s), b > 0.82 ? 1 : 0);
    }

    /* The faint second tail — wider, dimmer, slightly rotated (the ref's
       lower whisper). */
    const tail2N = Math.round(3800 * feel.print.grain);
    const a2 = 0.42; // radians off the main axis
    for (let i = 0; i < tail2N; i++) {
      const s = Math.pow(rand(), 1.3);
      const a = a2 + (rand() + rand() + rand() - 1.5) * spread * 1.6;
      const dist = s * len * 0.7;
      push(
        hx + (dx * Math.cos(a) - dy * Math.sin(a)) * dist,
        hy + (dx * Math.sin(a) + dy * Math.cos(a)) * dist,
        rand(),
        (0.5 - s * 0.35) * 0.6,
        band(s * 0.7),
        0,
      );
    }

    /* Film-grain sky — the emulsion itself, everywhere. */
    const skyN = Math.round(((w * h) / 16) * feel.night.filmGrain);
    const dmax = Math.hypot(w, h);
    for (let i = 0; i < skyN; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const s = clamp01(Math.hypot(x - hx, y - hy) / dmax);
      push(x, y, rand(), 0.5, band(s), 2);
    }

    scene.gx = Float32Array.from(xs);
    scene.gy = Float32Array.from(ys);
    scene.gu = Float32Array.from(us);
    scene.gb = Float32Array.from(bs);
    scene.gc = Uint16Array.from(cs);
    scene.gk = Uint8Array.from(ks);
    scene.clusters = clusters;
  };

  const buildScene = (w: number, h: number): Scene | null => {
    const u = feel.universe;
    const mode = u.subject as Scene['mode'];
    const key = JSON.stringify([
      mode,
      u.seed,
      feel.print.grain,
      u.field,
      feel.night.filmGrain,
      mode === 'comet' ? [feel.comet, w, h] : 0,
    ]);
    if (sceneRef.current && sceneRef.current.key === key) return sceneRef.current;
    const rand = mulberry32(u.seed * 2654435761);
    const scene: Partial<Scene> = { mode, key };
    if (mode === 'comet') buildComet(rand, scene, w, h);
    else buildGalaxy(rand, scene);
    if (!scene.gx || !scene.gx.length) return null;

    const fCount = Math.floor(2600 * u.field);
    const fx = new Float32Array(fCount);
    const fy = new Float32Array(fCount);
    const fu = new Float32Array(fCount);
    const fm = new Float32Array(fCount);
    for (let i = 0; i < fCount; i++) {
      fx[i] = rand();
      fy[i] = rand();
      fu[i] = rand();
      fm[i] = rand();
    }
    scene.fx = fx;
    scene.fy = fy;
    scene.fu = fu;
    scene.fm = fm;
    sceneRef.current = scene as Scene;
    return sceneRef.current;
  };

  /* Every frame: print the playhead's state. Pure function of time + dials. */
  useLayoutEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    const px = feel.print.pixel;
    const w = Math.max(2, Math.floor(overlay.clientWidth / px));
    const h = Math.max(2, Math.floor(overlay.clientHeight / px));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scene = buildScene(w, h);
    if (!scene) return;
    const comet = scene.mode === 'comet';

    const img = ctx.createImageData(w, h);
    const buf = new Uint32Array(img.data.buffer);
    const GROUND = inkToInt(comet ? feel.night.skyBlue : feel.print.ground);
    const INK = inkToInt(comet ? feel.night.tail : feel.print.ink);
    const INK_HI = inkToInt(comet ? feel.night.head : feel.print.inkHi);
    const NOISE = lerpInt(GROUND, INK_HI, 0.26); // the emulsion speckle tone
    const STAR = comet ? lerpInt(GROUND, INK_HI, 0.8) : INK;
    buf.fill(GROUND);

    const t = tl.time;
    const u = feel.universe;
    const sky = tl.sky.current;
    const rv = tl.reveal.current;
    const dust = Number(tl.dust.current.opacity);
    const bloomDur = Math.max(tl.bloom.duration, 0.05);

    /* World → canvas: fit (galaxy only), settle, and the reveal's push. */
    const fit = comet ? 1 : (Math.min(w, h) / VIEW.h) * u.scale;
    const k = fit * sky.scale * Number(rv.scale);
    const rot = (sky.rotate * Math.PI) / 180;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    const wcx = comet ? w / 2 : VIEW.cx;
    const wcy = comet ? h / 2 : VIEW.cy;
    const ox = w / 2;
    const oy = h / 2;

    /* Per-cluster/band state for this instant. */
    const n = scene.clusters.length;
    const vis = new Float32Array(n);
    const dxA = new Float32Array(n);
    const dyA = new Float32Array(n);
    const amp = u.driftAmp * (comet ? 1.4 : 3.2);
    const spd = u.driftSpeed * 1.1;
    for (let i = 0; i < n; i++) {
      const c = scene.clusters[i];
      const bloomP = easeOutCubic(
        clamp01((t - (tl.sweep.at + c.r * tl.sweep.duration)) / bloomDur),
      );
      const meltP = easeOutCubic(
        clamp01((t - (tl.dissolve.at + c.r * tl.dissolve.duration)) / MELT_S),
      );
      vis[i] = bloomP * (1 - meltP);
      dxA[i] = Math.sin(t * spd * 2 + c.phase) * amp * (0.4 + c.r);
      dyA[i] = Math.cos(t * spd * 1.7 + c.phase2) * amp * (0.4 + c.r) * 0.8;
    }
    /* Falling head: it starts up-axis at the top of its trajectory and rides
       the sweep down to its resting spot; the tail bands light as it passes. */
    if (comet && n > COMET_BANDS) {
      const cm = feel.comet;
      const ang = (cm.angle * Math.PI) / 180;
      const hp = 1 - easeOutCubic(clamp01((t - tl.sweep.at) / tl.sweep.duration));
      const slide = cm.travel * cm.length * h * hp;
      dxA[COMET_BANDS] += Math.cos(ang) * slide;
      dyA[COMET_BANDS] += Math.sin(ang) * slide;
    }

    const { gx, gy, gu, gb, gc, gk } = scene;
    for (let i = 0; i < gx.length; i++) {
      const ci = gc[i];
      const v = vis[ci] * gb[i];
      if (v <= 0 || gu[i] >= v) continue;
      const lx = gx[i] + dxA[ci] - wcx;
      const ly = gy[i] + dyA[ci] - wcy;
      const X = (ox + (lx * cosR - ly * sinR) * k) | 0;
      const Y = (oy + (lx * sinR + ly * cosR) * k) | 0;
      if (X < 0 || X >= w || Y < 0 || Y >= h) continue;
      const idx = Y * w + X;
      const kind = gk[i];
      buf[idx] =
        kind === 2
          ? buf[idx] === GROUND
            ? NOISE
            : buf[idx]
          : buf[idx] !== GROUND || kind === 1
            ? INK_HI
            : INK;
    }

    /* Star field — melts with the same center-out wave. */
    const meltT = clamp01((t - tl.dissolve.at) / (tl.dissolve.duration + MELT_S));
    const { fx, fy, fu, fm } = scene;
    for (let i = 0; i < fx.length; i++) {
      if (fu[i] >= dust * 0.85) continue;
      const rn = Math.hypot(fx[i] - 0.5, fy[i] - 0.5) * 2;
      if (fm[i] < clamp01((meltT * 1.7 - rn * 0.6) / 0.55)) continue;
      const X = (fx[i] * w) | 0;
      const Y = (fy[i] * h) | 0;
      buf[Y * w + X] = STAR;
    }

    ctx.putImageData(img, 0, 0);

    /* The wall is the canvas + ground together: both thin away as one. */
    const wall = smooth(clamp01(Number(rv.wall)));
    canvas.style.opacity = String(wall);
    const groundHex = comet ? feel.night.skyBlue : feel.print.ground;
    const gn = parseInt(groundHex.replace('#', ''), 16);
    overlay.style.background = `rgba(${(gn >> 16) & 0xff}, ${(gn >> 8) & 0xff}, ${gn & 0xff}, ${wall})`;
  });

  return DEV ? (
    <>
      <DialRoot position="top-right" />
      <DialTimeline />
    </>
  ) : null;
}
