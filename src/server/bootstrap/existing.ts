import { Client } from "pg";
import { existingUri, saveExistingConfig } from "./settings";

export type ExistingDbInput = { postgresUser: string; postgresPassword: string; postgresPort?: number };
export function validateExistingDbInput(v: unknown): ExistingDbInput | null {
  if (!v || typeof v !== "object") return null;
  const input = v as Record<string, unknown>;
  const postgresUser = typeof input.postgresUser === "string" ? input.postgresUser.trim() : "";
  const postgresPassword = input.postgresPassword;
  const postgresPort = input.postgresPort === undefined ? 5432 : input.postgresPort;
  try {
    if (typeof postgresPassword !== "string") return null;
    existingUri(postgresUser, postgresPassword, postgresPort as number);
    return { postgresUser, postgresPassword, postgresPort: postgresPort as number };
  } catch { return null; }
}
export async function prepareExisting(input: ExistingDbInput): Promise<string> {
  const uri = existingUri(input.postgresUser, input.postgresPassword, input.postgresPort);
  const admin = new URL(uri); admin.pathname = "/postgres";
  const client = new Client({ connectionString: admin.toString(), connectionTimeoutMillis: 4000,
    query_timeout: 4000, application_name: "smn-express-setup" });
  try {
    await client.connect();
    const result = await client.query<{ version: string }>("SELECT current_setting('server_version_num') AS version");
    if (Math.floor(Number(result.rows[0]?.version) / 10000) !== 18) throw new Error("unsupported-postgres");
  } catch (error) {
    if (error instanceof Error && error.message === "unsupported-postgres") throw error;
    const e = error as { code?: string };
    if (e.code === "28P01" || e.code === "28000") throw new Error("postgres-auth-invalid");
    if (e.code === "42501") throw new Error("postgres-permission-denied");
    if (e.code === "ECONNREFUSED" || e.code === "ETIMEDOUT") throw new Error("postgres-unreachable");
    throw new Error("postgres-connection-failed");
  } finally {
    await client.end().catch(() => undefined);
  }
  return uri;
}
export async function rememberExisting(input: ExistingDbInput): Promise<void> {
  await saveExistingConfig(input.postgresUser, input.postgresPassword, input.postgresPort ?? 5432);
}
