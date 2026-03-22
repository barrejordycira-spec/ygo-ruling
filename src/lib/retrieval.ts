import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { searchCards, type SlimCard } from "./cards";

export interface RuleSection {
  id: string;
  title: string;
  content: string;
}

interface RulesData {
  sections: {
    id: string;
    title: string;
    content?: string;
    subsections?: RuleSection[];
  }[];
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

  // Flatten all sections and subsections
  rulesCache = [];
  for (const section of data.sections) {
    if (section.content) {
      rulesCache.push({
        id: section.id,
        title: section.title,
        content: section.content,
      });
    }
    if (section.subsections) {
      for (const sub of section.subsections) {
        rulesCache.push(sub);
      }
    }
  }

  return rulesCache;
}

// Keywords mapped to ruling concepts for better matching
const RULING_KEYWORDS: Record<string, string[]> = {
  chain: ["chaîne", "chain", "chain link", "maillon", "réponse"],
  damage_step: ["damage step", "étape des dommages", "damage calculation", "calcul des dommages"],
  timing: ["timing", "manquer le timing", "missing the timing", "si", "lorsque", "when", "if"],
  targeting: ["cibler", "cible", "target", "targeting", "ciblage"],
  cost: ["coût", "cost", "payer", "pay", "défausser", "bannir", "tributer"],
  negate: ["annuler", "negate", "négation", "annulation", "negate the activation"],
  summon: ["invoquer", "invocation", "summon", "normal summon", "special summon", "invocation spéciale"],
  once_per_turn: ["une fois par tour", "once per turn", "hard once per turn", "soft once per turn"],
  spell_speed: ["spell speed", "vitesse de sort", "quick effect", "effet rapide"],
  continuous: ["continu", "continuous", "effet continu"],
  graveyard: ["cimetière", "graveyard", "gy", "cemetery"],
  banish: ["bannir", "banish", "bannissement", "removed from play"],
  extra_deck: ["extra deck", "deck extra", "fusion", "synchro", "xyz", "lien", "link", "pendule", "pendulum"],
};

export function findRelevantRules(query: string, maxResults = 5): RuleSection[] {
  const rules = loadRules();
  if (rules.length === 0) return [];

  const queryLower = query.toLowerCase();

  // Score each section
  const scored = rules.map((section) => {
    let score = 0;
    const sectionText = `${section.title} ${section.content}`.toLowerCase();

    // Check ruling keyword matches
    for (const [, keywords] of Object.entries(RULING_KEYWORDS)) {
      const queryMatch = keywords.some((kw) => queryLower.includes(kw));
      const sectionMatch = keywords.some((kw) => sectionText.includes(kw));
      if (queryMatch && sectionMatch) score += 3;
    }

    // Direct word overlap
    const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 3);
    for (const word of queryWords) {
      if (sectionText.includes(word)) score += 1;
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
