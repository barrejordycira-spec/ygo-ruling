import { readFileSync } from "fs";
import { join } from "path";

export interface SlimCard {
  id: number;
  name: string;
  name_en?: string;
  type: string;
  desc: string;
  race?: string;
  atk?: number;
  def?: number;
  level?: number;
  attribute?: string;
  archetype?: string;
  banlist_info?: {
    ban_tcg?: string;
    ban_ocg?: string;
  };
}

let cardsCache: SlimCard[] | null = null;
let nameIndex: Map<string, SlimCard> | null = null;
let normalizedIndex: Map<string, SlimCard> | null = null;

// Normalize: strip accents, lowercase, remove hyphens/apostrophes,
// collapse double letters (mirroirjade -> miroirjade)
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/['\-–—]/g, " ")         // hyphens/apostrophes become spaces
    .replace(/[^a-z0-9\s]/g, "")     // keep only alphanumeric + spaces
    .replace(/(.)\1+/g, "$1")        // collapse double letters: rr->r, ee->e
    .replace(/\s+/g, " ")
    .trim();
}

function loadCards(): SlimCard[] {
  if (cardsCache) return cardsCache;

  const filePath = join(process.cwd(), "data", "cards-slim.json");
  const raw = readFileSync(filePath, "utf-8");
  cardsCache = JSON.parse(raw) as SlimCard[];

  // Build exact name index (both FR and EN)
  nameIndex = new Map();
  normalizedIndex = new Map();
  for (const card of cardsCache) {
    nameIndex.set(card.name.toLowerCase(), card);
    normalizedIndex.set(normalize(card.name), card);
    if (card.name_en) {
      nameIndex.set(card.name_en.toLowerCase(), card);
      normalizedIndex.set(normalize(card.name_en), card);
    }
  }

  return cardsCache;
}

function getNameIndex(): Map<string, SlimCard> {
  if (!nameIndex) loadCards();
  return nameIndex!;
}

function getNormalizedIndex(): Map<string, SlimCard> {
  if (!normalizedIndex) loadCards();
  return normalizedIndex!;
}

export function searchCards(query: string, maxResults = 10): SlimCard[] {
  const cards = loadCards();
  const index = getNameIndex();
  const normIndex = getNormalizedIndex();
  const queryLower = query.toLowerCase();
  const queryNorm = normalize(query);
  const results: SlimCard[] = [];
  const seen = new Set<number>();

  // 1. Exact substring match (FR or EN name found in query)
  for (const [name, card] of index) {
    if (queryLower.includes(name) && name.length > 2) {
      if (!seen.has(card.id)) {
        results.push(card);
        seen.add(card.id);
      }
    }
  }

  // 2. Normalized substring match (handles accents, hyphens, double letters)
  if (results.length < maxResults) {
    for (const [name, card] of normIndex) {
      if (seen.has(card.id)) continue;
      if (queryNorm.includes(name) && name.length > 2) {
        results.push(card);
        seen.add(card.id);
      }
    }
  }

  // 3. Match multi-word fragments from query against normalized card names
  //    Build fragments of 2-4 consecutive words to match compound names
  if (results.length < maxResults) {
    const words = queryNorm.split(/\s+/).filter((w) => w.length >= 2);
    const fragments: string[] = [];

    // Single words (>= 6 chars only to avoid noise)
    for (const w of words) {
      if (w.length >= 6) fragments.push(w);
    }
    // Multi-word combos (2-4 words, joined by space)
    for (let len = 2; len <= Math.min(4, words.length); len++) {
      for (let i = 0; i <= words.length - len; i++) {
        const frag = words.slice(i, i + len).join(" ");
        if (frag.length >= 6) fragments.push(frag);
      }
    }

    for (const card of cards) {
      if (seen.has(card.id)) continue;
      const names = normalize(card.name) + " " + (card.name_en ? normalize(card.name_en) : "");

      for (const frag of fragments) {
        if (names.includes(frag)) {
          results.push(card);
          seen.add(card.id);
          break;
        }
      }

      if (results.length >= maxResults) break;
    }
  }

  return results.slice(0, maxResults);
}
