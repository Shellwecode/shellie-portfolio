// The copy editor's server half — a dev-only middleware, wired in as an
// Astro integration. The in-page editor (components/CopyEditor.astro) sends
// the rendered text of a clicked block; /resolve maps it back to the raw
// MDX source block, /save patches that block in the file. Astro's content
// watcher then reloads the page, so the edit round-trips through the real
// pipeline. Never part of the build: astro:server:setup only fires in dev.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../content');
const COLLECTIONS = new Set(['projects', 'writing']);
const SLUG = /^[a-z0-9-]+$/;

// Rendered text and MDX source meet halfway: markdown syntax stripped,
// whitespace collapsed. Images resolve to their alt text on both sides.
const normalize = (s) =>
  s
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*(?:[-+*]|\d+\.)\s+/gm, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const tokens = (s) => normalize(s).toLowerCase().split(' ').filter(Boolean);

// Multiset token overlap (Dice) — tolerant of small render/source drift.
function similarity(a, b) {
  if (!a.length || !b.length) return 0;
  const bag = new Map();
  for (const t of a) bag.set(t, (bag.get(t) ?? 0) + 1);
  let common = 0;
  for (const t of b) {
    const n = bag.get(t) ?? 0;
    if (n > 0) {
      common += 1;
      bag.set(t, n - 1);
    }
  }
  return (2 * common) / (a.length + b.length);
}

function splitDoc(file) {
  const m = file.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  return m ? { head: m[0], body: file.slice(m[0].length) } : { head: '', body: file };
}

// Source blocks keep their exact raw text so /save can string-replace them.
function splitBlocks(body) {
  const blocks = [];
  const re = /\n{2,}/g;
  let last = 0;
  let m;
  while ((m = re.exec(body))) {
    const raw = body.slice(last, m.index);
    if (raw.trim()) blocks.push(raw);
    last = re.lastIndex;
  }
  const tail = body.slice(last);
  if (tail.trim()) blocks.push(tail);
  return blocks;
}

function contentFile(collection, slug) {
  if (!COLLECTIONS.has(collection) || !SLUG.test(slug)) return null;
  return path.join(CONTENT, collection, `${slug}.mdx`);
}

const send = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

