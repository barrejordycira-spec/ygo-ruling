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

function loadCards(): SlimCard[] {
  if (cardsCache) return cardsCache;

  const filePath = join(process.cwd(), "data", "cards-slim.json");
  const raw = readFileSync(filePath, "utf-8");
  cardsCache = JSON.parse(raw) as SlimCard[];

  // Build name index (both FR and EN names)
  nameIndex = new Map();
  for (const card of cardsCache) {
    nameIndex.set(card.name.toLowerCase(), card);
    if (card.name_en) {
      nameIndex.set(card.name_en.toLowerCase(), card);
    }
  }

  return cardsCache;
}

function getNameIndex(): Map<string, SlimCard> {
  if (!nameIndex) loadCards();
  return nameIndex!;
}

export function searchCards(query: string, maxResults = 10): SlimCard[] {
  const cards = loadCards();
  const index = getNameIndex();
  const queryLower = query.toLowerCase();
  const results: SlimCard[] = [];
  const seen = new Set<number>();

  // 1. Exact name match (FR or EN name found in query)
  for (const [name, card] of index) {
    if (queryLower.includes(name) && name.length > 2) {
      if (!seen.has(card.id)) {
        results.push(card);
        seen.add(card.id);
      }
    }
  }

  // 2. Partial name match (query words appear in FR or EN card name)
  if (results.length < maxResults) {
    const queryWords = queryLower
      .split(/[\s,;.!?'"()]+/)
      .filter((w) => w.length > 3);

    for (const card of cards) {
      if (seen.has(card.id)) continue;
      const names = card.name.toLowerCase() + " " + (card.name_en?.toLowerCase() ?? "");

      for (const word of queryWords) {
        if (names.includes(word) && word.length > 4) {
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
