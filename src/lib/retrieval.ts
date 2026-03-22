import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { searchCards, type SlimCard } from "./cards";

export interface RuleSection {
  id: string;
  title: string;
  keywords: string[];
  content: string;
}

interface RulesData {
  sections: RuleSection[];
}

let rulesCache: RuleSection[] | null = null;

function loadRules(): RuleSection[] {
  if (rulesCache) return rulesCache;

  const filePath = join(process.cwd(), "data", "rules.json");
  if (!existsSync(filePath)) {
    rulesCache = [];
    return rulesCache;
  }

  const raw = readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as RulesData;
  rulesCache = data.sections;
  return rulesCache;
}

// Additional ruling keywords for concept matching
const RULING_KEYWORDS: Record<string, string[]> = {
  chain: ["chaîne", "chain", "chain link", "maillon", "réponse"],
  damage_step: ["damage step", "étape des dommages", "damage calculation", "calcul des dommages"],
  timing: ["timing", "manquer le timing", "missing the timing", "si", "lorsque", "when", "if"],
  targeting: ["cibler", "cible", "target", "targeting", "ciblage"],
  cost: ["coût", "cost", "payer", "pay", "défausser", "bannir", "tributer"],
  negate: ["annuler", "negate", "négation", "annulation"],
  summon: ["invoquer", "invocation", "summon", "invocation spéciale", "invocation normale"],
  once_per_turn: ["une fois par tour", "once per turn"],
  spell_speed: ["spell speed", "vitesse de sort", "quick effect", "effet rapide"],
  continuous: ["continu", "continuous", "effet continu"],
  graveyard: ["cimetière", "graveyard", "gy"],
  banish: ["bannir", "banish", "bannissement"],
  extra_deck: ["extra deck", "fusion", "synchro", "xyz", "lien", "link", "pendule"],
};

export function findRelevantRules(query: string, maxResults = 5): RuleSection[] {
  const rules = loadRules();
  if (rules.length === 0) return [];

  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter((w: string) => w.length > 3);

  const scored = rules.map((section) => {
    let score = 0;

    // 1. Match on section keywords (highest priority)
    for (const kw of section.keywords) {
      if (queryLower.includes(kw)) score += 5;
    }

    // 2. Match on ruling concept keywords
    for (const [, keywords] of Object.entries(RULING_KEYWORDS)) {
      const queryMatch = keywords.some((kw) => queryLower.includes(kw));
      const sectionMatch = keywords.some((kw) =>
        section.keywords.some((sk) => sk.includes(kw)) ||
        section.title.toLowerCase().includes(kw)
      );
      if (queryMatch && sectionMatch) score += 3;
    }

    // 3. Direct word overlap with title and content
    const sectionText = `${section.title} ${section.content}`.toLowerCase();
    for (const word of queryWords) {
      if (section.title.toLowerCase().includes(word)) score += 2;
      else if (sectionText.includes(word)) score += 1;
    }

    return { section, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((s) => s.section);
}

export function findRelevantCards(query: string): SlimCard[] {
  return searchCards(query, 10);
}
