import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const RULES_DIR = join(process.cwd(), "rules");
const OUTPUT = join(process.cwd(), "data", "rules.json");

interface RuleSection {
  id: string;
  title: string;
  keywords: string[];
  content: string;
}

// Sections defined by line ranges in rules_raw.txt (1-indexed)
const LINE_SECTIONS: { title: string; start: number; end: number; keywords: string[] }[] = [
  {
    title: "About the Game & Deck Building",
    start: 29, end: 163,
    keywords: ["game", "duel", "deck", "extra deck", "side deck", "main deck", "cards", "limit"],
  },
  {
    title: "The Game Mat & Zones",
    start: 152, end: 212,
    keywords: ["zone", "monster zone", "spell trap zone", "graveyard", "field", "extra monster zone", "pendulum zone"],
  },
  {
    title: "Monster Cards & Effect Types",
    start: 213, end: 354,
    keywords: ["monster", "normal", "effect", "continuous effect", "ignition effect", "quick effect", "trigger effect", "flip effect", "atk", "def", "level", "attribute", "type"],
  },
  {
    title: "Link Monsters",
    start: 355, end: 430,
    keywords: ["link", "link rating", "link arrow", "link material", "link summon", "extra monster zone"],
  },
  {
    title: "Pendulum Monsters",
    start: 430, end: 498,
    keywords: ["pendulum", "scale", "pendulum zone", "pendulum summon", "pendulum effect"],
  },
  {
    title: "Xyz Monsters",
    start: 499, end: 551,
    keywords: ["xyz", "rank", "material", "overlay", "detach", "xyz summon"],
  },
  {
    title: "Synchro Monsters",
    start: 552, end: 598,
    keywords: ["synchro", "tuner", "level", "synchro summon", "synchro material"],
  },
  {
    title: "Fusion Monsters",
    start: 599, end: 656,
    keywords: ["fusion", "polymerization", "fusion material", "fusion summon"],
  },
  {
    title: "Ritual Monsters",
    start: 614, end: 661,
    keywords: ["ritual", "ritual spell", "ritual summon", "tribute"],
  },
  {
    title: "Summoning Monster Cards",
    start: 662, end: 729,
    keywords: ["summon", "normal summon", "tribute summon", "set", "flip summon", "special summon"],
  },
  {
    title: "Spell Cards",
    start: 730, end: 831,
    keywords: ["spell", "normal spell", "continuous spell", "equip", "field spell", "quick-play", "ritual spell"],
  },
  {
    title: "Trap Cards",
    start: 832, end: 890,
    keywords: ["trap", "normal trap", "continuous trap", "counter trap", "set", "activate"],
  },
  {
    title: "Preparing to Duel & Turn Structure",
    start: 891, end: 942,
    keywords: ["prepare", "duel", "lp", "life points", "turn", "phase", "coin", "first turn", "turn structure"],
  },
  {
    title: "Draw Phase & Standby Phase",
    start: 935, end: 980,
    keywords: ["draw", "draw phase", "standby", "standby phase"],
  },
  {
    title: "Main Phase",
    start: 981, end: 1009,
    keywords: ["main phase", "summon", "set", "spell", "trap", "change position"],
  },
  {
    title: "Battle Phase",
    start: 1009, end: 1094,
    keywords: ["battle", "attack", "start step", "battle step", "damage step", "end step", "replay", "direct attack"],
  },
  {
    title: "End Phase & Hand Limit",
    start: 1094, end: 1113,
    keywords: ["end phase", "hand limit", "end of turn", "discard"],
  },
  {
    title: "Monster Battle Rules",
    start: 1100, end: 1190,
    keywords: ["battle", "attack", "defense", "damage", "position", "atk", "def", "destroy", "battle damage"],
  },
  {
    title: "Damage Step Rules",
    start: 1114, end: 1190,
    keywords: ["damage step", "start", "flip", "damage calculation", "after damage", "substep"],
  },
  {
    title: "Chains and Spell Speed",
    start: 1190, end: 1293,
    keywords: ["chain", "spell speed", "chain link", "resolve", "activation", "quick effect", "counter trap"],
  },
  {
    title: "Other Rules",
    start: 1293, end: 1420,
    keywords: ["banish", "token", "forbidden", "limited", "semi-limited", "match", "side deck", "public knowledge"],
  },
  {
    title: "Glossary",
    start: 1420, end: 1579,
    keywords: ["target", "cost", "activate", "summon", "send", "destroy", "negate", "control", "owner", "glossary"],
  },
];

function cleanText(text: string): string {
  return text
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return false;
      if (/^[\divx]{1,4}$/i.test(t)) return false;
      if (/^\d{1,3}\s+\d{1,3}$/.test(t)) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function main() {
  console.log("Reading rules text files...");

  const rulesLines = readFileSync(join(RULES_DIR, "rules_raw.txt"), "utf-8").split("\n");
  const fastEffect = readFileSync(join(RULES_DIR, "fast-effect-timing.txt"), "utf-8");
  const otherInfo = readFileSync(join(RULES_DIR, "other-info.txt"), "utf-8");

  console.log(`rules_raw.txt: ${rulesLines.length} lines`);
  console.log(`fast-effect-timing.txt: ${fastEffect.length} chars`);
  console.log(`other-info.txt: ${otherInfo.length} chars`);

  const sections: RuleSection[] = [];
  let idx = 0;

  for (const def of LINE_SECTIONS) {
    // Lines are 1-indexed, array is 0-indexed
    const raw = rulesLines.slice(def.start - 1, def.end).join("\n");
    const content = cleanText(raw);

    if (content.length > 20) {
      sections.push({
        id: `section-${++idx}`,
        title: def.title,
        keywords: def.keywords,
        content,
      });
    } else {
      console.warn(`  WARNING: Section too short "${def.title}" (${content.length} chars)`);
    }
  }

  // Fast Effect Timing
  sections.push({
    id: "fast-effect-timing",
    title: "Fast Effect Timing",
    keywords: [
      "fast effect", "timing", "chain", "spell speed", "quick effect",
      "open game state", "turn player", "priority", "pass", "response",
    ],
    content: cleanText(fastEffect),
  });

  // Card Rulings & FAQ
  sections.push({
    id: "card-rulings-faq",
    title: "Card Rulings & FAQ",
    keywords: [
      "rivalry", "gozen", "type", "attribute", "continuous trap",
      "summon restriction", "control", "send to graveyard",
      "leaves the field", "extra deck", "return to deck", "shuffle",
      "trigger effect", "location", "trap monster", "summon negation",
      "master rule", "2021 update",
    ],
    content: cleanText(otherInfo),
  });

  const result = { sections };
  writeFileSync(OUTPUT, JSON.stringify(result, null, 2), "utf-8");

  let totalChars = 0;
  console.log(`\nDone! ${sections.length} sections written to rules.json`);
  for (const s of sections) {
    console.log(`  - ${s.title} (${s.content.length} chars)`);
    totalChars += s.content.length;
  }
  console.log(`\nTotal: ${totalChars} chars`);
}

main();
