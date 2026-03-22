import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface RawCard {
  id: number;
  name: string;
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

const INPUT = join(process.cwd(), "data", "card.json");
const OUTPUT = join(process.cwd(), "data", "cards-slim.json");

console.log("Reading card.json...");
const raw = JSON.parse(readFileSync(INPUT, "utf-8"));
const cards: unknown[] = raw.data ?? raw;

const slim: RawCard[] = cards.map((c: any) => {
  const entry: RawCard = {
    id: c.id,
    name: c.name,
    type: c.humanReadableCardType ?? c.type,
    desc: c.desc,
  };
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
