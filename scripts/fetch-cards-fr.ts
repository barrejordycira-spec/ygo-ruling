import { writeFileSync } from "fs";
import { join } from "path";

const URL = "https://db.ygoprodeck.com/api/v7/cardinfo.php?language=fr";
const OUTPUT = join(process.cwd(), "data", "card.json");

async function main() {
  console.log("Fetching French card data from YGOProDeck...");
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const data = await res.json();
  const cards = data.data ?? data;
  console.log(`Got ${cards.length} cards`);

  writeFileSync(OUTPUT, JSON.stringify(data), "utf-8");
  console.log("Written to data/card.json");
}

main().catch(console.error);
