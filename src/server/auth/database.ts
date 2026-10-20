import { Client } from "pg";
import { parseConnectionSettings } from "../db/config";
import { existingManagedUri, canOfferPortable } from "../bootstrap/portable";
import { loadExistingUri } from "../bootstrap/settings";

export async function installedDatabaseUri(): Promise<string> {
  const settings = parseConnectionSettings(process.env.SMN_DATABASE_URL);
  if (settings.ok) return settings.uri;
  if (settings.status !== "configuration-missing" || !canOfferPortable()) throw new Error("smn-db-unavailable");
  const configured = await loadExistingUri();
  const uri = configured ?? await existingManagedUri();
  if (!uri || !parseConnectionSettings(uri).ok) throw new Error("smn-db-unavailable");
  return uri;
}
export async function withAuthDb<T>(action: (client: Client) => Promise<T>): Promise<T> {
  const uri = await installedDatabaseUri();
  const client = new Client({
    connectionString: uri,
    connectionTimeoutMillis: 3500,
    statement_timeout: 5000,
    query_timeout: 5000,
    application_name: "smn-auth",
  });
  try {
    await client.connect();
    return await action(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}
