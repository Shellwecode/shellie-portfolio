// Dev-only in-page copy editing. The InpageEditor component posts
// { file, edits: [{ original, edited }] } here; we find each original
// paragraph in the MDX source and rewrite it in place. Registered only on
// the dev server (astro:server:setup) — production builds never see this.
import fs from 'node:fs';
import path from 'node:path';

// The DOM's rendered text differs from source: smartypants curls quotes,
// soft line-wraps become spaces. Fold both sides to a comparable form.
const fold = (s) =>
  s
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim();

const wrap = (text, width = 76) => {
  const lines = [];
  let line = '';
  for (const w of text.split(/\s+/).filter(Boolean)) {
    if (line && (line + ' ' + w).length > width) {
      lines.push(line);
      line = w;
    } else line = line ? line + ' ' + w : w;
  }
  if (line) lines.push(line);
  return lines;
};

// Pure so it can be tested outside the server.
export function applyEdits(src, edits) {
  // keep frontmatter untouchable
  let bodyStart = 0;
  if (src.startsWith('---\n')) {
    const end = src.indexOf('\n---', 3);
    if (end !== -1) bodyStart = src.indexOf('\n', end + 1) + 1;
  }

  // blocks with source offsets, split on blank lines
  const blocks = [];
  let off = bodyStart;
  for (const part of src.slice(bodyStart).split(/\n{2,}/)) {
    if (!part.trim()) continue;
    const start = src.indexOf(part, off);
    blocks.push({ start, end: start + part.length, text: part });
    off = start + part.length;
  }

  // comparable text per block: headings lose their #-prefix, blockquotes
  // their > markers. Blocks with inline markup simply won't fold-match the
  // DOM text (which has no asterisks/brackets) and fall out as skips.
  const comparable = blocks.map((b) => {
    let text = b.text;
    let kind = 'plain';
    let prefix = '';
    const h = text.match(/^(#{1,6})\s+/);
    if (h) {
      kind = 'heading';
      prefix = h[1] + ' ';
      text = text.slice(h[0].length);
    } else if (text.split('\n').every((l) => l.startsWith('>'))) {
      kind = 'quote';
      text = text
        .split('\n')
        .map((l) => l.replace(/^>\s?/, ''))
        .join('\n');
    }
    return { ...b, kind, prefix, folded: fold(text) };
  });

  const results = [];
  const patches = [];
  for (const { original, edited } of edits) {
    const target = fold(original);
    const hits = comparable.filter((b) => b.folded === target);
    if (hits.length === 0) {
      results.push({ status: 'skipped', reason: 'no match in source (formatted or component text)' });
      continue;
    }
    if (hits.length > 1) {
      results.push({ status: 'skipped', reason: 'ambiguous — appears more than once' });
      continue;
    }
    const b = hits[0];
    if (patches.some((p) => p.start === b.start)) {
      results.push({ status: 'skipped', reason: 'block already edited in this batch' });
      continue;
    }
    const clean = edited.replace(/\s+/g, ' ').trim();
    const replacement =
      b.kind === 'heading'
        ? b.prefix + clean
        : b.kind === 'quote'
          ? wrap(clean).map((l) => '> ' + l).join('\n')
          : wrap(clean).join('\n');
    patches.push({ start: b.start, end: b.end, replacement });
    results.push({ status: 'applied' });
  }

  let out = src;
  for (const p of patches.sort((a, z) => z.start - a.start)) {
    out = out.slice(0, p.start) + p.replacement + out.slice(p.end);
  }
  return { out, results, applied: patches.length, skipped: results.length - patches.length };
}

// Frontmatter field edits ({ key, value }) — the page header's title/summary
// render from frontmatter, not the body, so they save through here.
export function applyFrontmatter(src, fmEdits) {
  const results = [];
  let applied = 0;
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  if (!m) {
    return {
      out: src,
      results: fmEdits.map(() => ({ status: 'skipped', reason: 'no frontmatter' })),
      applied,
    };
  }
  let fm = m[1];
  for (const { key, value } of fmEdits) {
    if (!/^[a-zA-Z][\w-]*$/.test(key ?? '')) {
      results.push({ status: 'skipped', reason: 'bad frontmatter key' });
      continue;
    }
    const re = new RegExp(`^(${key}:[ \\t]*)(.*)$`, 'm');
    if (!re.test(fm)) {
      results.push({ status: 'skipped', reason: `${key} not in frontmatter` });
      continue;
    }
    const clean = String(value).replace(/\s+/g, ' ').trim();
    if (!clean) {
      results.push({ status: 'skipped', reason: `${key} would be empty` });
      continue;
    }
    fm = fm.replace(re, (line, prefix, old) => {
      // keep a trailing comment if the old value had one outside its quotes
      const comment = old.match(/^(["'].*?["']|[^#]*?)\s*(#.*)$/)?.[2];
      return prefix + JSON.stringify(clean) + (comment ? ' ' + comment : '');
    });
    results.push({ status: 'applied' });
    applied++;
  }
  const out = '---\n' + fm + src.slice(4 + m[1].length);
  return { out, results, applied };
}

export default function inpageEdit() {
  return {
    name: 'inpage-edit',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use('/__inpage-edit', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            return res.end();
          }
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const { file, edits = [], fmEdits = [] } = JSON.parse(body);
              const abs = path.resolve(server.config.root, file);
              const contentDir = path.resolve(server.config.root, 'src/content');
              if (!abs.startsWith(contentDir + path.sep))
                throw new Error('only files under src/content are editable');
              const src = fs.readFileSync(abs, 'utf8');
              const bodyPass = applyEdits(src, edits);
              const fmPass = applyFrontmatter(bodyPass.out, fmEdits);
              const applied = bodyPass.applied + fmPass.applied;
              if (applied > 0) fs.writeFileSync(abs, fmPass.out);
              const results = [...bodyPass.results, ...fmPass.results];
              res.end(
                JSON.stringify({
                  applied,
                  skipped: results.filter((r) => r.status === 'skipped').length,
                  results,
                })
              );
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: String(e?.message ?? e) }));
            }
          });
        });
      },
    },
  };
}
