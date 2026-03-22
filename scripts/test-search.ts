import { searchCards } from "../src/lib/cards.js";

const tests = [
  "mirroirjade",
  "miroirjade",
  "mirrorjade",
  "ash blossom",
  "cendres et fleur",
  "blue eyes",
  "blue-eyes",
  "ultime dragon blanc aux yeux bleus",
];

for (const q of tests) {
  const results = searchCards(q, 3);
  console.log(
    `"${q}" -> ${results.length ? results.map((c) => c.name).join(", ") : "AUCUN"}`
  );
}
