// Domaine pur : classification prudente, indépendant de Next, Prisma et du pilote SQL.
export type DiagnosticStatus =
  | "configuration-missing"
  | "configuration-invalid"
  | "database-missing"
  | "connection-error"
  | "permissions-insufficient"
  | "server-version-unsupported"
  | "virgin"
  | "initialized"
  | "schema-incompatible"
  | "installation-incomplete";

export type Diagnostic = Readonly<{ status: DiagnosticStatus; canEnterSetup: boolean }>;
export type Migration = Readonly<{
  migration_name: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
}>;
export type Snapshot = Readonly<{
  schemaUsage: boolean;
  schemaCreate?: boolean;
  // Numéro de version PostgreSQL (server_version_num) : vérifié par le probe réel.
  serverVersion?: number;
  // Objets qualifiés par schéma et type : public.smn_installation:r
  tables: readonly string[];
  tableRead?: boolean;
  migrationsRead?: boolean;
  migrations?: readonly Migration[];
  installations?: readonly { id: string; state: string; schema_version: number }[];
}>;
export type DiagnosticProbe = () => Promise<Snapshot>;

function result(status: DiagnosticStatus): Diagnostic {
  return { status, canEnterSetup: status === "virgin" };
}

// La compatibilité de la version 1 décrit uniquement le marqueur I0.
// SMN-12 doit enregistrer explicitement ses objets et migrations ; aucun schéma
// ultérieur ne peut devenir compatible par simple incrément de schema_version.
const SUPPORTED_SCHEMAS: Readonly<Record<number, ReadonlySet<string>>> = {
  1: new Set(["public.smn_installation:r", "public._prisma_migrations:r"]),
};

export function classifyDatabaseError(error: unknown): DiagnosticStatus {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;
  if (code === "3D000") return "database-missing";
  if (code === "42501") return "permissions-insufficient";
  if (["42P01", "42703", "42883", "3F000", "42P07", "42809"].includes(String(code))) {
    return "schema-incompatible";
  }
  return "connection-error";
}

export function classifySnapshot(snapshot: Snapshot): Diagnostic {
  if (!snapshot.schemaUsage) return result("permissions-insufficient");
  // Qualification I0 réalisée sur PostgreSQL 18 : aucun faux « prêt »
  // pour une version serveur encore non qualifiée.
  if (!Number.isInteger(snapshot.serverVersion) || Math.floor(snapshot.serverVersion! / 10000) !== 18) {
    return result("server-version-unsupported");
  }
  const names = new Set(snapshot.tables);
  const marker = "public.smn_installation:r";
  const history = "public._prisma_migrations:r";
  if (!names.has(marker)) {
    if (names.size === 0) {
      return result(snapshot.schemaCreate === true ? "virgin" : "permissions-insufficient");
    }
    return result(names.size === 1 && names.has(history) ? "installation-incomplete" : "schema-incompatible");
  }
  if ([...names].some((name) => name !== marker && name !== history)) return result("schema-incompatible");
  if (!snapshot.tableRead) return result("permissions-insufficient");
  const records = snapshot.installations;
  if (!records || records.length !== 1 || records[0].id !== "singleton") {
    return result("installation-incomplete");
  }
  const policy = SUPPORTED_SCHEMAS[records[0].schema_version];
  if (!policy || [...names].some((name) => !policy.has(name))) return result("schema-incompatible");
  if (records[0].state !== "initialized") return result("installation-incomplete");
  if (!names.has(history) || !snapshot.migrationsRead || !snapshot.migrations?.length) {
    return result("installation-incomplete");
  }
  if (snapshot.migrations.some((m) => !m.finished_at || !!m.rolled_back_at)) {
    return result("installation-incomplete");
  }
  // Aucune migration SMN-11 officielle ne définit encore l'état initialisé.
  // Ne pas valider un historique arbitraire : SMN-12 enregistrera le manifeste
  // Prisma effectif et déverrouillera cet état après vérification du schéma.
  return result("installation-incomplete");
}

export async function diagnoseInstallation(probe: DiagnosticProbe): Promise<Diagnostic> {
  try {
    return classifySnapshot(await probe());
  } catch (error) {
    return result(classifyDatabaseError(error));
  }
}
