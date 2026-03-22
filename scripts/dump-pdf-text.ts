import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { PDFParse } from "pdf-parse";

const INPUT = join(process.cwd(), "rules", "Rulebook_v9_fr.pdf");
const OUTPUT = join(process.cwd(), "rules", "rules_raw.txt");

async function main() {
  const buffer = readFileSync(INPUT);
  const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const parser = new PDFParse(uint8);
  await parser.load();
  const textData = await parser.getText();

  const pages = (textData as any).pages as { text: string }[];
  let output = "";
  for (let i = 0; i < pages.length; i++) {
    output += `\n===== PAGE ${i + 1} =====\n`;
    output += pages[i].text;
  }
  writeFileSync(OUTPUT, output, "utf-8");
  console.log(`${pages.length} pages, ${output.length} chars -> rules/rules_raw.txt`);
}

main().catch(console.error);
