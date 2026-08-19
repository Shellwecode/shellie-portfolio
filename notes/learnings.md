# Learnings

A running log of things this site taught me while building it. One entry per
lesson, newest first. Someday this compiles into a single knowledge doc.

## 2026-08-19 — the deploy that grew a crumb & ate the stagger

Two bugs in one day, same root: the production build is a different country,
and dev never shows you its borders. Both were invisible locally and obvious
live. New habit: when JS reads anything the build wrote (pathnames, CSS
output), verify against `astro preview`, not just dev.

### Built pages wear a trailing slash dev pages don't
Astro dev serves `/projects`; the static build writes `projects/index.html`,
so the same page's `Astro.url.pathname` is `/projects/`. My crumb check
`pathname.startsWith('/projects/')` meant "nested page only" — in prod the
index page matched its own prefix and wore the way back home. Normalize the
trailing slash before any prefix test.

### The minifier rewrites units — `parseFloat` readers break in builds only
I ship motion dials as custom properties (`--ent-ms: 950ms`) and read them
back in JS for WAAPI replays. The CSS minifier rewrites `950ms` as `.95s`
(fewer bytes, same CSS), and `parseFloat` drops the unit: dev read 950,
prod read 0.95 — the whole entrance stagger played in under a millisecond.
Sneaky because CSS-driven uses of the same var kept working (CSS understands
any unit), so first visits staggered and every replay popped. A custom
property is a string with a unit, not a number; any JS reader must parse
the unit (`src/scripts/css-time.ts` now does). Wider rule: the minifier may
respell anything CSS-equivalent, so JS that string-reads CSS must accept
every equivalent spelling.

## 2026-08-04 — the album switch & smooth scroll

### Smooth scroll decouples input from position — inertia outlives your pin
Lenis (and any lerp-based smooth scroll) sits between the wheel and the page:
input feeds a *target*, the page eases toward it. Two consequences bit me:

- The glide continues after the gesture ends, so scroll-triggered breakpoints
  fire on momentum I didn't mean to spend.
- A trackpad flick keeps emitting inertia deltas *after* the gesture — so
  programmatically pinning the scroll position (`scrollTo(..., immediate)`)
  isn't enough. The leftover inertia lands on the new position and keeps
  scrolling. Fix: pin, then `lenis.stop()` for a settle window (~400–700ms)
  so the tail hits a dead wheel, then `start()` again.

Rule of thumb: any scroll choreography must be designed against the *input
system*, not just the scroll position.

### Validation clamps can silently eat tuned values
The switch clamped `land ≤ enter − 10` — sensible for the original numbers,
but when I dialed `enter` down to 20, my `land: 56` was silently forced to 20.
I was tuning a value that wasn't even in effect. If code clamps a tunable,
the clamp should exist for a *stated* reason (mine only needed `land > exit`),
and ideally tuning UIs should surface when a value is being overridden.

### CSS `var()` fallbacks make dev tuning panels free
Pattern worth reusing: ship values as fallbacks (`var(--sw-fall, 76px)`),
let a dev-only panel write the custom properties on `<html>`. Production pays
zero cost — no JS, no panel, identical CSS — and the panel can drive every
timing/distance/ease live. Promoting an experiment = copying dial values into
the fallbacks.

### Dev-server ECONNRESET is usually the browser hanging up, not a bug
Browsers fetch video with range requests and cancel them aggressively (hover
out, buffered enough, navigation). Each cancel is an abrupt socket close the
dev server logs as `ECONNRESET`. Harmless noise — filterable with a Vite
`customLogger`. Real errors still pass through.
