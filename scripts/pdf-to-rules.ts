import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { PDFParse } from "pdf-parse";

const INPUT = join(process.cwd(), "rules", "Rulebook_v9_fr.pdf");
const OUTPUT = join(process.cwd(), "data", "rules.json");

// Known section titles from the YGO v9 FR rulebook
const KNOWN_SECTIONS = [
  "Généralités Sur Le Jeu",
  "Éléments nécessaires pour livrer un Duel",
  "Le Tapis de Jeu",
  "Cartes Monstre",
  "Monstres à Effet",
  "Monstres Pendule",
  "Monstres Xyz",
  "Monstres Synchro",
  "Monstres de Fusion",
  "Monstres Rituel",
  "Invocation de Cartes Monstre",
  "Cartes Magie et Piège",
  "Que le Duel commence",
  "Préparation au Duel",
  "Structure du tour",
  "Draw Phase",
  "Standby Phase",
  "Main Phase",
  "Battle Phase",
  "End Phase",
  "Règles de combat des monstres",
  "Règles de la Damage Step",
  "Déterminer Les Dommages",
  "Chaînes et Spell Speed",
  "Spell Speed",
  "Exemple d'une Chaîne",
  "Priorité du Joueur du Tour",
  "Règles complémentaires",
  "Glossaire",
];

async function main() {
  console.log("Reading PDF...");
  const buffer = readFileSync(INPUT);
  const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const parser = new PDFParse(uint8);
  await parser.load();
  const textData = await parser.getText();

  const text = (textData as any).pages
    .map((p: { text: string }) => p.text)
    .join("\n\n");

  console.log(`Extracted ${text.length} characters`);

  // Normalize text for matching
  const normalizedText = text;

  interface Section {
    id: string;
    title: string;
    content: string;
    subsections: { id: string; title: string; content: string }[];
  }

  // Find positions of known sections in the text
  const found: { title: string; index: number }[] = [];

  for (const title of KNOWN_SECTIONS) {
    // Search for the title in various forms (original, uppercase, mixed case)
    const variations = [
      title,
      title.toUpperCase(),
      title.toLowerCase(),
      // Handle tab/space variations
      title.replace(/\s+/g, "\\s+"),
    ];

    let bestIndex = -1;
    for (const variant of variations) {
      try {
        const regex = new RegExp(variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\s\+/g, "\\s+"), "i");
        const match = normalizedText.match(regex);
        if (match && match.index !== undefined) {
          // Take the first occurrence after table of contents
          if (bestIndex === -1 || match.index > 200) {
            bestIndex = match.index;
            break;
          }
        }
      } catch {
        // regex error, skip
      }
    }

    if (bestIndex > 200) {
      // Skip TOC matches (they appear early)
      found.push({ title, index: bestIndex });
    }
  }

  // Sort by position in text
  found.sort((a, b) => a.index - b.index);

  // Remove duplicates (same position or very close)
  const deduped: { title: string; index: number }[] = [];
  for (const item of found) {
    if (deduped.length === 0 || item.index - deduped[deduped.length - 1].index > 50) {
      deduped.push(item);
    }
  }

  // Extract content between sections
  const sections: Section[] = [];
  for (let i = 0; i < deduped.length; i++) {
    const start = deduped[i].index;
    const end = i + 1 < deduped.length ? deduped[i + 1].index : text.length;
    const content = text
      .slice(start, end)
      .replace(/^[^\n]*\n/, "") // Remove the title line itself
      .trim();

    // Clean up content: remove page numbers, excessive whitespace
    const cleaned = content
      .split("\n")
      .filter((line) => {
        const t = line.trim();
        // Remove standalone numbers (page numbers)
        if (t.match(/^[ivx\d]{1,4}$/i)) return false;
        // Remove empty lines
        if (!t) return false;
        return true;
      })
      .join("\n")
      .trim();

    if (cleaned.length > 10) {
      sections.push({
        id: `section-${i + 1}`,
        title: deduped[i].title,
        content: cleaned,
        subsections: [],
      });
    }
  }

  // Also capture any content before the first section as "Introduction"
  if (deduped.length > 0 && deduped[0].index > 500) {
    const intro = text
      .slice(0, deduped[0].index)
      .split("\n")
      .filter((l) => l.trim() && !l.trim().match(/^[ivx\d]{1,4}$/i))
      .join("\n")
      .trim();
    if (intro.length > 50) {
      sections.unshift({
        id: "section-0",
        title: "Introduction",
        content: intro,
        subsections: [],
      });
    }
  }

  const result = { sections };
  writeFileSync(OUTPUT, JSON.stringify(result, null, 2), "utf-8");
  console.log(`\nDone! ${sections.length} sections written to rules.json`);
  for (const s of sections) {
    console.log(`  - ${s.title} (${s.content.length} chars)`);
  }
  console.log("\n⚠️  Vérifiez rules.json et ajustez manuellement si nécessaire.");
}

main().catch(console.error);
