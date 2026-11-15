/**
 * Converts legacy model prose without guessing at data bindings.
 * A database migration must refuse cleanup while unresolvedFields is non-empty.
 */
export type LegacyBriefModel = {
  title: string;
  sections: readonly string[];
  questions: readonly string[];
  instructions: readonly string[];
  data: readonly string[];
  depth: number;
};

export type PromptConversion = {
  promptText: string;
  unresolvedFields: string[];
  historicalDepth: number;
};

const SAFE_SCALARS: Readonly<Record<string, readonly string[]>> = {
  "team.name": ["{{TEAM_NAME}}"],
  "product.name": ["{{PRODUCT_NAME}}"],
  "cycle.name": ["{{SPRINT_NAME}}"],
  "cycle.dates": ["{{SPRINT_START}}", "{{SPRINT_END}}"],
  "cycle.status": ["{{SPRINT_STATUS}}"],
  objectives: ["{{ROW:GOALS}}"],
  risks: ["{{ROW:RISKS}}"],
  dependencies: ["{{ROW:DEPENDENCIES}}"],
  decisions: ["{{ROW:DECISIONS}}"],
};

const normalize = (value: string) => value.replace(/\r\n?/g, "\n").trim();

export function prepareLegacyBriefPrompt(model: LegacyBriefModel): PromptConversion {
  const unknown = [...new Set(model.data.filter(key => !(key in SAFE_SCALARS)))];
  const sections = model.sections.map(normalize).filter(Boolean);
  const questions = model.questions.map(normalize).filter(Boolean);
  const instructions = model.instructions.map(normalize).filter(Boolean);
  const scalars = [...new Set(model.data.flatMap(key => SAFE_SCALARS[key] ?? []))];
  const lines: string[] = [
    ...sections.map(title => "# " + title),
    ...(scalars.length ? ["", "## Données de contexte", ...scalars] : []),
    ...(questions.length ? ["", "## Questions à l'IA", ...questions.map(q => "- " + q)] : []),
    ...(instructions.length ? ["", "## Consignes", ...instructions.map(i => "- " + i)] : []),
    ...(model.depth > 1 ? ["", "## Historique souhaité", `Analyser jusqu’à ${model.depth} cycles clôturés lorsque ces données sont explicitement disponibles.`] : []),
  ];
  // Do not convert old business field keys to unverified Office tags.
  // Every remaining key requires an explicit mapping before database cutover.
  return {
    promptText: lines.join("\n").trim() + "\n",
    unresolvedFields: unknown,
    historicalDepth: model.depth,
  };
}
