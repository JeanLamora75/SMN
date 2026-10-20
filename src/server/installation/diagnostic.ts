// Domaine du diagnostic : aucune dépendance à Next, React, Prisma ou au pilote PG.
export type DiagnosticStatus =
  | "configuration-missing"
  | "configuration-invalid"
  | "database-missing"
  | "connection-error"
  | "permissions-insufficient"
  | "virgin"
  | "initialized"
  | "schema-incompatible"
  | "installation-incomplete";

export type Diagnostic = Readonly<{
  status: DiagnosticStatus;
  canEnterSetup: boolean;
}>;

export type Snapshot = Readonly<{
  schemaUsage: boolean;
  tables: readonly string[];
  tableRead?: boolean;
  installations?: readonly { id: string; state: string; schema_version: number }[];
}>;

export type DiagnosticProbe = () => Promise<Snapshot>;

function result(status: DiagnosticStatus): Diagnostic {
  return { status, canEnterSetup: status === "virgin" };
}

// Ne jamais exposer l'exception PG : elle peut contenir des fragments de connexion.
export function classifyDatabaseError(error: unknown): DiagnosticStatus {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;
  if (code === "3D000") return "database-missing";
  if (code === "42501") return "permissions-insufficient";
  return "connection-error";
}

export function classifySnapshot(snapshot: Snapshot): Diagnostic {
  if (!snapshot.schemaUsage) return result("permissions-insufficient");
  const names = new Set(snapshot.tables);
  const permitted = new Set(["smn_installation", "_prisma_migrations"]);
  if ([...names].some((table) => !permitted.has(table))) {
    return result("schema-incompatible");
  }
  if (!names.has("smn_installation")) {
    return result(names.size === 0 ? "virgin" : "installation-incomplete");
  }
  if (snapshot.tableRead !== true) return result("permissions-insufficient");
  const records = snapshot.installations;
  if (!records || records.length !== 1 || records[0].id !== "singleton") {
    return result("installation-incomplete");
  }
  if (records[0].schema_version !== 1) return result("schema-incompatible");
  if (records[0].state !== "initialized") return result("installation-incomplete");
  return result("initialized");
}

export async function diagnoseInstallation(probe: DiagnosticProbe): Promise<Diagnostic> {
  try {
    return classifySnapshot(await probe());
  } catch (error) {
    return result(classifyDatabaseError(error));
  }
}
