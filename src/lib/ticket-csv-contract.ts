export const TICKET_CSV_SCHEMA_VERSION = 1;
export const TICKET_CSV_COLUMNS = [
  "Id jira", "Type de ticket", "Titre du ticket", "Priorité", "Statut", "Story points",
] as const;

export type TicketCsvColumn = typeof TICKET_CSV_COLUMNS[number];
export type TicketCsvDiagnostic = {
  line: number;
  column: string;
  code: string;
  message: string;
  severity: "error" | "warning";
};
export type TicketCsvRow = {
  line: number;
  jiraId: string;
  issueType: string;
  title: string;
  priority: string;
  status: string;
  storyPoints: string;
  extra: Record<string, string>;
};
export type TicketCsvValidation = {
  valid: boolean;
  version: number;
  delimiter: "," | ";" | "\t";
  columns: string[];
  rows: TicketCsvRow[];
  errors: TicketCsvDiagnostic[];
  warnings: TicketCsvDiagnostic[];
};

// These are technical safety bounds, not restrictions on Jira field values.
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_ROWS = 20000;

const normalize = (value: string): string =>
  value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");

const columnAliases: Readonly<Record<TicketCsvColumn, readonly string[]>> = {
  "Id jira": ["Id jira"],
  "Type de ticket": ["Type de ticket"],
  "Titre du ticket": ["Titre du ticket"],
  "Priorité": ["Priorité"],
  "Statut": ["Statut"],
  "Story points": ["Story points"],
};

export function isCompletedTicketStatus(status: string): boolean {
  const normalized = normalize(status);
  return normalized === "done" || normalized === "termine";
}

type RecordRow = { line: number; values: string[] };
type ParsingResult = { records: RecordRow[]; errors: TicketCsvDiagnostic[] };

function parseCsv(text: string, delimiter: "," | ";" | "\t"): ParsingResult {
  const records: RecordRow[] = [];
  const errors: TicketCsvDiagnostic[] = [];
  let values: string[] = [];
  let field = "";
  let inQuotes = false;
  let afterQuotes = false;
  let atStart = true;
  let line = 1;
  let rowLine = 1;

  function finishRow(): void {
    values.push(field);
    if (!(values.length === 1 && values[0].trim() === "")) {
      records.push({ line: rowLine, values });
    }
    values = [];
    field = "";
    atStart = true;
    afterQuotes = false;
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
          afterQuotes = true;
        }
      } else if (char === "\r") {
        if (text[i + 1] === "\n") i++;
        field += "\n";
        line++;
      } else {
        field += char;
        if (char === "\n") line++;
      }
      continue;
    }
    if (char === "\r" || char === "\n") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      finishRow();
      line++;
      rowLine = line;
      continue;
    }
    if (char === delimiter) {
      values.push(field);
      field = "";
      atStart = true;
      afterQuotes = false;
      continue;
    }
    if (char === '"' && atStart) {
      inQuotes = true;
      atStart = false;
      continue;
    }
    if (afterQuotes || char === '"') {
      errors.push({
        line, column: "CSV", code: "csv-syntax",
        message: "Guillemets CSV incorrects.", severity: "error",
      });
      afterQuotes = false;
    }
    field += char;
    atStart = false;
  }
  if (inQuotes) {
    errors.push({
      line: rowLine, column: "CSV", code: "unclosed-quote",
      message: "Champ CSV entre guillemets non terminé.", severity: "error",
    });
  }
  if (values.length > 0 || field !== "" || afterQuotes || inQuotes) finishRow();
  return { records, errors };
}

function selectDelimiter(header: string): "," | ";" | "\t" {
  const candidates = [",", ";", "\t"] as const;
  let best: typeof candidates[number] = ",";
  let bestCount = -1;
  for (const candidate of candidates) {
    const first = parseCsv(header, candidate).records[0]?.values ?? [];
    if (first.length > bestCount) {
      bestCount = first.length;
      best = candidate;
    }
  }
  return best;
}

function emptyResult(errors: TicketCsvDiagnostic[]): TicketCsvValidation {
  return {
    valid: false, version: TICKET_CSV_SCHEMA_VERSION, delimiter: ",",
    columns: [], rows: [], errors, warnings: [],
  };
}

