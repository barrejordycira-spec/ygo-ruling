import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface SlimCard {
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

const FR_INPUT = join(process.cwd(), "data", "card.json");
const EN_INPUT = join(process.cwd(), "data", "card-en.json");
const OUTPUT = join(process.cwd(), "data", "cards-slim.json");

console.log("Reading French card.json...");
const frRaw = JSON.parse(readFileSync(FR_INPUT, "utf-8"));
const frCards: any[] = frRaw.data ?? frRaw;

console.log("Reading English card-en.json...");
let enMap: Map<number, string>;
try {
  const enRaw = JSON.parse(readFileSync(EN_INPUT, "utf-8"));
  const enCards: any[] = enRaw.data ?? enRaw;
  enMap = new Map(enCards.map((c) => [c.id, c.name]));
  console.log(`English data: ${enMap.size} cards`);
} catch {
  console.log("No English data found, skipping name_en");
  enMap = new Map();
}

const slim: SlimCard[] = frCards.map((c: any) => {
  const entry: SlimCard = {
    id: c.id,
    name: c.name,
    type: c.humanReadableCardType ?? c.type,
    desc: c.desc,
  };
  const enName = enMap.get(c.id);
  if (enName && enName !== c.name) entry.name_en = enName;
  if (c.race) entry.race = c.race;
  if (c.atk !== undefined) entry.atk = c.atk;
  if (c.def !== undefined) entry.def = c.def;
  if (c.level !== undefined) entry.level = c.level;
  if (c.attribute) entry.attribute = c.attribute;
  if (c.archetype) entry.archetype = c.archetype;
  if (c.banlist_info) entry.banlist_info = c.banlist_info;
  return entry;
});

writeFileSync(OUTPUT, JSON.stringify(slim));
console.log(`Done! ${slim.length} cards written to cards-slim.json`);
