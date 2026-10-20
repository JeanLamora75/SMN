import "server-only";

import { Client } from "pg";
import type { Snapshot } from "@/server/installation/diagnostic";

// Toutes les requêtes ci-dessous sont de simples SELECT, sur la base dédiée passée à pg.
export async function probePostgres(uri: string): Promise<Snapshot> {
  const client = new Client({
    connectionString: uri,
    connectionTimeoutMillis: 2500,
    query_timeout: 2500,
    statement_timeout: 2500,
    application_name: "smn-diagnostic",
  });
  try {
    await client.connect();
    const rights = await client.query<{ allowed: boolean }>(
      "SELECT has_schema_privilege(current_user, 'public', 'USAGE') AS allowed",
    );
    if (rights.rows[0]?.allowed !== true) {
      return { schemaUsage: false, tables: [] };
    }
    const tables = await client.query<{ name: string }>(
      "SELECT c.relname AS name FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')",
    );
    const names = tables.rows.map((table) => table.name);
    if (!names.includes("smn_installation") || names.some((n) => n !== "smn_installation" && n !== "_prisma_migrations")) {
      return { schemaUsage: true, tables: names };
    }
    const read = await client.query<{ allowed: boolean }>(
      "SELECT has_table_privilege(current_user, 'public.smn_installation', 'SELECT') AS allowed",
    );
    if (read.rows[0]?.allowed !== true) {
      return { schemaUsage: true, tables: names, tableRead: false };
    }
    const installation = await client.query<{
      id: string;
      state: string;
      schema_version: number;
    }>("SELECT id, state, schema_version FROM public.smn_installation LIMIT 2");
    return {
      schemaUsage: true,
      tables: names,
      tableRead: true,
      installations: installation.rows,
    };
  } finally {
    // Évite qu'un échec de clôture masque un résultat de diagnostic.
    await client.end().catch(() => undefined);
  }
}
