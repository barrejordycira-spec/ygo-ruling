import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { PDFParse } from "pdf-parse";

const INPUT = join(process.cwd(), "rules", "Rulebook_v9_fr.pdf");
const OUTPUT = join(process.cwd(), "data", "rules.json");

// Map page ranges to logical sections
const PAGE_SECTIONS: { title: string; pages: number[]; keywords: string[] }[] = [
  {
    title: "Généralités Sur Le Jeu",
    pages: [4, 5],
    keywords: ["généralités", "jeu", "duel", "deck", "cartes"],
  },
  {
    title: "Éléments nécessaires et Tapis de Jeu",
    pages: [6, 7, 8, 9],
    keywords: ["deck", "extra deck", "side deck", "tapis", "zone", "monstre", "magie", "piège", "cimetière", "terrain", "pendule"],
  },
  {
    title: "Cartes Monstre",
    pages: [10, 11, 12, 13],
    keywords: ["monstre", "atk", "def", "niveau", "attribut", "type", "normal", "effet"],
  },
  {
    title: "Monstres à Effet",
    pages: [13, 14, 15],
    keywords: ["effet", "continu", "déclencheur", "flip", "ignition", "rapide", "monstre à effet"],
  },
  {
    title: "Monstres Pendule",
    pages: [16, 17],
    keywords: ["pendule", "échelle", "zone pendule", "invocation pendule"],
  },
  {
    title: "Monstres Xyz",
    pages: [18, 19],
    keywords: ["xyz", "rang", "matériel", "superposition", "détacher"],
  },
  {
    title: "Monstres Synchro",
    pages: [20, 21],
    keywords: ["synchro", "synthoniseur", "niveau", "invocation synchro"],
  },
  {
    title: "Monstres de Fusion",
    pages: [22, 23],
    keywords: ["fusion", "polymérisation", "matériel de fusion", "invocation fusion"],
  },
  {
    title: "Monstres Rituel",
    pages: [23, 24],
    keywords: ["rituel", "carte magie rituel", "invocation rituel"],
  },
  {
    title: "Monstres Lien",
    pages: [24, 25],
    keywords: ["lien", "link", "flèche", "marqueur de lien", "zone extra monstre"],
  },
  {
    title: "Invocation de Cartes Monstre",
    pages: [25, 26, 27],
    keywords: ["invocation", "normale", "spéciale", "poser", "flip", "tribute", "sacrifice"],
  },
  {
    title: "Cartes Magie",
    pages: [28, 29, 30],
    keywords: ["magie", "normale", "continue", "équipement", "terrain", "jeu rapide", "rituel"],
  },
  {
    title: "Cartes Piège",
    pages: [30, 31, 32, 33],
    keywords: ["piège", "normal", "continu", "contre-piège", "poser", "activer"],
  },
  {
    title: "Préparation au Duel et Structure du Tour",
    pages: [34, 35, 36],
    keywords: ["préparation", "duel", "draw phase", "standby phase", "main phase", "battle phase", "end phase", "tour"],
  },
  {
    title: "Draw Phase et Standby Phase",
    pages: [36, 37],
    keywords: ["draw", "pioche", "standby", "phase"],
  },
  {
    title: "Main Phase",
    pages: [37, 38],
    keywords: ["main phase", "invoquer", "poser", "magie", "piège", "changer position"],
  },
  {
    title: "Battle Phase",
    pages: [38, 39, 40, 41],
    keywords: ["battle", "combat", "attaque", "start step", "battle step", "damage step", "end step", "replay"],
  },
  {
    title: "End Phase",
    pages: [41],
    keywords: ["end phase", "fin", "tour", "limite main"],
  },
  {
    title: "Règles de combat des monstres",
    pages: [42, 43, 44],
    keywords: ["combat", "attaque", "défense", "dommages", "position", "atk", "def", "détruire"],
  },
  {
    title: "Règles de la Damage Step",
    pages: [44, 45],
    keywords: ["damage step", "dommages", "sous-étape", "début", "calcul", "après", "flip"],
  },
  {
    title: "Chaînes et Spell Speed",
    pages: [46, 47, 48],
    keywords: ["chaîne", "spell speed", "chain link", "résolution", "activation", "rapide", "contre-piège"],
  },
  {
    title: "Priorité du Joueur du Tour",
    pages: [48, 49],
    keywords: ["priorité", "joueur du tour", "fast effect", "effet rapide", "fenêtre", "réponse"],
  },
  {
    title: "Règles complémentaires",
    pages: [50, 51, 52],
    keywords: ["complémentaire", "bannie", "face verso", "interdit", "limité", "match", "side deck", "jeton"],
  },
  {
    title: "Glossaire",
    pages: [53, 54, 55, 56],
    keywords: ["glossaire", "cibler", "coût", "activer", "invoquer", "envoyer", "détruire", "annuler", "contrôler"],
  },
];

function cleanPageText(text: string): string {
  return text
    .split("\n")
    .filter((line: string) => {
      const t = line.trim();
      if (!t) return false;
      // Remove standalone page numbers
      if (/^[ivx\d]{1,4}$/i.test(t)) return false;
      // Remove card IDs like YS14-FR024
      if (/^[A-Z]{2,4}\d{2}-[A-Z]{2}\d{3}$/i.test(t)) return false;
      return true;
    })
    .join("\n")
    .trim();
}

async function main() {
  console.log("Reading PDF...");
  const buffer = readFileSync(INPUT);
  const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const parser = new PDFParse(uint8);
  await parser.load();
  const textData = await parser.getText();

  const pages = (textData as any).pages as { text: string }[];
  console.log(`Extracted ${pages.length} pages`);

  const sections = PAGE_SECTIONS.map((def, i) => {
    const content = def.pages
      .map((p: number) => (pages[p - 1] ? cleanPageText(pages[p - 1].text) : ""))
      .filter((l: string) => Boolean(l))
      .join("\n\n");

    return {
      id: `section-${i + 1}`,
      title: def.title,
      keywords: def.keywords,
      content,
    };
  });

  let totalChars = 0;
  const result = { sections };
  writeFileSync(OUTPUT, JSON.stringify(result, null, 2), "utf-8");

  console.log(`\nDone! ${sections.length} sections written to rules.json`);
  for (const s of sections) {
    console.log(`  - ${s.title} (${s.content.length} chars)`);
    totalChars += s.content.length;
  }
  console.log(`\nTotal: ${totalChars} chars`);
}

main().catch(console.error);
