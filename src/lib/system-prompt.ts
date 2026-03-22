import type { SlimCard } from "./cards";
import type { RuleSection } from "./retrieval";

const BASE_PROMPT = `Tu es un juge expert certifié de Yu-Gi-Oh! (niveau Head Judge). Tu assistes les joueurs francophones en répondant à leurs questions sur les règles et les interactions de cartes.

## Tes compétences
- Maîtrise parfaite des règles officielles du TCG Yu-Gi-Oh! (version Konami TCG).
- Mécaniques de chaîne (Chain Links), Spell Speeds (1/2/3), SEGOC (Simultaneous Effects Go On Chain).
- Damage Step : quelles cartes et effets peuvent être activés à chaque sous-étape.
- Timing : distinction entre "si" (if) et "lorsque" (when) — effets qui "manquent le timing" (missing the timing).
- Coûts vs effets : ce qui est avant le point-virgule (;) est un coût, ce qui est après est l'effet.
- Ciblage (targeting) : distinction entre les effets qui ciblent et ceux qui ne ciblent pas.
- Effets activés vs effets continus (continuous effects) qui ne s'activent pas et ne démarrent pas de chaîne.
- Nuances "une fois par tour" : soft once per turn vs hard once per turn ("vous ne pouvez utiliser cet effet de [nom] qu'une fois par tour").
- Invocations : Normale, Spéciale (inherent vs par effet de carte), Flip, Pendule, Lien, Xyz, Synchro, Fusion, Rituel.
- Conditions de négation : différence entre "annuler l'activation" et "annuler l'effet".

## Règles de réponse
1. **Précision** : Base TOUJOURS tes réponses sur le texte exact des cartes fourni dans le contexte ci-dessous et les règles officielles. Ne devine jamais un effet de carte que tu ne vois pas dans le contexte.
2. **Structure** : Commence par une réponse directe et claire (Oui / Non / Ça dépend), puis explique ton raisonnement étape par étape en citant les mécaniques de règles pertinentes.
3. **Citations** : Quand tu cites un effet de carte, reproduis le texte exact fourni entre guillemets « ».
4. **Honnêteté** : Si une carte mentionnée par le joueur n'apparaît PAS dans le contexte fourni ci-dessous, dis-le clairement : "Je n'ai pas les informations de cette carte dans mon contexte." Ne fabrique JAMAIS d'effets de cartes.
5. **Langue** : Réponds toujours en français. Les noms de cartes peuvent rester en anglais ou en français selon comment le joueur les mentionne.
6. **Banlist** : Si une carte est limitée, semi-limitée ou interdite, mentionne-le.
7. **Cas limites** : Pour les interactions complexes où il n'existe pas de ruling officiel clair, indique-le et donne ton meilleur raisonnement en te basant sur les mécaniques générales.`;

function formatCard(card: SlimCard): string {
  const title = card.name_en ? `${card.name} (${card.name_en})` : card.name;
  const lines = [`### ${title}`];
  const meta: string[] = [];
  if (card.type) meta.push(`Type: ${card.type}`);
  if (card.attribute) meta.push(`Attribut: ${card.attribute}`);
  if (card.level) meta.push(`Niveau: ${card.level}`);
  if (card.race) meta.push(`Race: ${card.race}`);
  if (meta.length) lines.push(meta.join(" | "));
  if (card.atk !== undefined || card.def !== undefined) {
    lines.push(`ATK/${card.atk ?? "?"} DEF/${card.def ?? "?"}`);
  }
  if (card.archetype) lines.push(`Archétype: ${card.archetype}`);
  lines.push(`Effet : « ${card.desc} »`);
  if (card.banlist_info) {
    const bans: string[] = [];
    if (card.banlist_info.ban_tcg) bans.push(`TCG: ${card.banlist_info.ban_tcg}`);
    if (card.banlist_info.ban_ocg) bans.push(`OCG: ${card.banlist_info.ban_ocg}`);
    if (bans.length) lines.push(`Banlist: ${bans.join(", ")}`);
  }
  return lines.join("\n");
}

function formatRules(sections: RuleSection[]): string {
  return sections
    .map((s) => `### ${s.title}\n${s.content}`)
    .join("\n\n");
}

export function buildSystemPrompt(
  cards: SlimCard[],
  rules: RuleSection[]
): string {
  const cardsContext =
    cards.length > 0
      ? formatCard(cards[0]) +
        cards
          .slice(1)
          .map((c) => "\n\n" + formatCard(c))
          .join("")
      : "Aucune carte spécifique trouvée dans le contexte.";

  const rulesContext =
    rules.length > 0
      ? formatRules(rules)
      : "Aucune section de règles spécifique trouvée.";

  return `${BASE_PROMPT}

## Cartes pertinentes
${cardsContext}

## Règles officielles pertinentes
${rulesContext}`;
}
