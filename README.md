# shelliehxx.com

Personal site, built in Astro. Warm, quiet, minimal.

## Run it locally

You'll need Node 20 or later.

```bash
npm install
npm run dev
```

Open <http://localhost:4321>. Saves auto-reload.

To build for production:

```bash
npm run build
npm run preview   # preview the built site
```

## The shape of things

```
src/
  content/          ← everything you write lives here
    projects/       ← case studies (.mdx)
    writing/        ← posts (.mdx)
    doodles/        ← image + caption entries (.mdx)
  pages/            ← URLs
  layouts/          ← page shells
  components/       ← reusable bits
  styles/global.css ← design tokens (colors, fonts, spacing)
```

The homepage pulls from all three content collections, tags each entry by
kind (`work`, `writing`, `doodle`), and sorts everything by date into one
archive. That's it. That's the whole idea.

## Adding a new project

Create a new file in `src/content/projects/`:

```mdx
---
title: "Project name"
summary: "One line for the archive row."
year: 2026
role: "Product Design"        # optional
company: "Where"              # optional
tags: ["work", "mobile"]
cover: "./cover.png"          # optional; drop image next to the mdx
draft: false
---

## Section

Your prose. Write it in first person, past tense, with a real stake.
What was broken, what you tried, what you learned.
```

Set `draft: true` to hide it from the archive while you work.

To link out instead of writing a case study — say, a live product or a
Medium post — use `external` instead:

```yaml
external: "https://example.com"
```

## Adding a writing post

New file in `src/content/writing/`:

```mdx
---
title: "Your title"
summary: "Optional one-line preview."
date: 2026-04-16
tags: ["notes"]
draft: false
---

Your words.
```

## Adding a doodle

Drop the image into `src/content/doodles/` next to a matching `.mdx`:

```
src/content/doodles/
  new-drawing.png
  new-drawing.mdx
```

The `.mdx`:

```mdx
---
title: "A short title"
date: 2026-04-16
image: "./new-drawing.png"
alt: "A sentence describing it, for screen readers"
caption: "Optional note about it."
draft: false
---
```

PNG, JPG, SVG, WebP all work. Astro's `<Image>` handles resizing and
optimization automatically.

## Changing the look

Almost all visual decisions live in `src/styles/global.css` under `@theme`.
The tokens to play with first:

- `--color-bg` — the warm cream background
- `--color-ink` — the warm dark text
- `--color-accent` — the sienna accent (used sparingly)
- `--measure` — the reading column width (default 36rem / ~640px)

Swap `--font-sans` if you want to try a different body face. I'd recommend
trying **Söhne**, **Geist**, or **Instrument Sans** if you ever want to move
away from Inter.

## Updating the `/now` page

Edit `src/pages/now.astro`. Bump the `lastUpdated` string at the top when
you change it. A `/now` page is the warmest page on most sites — it tells
people you're still here, still making things. Aim to update it every month
or two.

## Deploy

The easiest path:

1. Push this repo to GitHub.
2. Go to <https://vercel.com/new> and import the repo. Vercel detects Astro
   automatically. Click deploy. You'll get a live URL in about 30 seconds,
   something like `shelliehxx.vercel.app`.
3. Once the Vercel site looks right, point `shelliehxx.com` at it: in
   Vercel's project settings, add the custom domain. It'll give you the
   exact DNS records to set at your registrar (one `A` record and one
   `CNAME` for `www`). Change those at your registrar, wait a few minutes,
   done.
4. *Then* (not before) unpublish from Webflow.

Netlify works just as well if you prefer it — same flow.

## Things to do after the first deploy

- [ ] Replace the `[what you're working on]` placeholder in `src/pages/index.astro`
- [ ] Write a real `/now` page
- [ ] Swap the placeholder doodle SVGs for real scans
- [ ] Add a project cover image to each project's frontmatter
- [ ] Write one or two posts that aren't starter content
- [ ] Update the footer links if you want to add or remove any

## A few opinions baked in

- No analytics by default. If you want them, [Plausible](https://plausible.io)
  or [Fathom](https://usefathom.com) are the quiet options.
- View Transitions are on — page-to-page navigation fades softly instead of
  hard-cutting. Disable by removing `<ClientRouter />` from `Base.astro`.
- The whole site is static (`output: 'static'` is the Astro default). It'll
  work on any host. No server to maintain.
- Fonts load from Google Fonts for now. For best performance, self-host
  them later — drop `.woff2` files in `public/fonts/` and add `@font-face`
  rules to `global.css`.

— s.