export function validateTicketCsv(raw: string): TicketCsvValidation {
  if (typeof raw !== "string") {
    return emptyResult([{ line: 0, column: "Fichier", code: "invalid-input",
      message: "Le contenu CSV doit être un texte.", severity: "error" }]);
  }
  if (new TextEncoder().encode(raw).byteLength > MAX_BYTES) {
    return emptyResult([{ line: 0, column: "Fichier", code: "size-limit",
      message: "Le fichier CSV dépasse la taille maximale de sécurité (8 Mio).", severity: "error" }]);
  }

  const text = raw.replace(/^\uFEFF/, "");
  const delimiter = selectDelimiter(text);
  const parsed = parseCsv(text, delimiter);
  const errors = [...parsed.errors];
  const warnings: TicketCsvDiagnostic[] = [];
  const header = parsed.records[0];
  const columns = header?.values.map(value => value.trim()) ?? [];
  const rows: TicketCsvRow[] = [];
  const positions = new Map<TicketCsvColumn, number>();

  if (!header) {
    errors.push({ line: 1, column: "En-tête", code: "missing-header",
      message: "Le fichier est vide ou ne contient aucun en-tête.", severity: "error" });
  } else {
    for (const column of TICKET_CSV_COLUMNS) {
      const aliases = columnAliases[column].map(normalize);
      const matches = columns.flatMap((value, index) =>
        aliases.includes(normalize(value)) ? [index] : []);
      if (matches.length === 0) {
        errors.push({ line: header.line, column, code: "missing-column",
          message: `Colonne manquante : ${column}.`, severity: "error" });
      } else if (matches.length > 1) {
        errors.push({ line: header.line, column, code: "duplicate-column",
          message: `Colonne présente plusieurs fois : ${column}.`, severity: "error" });
      } else {
        positions.set(column, matches[0]);
      }
    }
    const seenHeaders = new Set<string>();
    for (const name of columns) {
      const normalizedName = normalize(name);
      if (!normalizedName || seenHeaders.has(normalizedName)) {
        errors.push({ line: header.line, column: name || "En-tête", code: "duplicate-or-blank-header",
          message: "En-tête vide ou présent plusieurs fois.", severity: "error" });
      }
      seenHeaders.add(normalizedName);
    }
  }

  const data = parsed.records.slice(1);
  if (data.length > MAX_ROWS) {
    errors.push({ line: 0, column: "Fichier", code: "row-limit",
      message: "Le fichier dépasse la limite de sécurité de 20 000 tickets.", severity: "error" });
  }
  if (data.length === 0) {
    errors.push({ line: header?.line ?? 1, column: "Fichier", code: "empty",
      message: "Le fichier ne contient aucun ticket.", severity: "error" });
  }

  const usedIds = new Set<string>();
  for (const row of data.slice(0, MAX_ROWS)) {
    if (row.values.length !== columns.length) {
      errors.push({ line: row.line, column: "CSV", code: "column-count",
        message: `La ligne contient ${row.values.length} valeurs, contre ${columns.length} en en-tête.`,
        severity: "error" });
      continue;
    }
    if (positions.size !== TICKET_CSV_COLUMNS.length) continue;
    const get = (key: TicketCsvColumn) => row.values[positions.get(key)!];
    const jiraId = get("Id jira").trim();
    if (!jiraId) {
      errors.push({ line: row.line, column: "Id jira", code: "missing-jira-id",
        message: "Identifiant Jira manquant.", severity: "error" });
      continue;
    }
    if (usedIds.has(jiraId.toUpperCase())) {
      errors.push({ line: row.line, column: "Id jira", code: "duplicate-jira-id",
        message: `Identifiant Jira répété : ${jiraId}.`, severity: "error" });
      continue;
    }
    usedIds.add(jiraId.toUpperCase());
    const storyPoints = get("Story points");
    if (storyPoints.trim() && !/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(storyPoints.trim())) {
      warnings.push({ line: row.line, column: "Story points", code: "unreadable-story-points",
        message: "Story points non numériques : valeur conservée, calcul numérique indisponible.",
        severity: "warning" });
    }
    const extra: Record<string, string> = Object.create(null) as Record<string, string>;
    for (let index = 0; index < columns.length; index++) {
      if (![...positions.values()].includes(index)) extra[columns[index]] = row.values[index];
    }
    rows.push({
      line: row.line, jiraId,
      issueType: get("Type de ticket"),
      title: get("Titre du ticket"),
      priority: get("Priorité"),
      status: get("Statut"),
      storyPoints,
      extra,
    });
  }

  return {
    valid: errors.length === 0,
    version: TICKET_CSV_SCHEMA_VERSION,
    delimiter, columns,
    rows: errors.length === 0 ? rows : [],
    errors, warnings,
  };
}
