// Keyword search over the knowledge base (app/data).
// v1: rereads every file on each request, exact words only, no synonyms (bugs B4 and B8).
// v2: cached base, one document per policy file, accent-insensitive, city/state mapped to region,
// includes the product catalog.
const fs = require('node:fs');
const path = require('node:path');
const { normalize, findRegion } = require('./text');

const POLICIES_DIR = path.join(__dirname, 'data', 'policies');
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');

const STOPWORDS = new Set(['qual', 'quais', 'para', 'como', 'quando', 'onde', 'voces', 'vocês', 'meu', 'minha', 'esse', 'essa', 'isso', 'pode', 'posso', 'tem', 'temos', 'sobre', 'uma', 'umas', 'uns', 'com', 'sem', 'por', 'que', 'dos', 'das', 'nos', 'nas', 'mais', 'muito', 'produto', 'produtos', 'faco', 'fazer', 'quero', 'compra', 'compras', 'pedido', 'dados', 'mostra']);

function readChunks() {
  const chunks = [];
  for (const file of fs.readdirSync(POLICIES_DIR).sort()) {
    const content = fs.readFileSync(path.join(POLICIES_DIR, file), 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const text = line.trim();
      if (text && !text.startsWith('#')) chunks.push(text);
    }
  }
  return chunks;
}

// v2: each policy file is one document (title included), so related rules stay together
function readDocuments() {
  return fs.readdirSync(POLICIES_DIR).sort().map((file) =>
    fs
      .readFileSync(path.join(POLICIES_DIR, file), 'utf8')
      .split(/\r?\n/)
      .map((line) => line.replace(/^#+\s*/, '').trim())
      .filter(Boolean)
      .join(' '),
  );
}

function productChunks() {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  return products.map((p) => `Produto ${p.name}: R$ ${p.price.toFixed(2).replace('.', ',')}`);
}

function topChunks(scored, limit) {
  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.text);
}

function searchV1(message) {
  const chunks = readChunks(); // no cache: rereads the files on every request
  const words = String(message).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 3);
  const scored = chunks.map((text) => {
    const lower = text.toLowerCase();
    return { text, score: words.filter((w) => lower.includes(w)).length };
  });
  return topChunks(scored, 3);
}

let cache = null;
function searchV2(message) {
  if (!cache) {
    cache = [...readDocuments(), ...productChunks()].map((text) => ({ text, normalized: normalize(text) }));
  }
  const words = normalize(message)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .map((w) => (w.length > 5 ? w.slice(0, 5) : w)); // simple stemming: trocar -> troca
  const region = findRegion(message);
  if (region) words.push(normalize(region.name));

  const scored = cache.map((chunk) => {
    let score = words.filter((w) => chunk.normalized.includes(w)).length;
    if (region && chunk.normalized.includes(`regiao ${normalize(region.name)}:`)) score += 5;
    return { text: chunk.text, score };
  });

  // Keeps only chunks close to the best one, so the context has no leftovers
  const best = Math.max(0, ...scored.map((item) => item.score));
  const chunks = topChunks(scored.filter((item) => item.score >= best / 2), 3);

  // City or state mentioned: the shipping document states which region it belongs to
  if (region && normalize(region.match) !== normalize(region.name)) {
    const note = `${region.match} fica na Região ${region.name}.`;
    const index = chunks.findIndex((chunk) => normalize(chunk).includes(`regiao ${normalize(region.name)}:`));
    if (index >= 0) chunks[index] = `${note} ${chunks[index]}`;
    else chunks.unshift(note);
  }
  return chunks;
}

function search(message, version) {
  return version === 'v2' ? searchV2(message) : searchV1(message);
}

module.exports = { search };