async function handle(req, res) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const { collection, slug, text, original, updated, needle, dir, ops } = JSON.parse(
    Buffer.concat(chunks).toString('utf8') || '{}'
  );

  const file = contentFile(collection ?? '', slug ?? '');
  if (!file) return send(res, 400, { error: 'unknown collection or slug' });
  const doc = splitDoc(await readFile(file, 'utf8'));

  if (req.url === '/resolve') {
    const want = tokens(text ?? '');
    let best = null;
    let bestScore = 0;
    for (const block of splitBlocks(doc.body)) {
      const score =
        normalize(block) === normalize(text ?? '') ? 1 : similarity(want, tokens(block));
      if (score > bestScore) {
        bestScore = score;
        best = block;
      }
    }
    if (!best || bestScore < 0.35)
      return send(res, 404, { error: 'no matching source block found' });
    return send(res, 200, { block: best, score: Number(bestScore.toFixed(3)) });
  }

  if (req.url === '/save') {
    if (typeof original !== 'string' || typeof updated !== 'string')
      return send(res, 400, { error: 'original and updated are required' });
    const at = doc.body.indexOf(original);
    if (at === -1)
      return send(res, 409, { error: 'source changed underneath the editor — reopen the block' });
    const body = doc.body.slice(0, at) + updated + doc.body.slice(at + original.length);
    await writeFile(file, doc.head + body, 'utf8');
    return send(res, 200, { ok: true });
  }

  if (req.url === '/move') {
    // Swap a media block with its neighbor. The client sends a needle that
    // uniquely identifies the block in raw source (an image's `![alt]`, a
    // video's src path, a ScrollStage's label="…"), and dir = -1 (up) / 1
    // (down). String surgery preserves the exact separators between blocks.
    if (typeof needle !== 'string' || !needle || (dir !== -1 && dir !== 1))
      return send(res, 400, { error: 'needle and dir (±1) are required' });
    const blocks = splitBlocks(doc.body);
    const hits = blocks.filter((b) => b.includes(needle));
    if (hits.length === 0) return send(res, 404, { error: 'no block contains that needle' });
    if (hits.length > 1) return send(res, 409, { error: 'needle is ambiguous — matches several blocks' });
    const i = blocks.indexOf(hits[0]);
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return send(res, 409, { error: 'already at the edge' });
    if (blocks[i].startsWith('import ') || blocks[j].startsWith('import '))
      return send(res, 409, { error: 'refusing to move across the import block' });
    const [first, second] = dir === 1 ? [blocks[i], blocks[j]] : [blocks[j], blocks[i]];
    const posFirst = doc.body.indexOf(first);
    const posSecond = doc.body.indexOf(second, posFirst + first.length);
    if (posFirst === -1 || posSecond === -1)
      return send(res, 409, { error: 'source changed underneath the mover' });
    const body =
      doc.body.slice(0, posFirst) +
      second +
      doc.body.slice(posFirst + first.length, posSecond) +
      first +
      doc.body.slice(posSecond + second.length);
    await writeFile(file, doc.head + body, 'utf8');
    return send(res, 200, { ok: true });
  }

  if (req.url === '/arrange') {
    // Batch rearrangement: the client drags media freely in the DOM, then
    // sends every moved block's needle with its new anchor — the block it
    // now sits AFTER ({kind:'needle'|'text', value}) or null for the top of
    // the body. Ops arrive in document order, so anchors that are themselves
    // moved media are already seated when later ops reference them. One
    // write, one reload. Separators normalize to a single blank line.
    if (!Array.isArray(ops) || ops.length === 0)
      return send(res, 400, { error: 'ops[] is required' });
    let blocks = splitBlocks(doc.body);
    const firstContent = Math.max(0, blocks.findIndex((b) => !b.startsWith('import ')));

    // Resolve an anchor ref against the block list. Text anchors match by
    // (1) normalized equality, (2) containment either way — the DOM element
    // may be just a fragment of a multi-line source block — scored by how
    // tightly it fits, (3) token overlap as the last resort.
    const anchorIndex = (ref) => {
      if (!ref || typeof ref.value !== 'string' || !ref.value) return -1;
      if (ref.kind === 'needle') return blocks.findIndex((b) => b.includes(ref.value));
      const normRef = normalize(ref.value);
      if (!normRef) return -1;
      const want = tokens(ref.value);
      let best = -1;
      let bestScore = 0;
      blocks.forEach((b, k) => {
        const nb = normalize(b);
        let score;
        if (nb === normRef) score = 1;
        else if (normRef.length >= 12 && nb.includes(normRef))
          score = 0.6 + 0.4 * (normRef.length / nb.length);
        else if (nb.length >= 12 && normRef.includes(nb))
          score = 0.6 + 0.4 * (nb.length / normRef.length);
        else score = similarity(want, tokens(b));
        if (score > bestScore) {
          bestScore = score;
          best = k;
        }
      });
      return bestScore >= 0.35 ? best : -1;
    };

    // Best-effort: a failed anchor skips that one op (the block stays where
    // it was) instead of aborting the whole arrangement.
    const skipped = [];
    let moved = 0;
    for (const op of ops) {
      if (typeof op?.needle !== 'string' || !op.needle)
        return send(res, 400, { error: 'every op needs a needle' });
      const matches = blocks.filter((b) => b.includes(op.needle));
      if (matches.length !== 1) {
        skipped.push(op.needle);
        continue;
      }
      const origIndex = blocks.indexOf(matches[0]);
      const [media] = blocks.splice(origIndex, 1);
      let at = null;
      if (!op.after && !op.before) at = firstContent;
      if (at === null && op.after) {
        const j = anchorIndex(op.after);
        if (j !== -1) at = j + 1;
      }
      if (at === null && op.before) {
        const j = anchorIndex(op.before);
        if (j !== -1) at = j;
      }
      if (at === null) {
        blocks.splice(origIndex, 0, media); // put it back, move on
        skipped.push(op.needle);
        continue;
      }
      blocks.splice(at, 0, media);
      moved += 1;
    }
    if (moved > 0) await writeFile(file, doc.head + blocks.join('\n\n') + '\n', 'utf8');
    return send(res, 200, { ok: true, moved, skipped });
  }

  return send(res, 404, { error: 'unknown endpoint' });
}

export default function copyEditor() {
  return {
    name: 'copy-editor',
    hooks: {
      'astro:server:setup'({ server }) {
        server.middlewares.use('/__copyedit', (req, res) => {
          handle(req, res).catch((e) => send(res, 500, { error: String(e?.message ?? e) }));
        });
      },
    },
  };
}
