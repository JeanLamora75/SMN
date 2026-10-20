// Adaptateur PostgreSQL directement testable (sans side effect server-only de Next).
import { Client } from "pg";
import type { Snapshot } from "../installation/diagnostic";

// Chaque diagnostic lit un instantané cohérent, sans aucune écriture.
export async function probePostgres(uri: string): Promise<Snapshot> {
  const client = new Client({
    connectionString: uri,
    connectionTimeoutMillis: 2500,
    query_timeout: 2500,
    statement_timeout: 2500,
    application_name: "smn-diagnostic",
  });
  let transaction = false;
  try {
    await client.connect();
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    transaction = true;
    const version = await client.query<{ version: string }>(
      "SELECT current_setting('server_version_num') AS version",
    );
    const rights = await client.query<{ can_use: boolean; can_create: boolean }>(
      "SELECT has_schema_privilege(current_user, 'public', 'USAGE') AS can_use, has_schema_privilege(current_user, 'public', 'CREATE') AS can_create",
    );
    const schemaUsage = rights.rows[0]?.can_use === true;
    const schemaCreate = rights.rows[0]?.can_create === true;
    const serverVersion = Number(version.rows[0]?.version);
    if (!schemaUsage) {
      return { schemaUsage: false, schemaCreate, serverVersion, tables: [] };
    }
    // Inclure aussi les vues, séquences, tables étrangères, schémas privés,
    // fonctions et types utilisateur ; pas seulement les tables de public.
    const objects = await client.query<{ name: string }>(`
      SELECT n.nspname || '.' || c.relname || ':' || c.relkind::text AS name
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND n.nspname NOT LIKE 'pg_toast%'
        AND n.nspname NOT LIKE 'pg_temp%'
        AND c.relkind IN ('r','p','v','m','S','f','c')
      UNION ALL
      SELECT n.nspname || '.<schema>' AS name
      FROM pg_catalog.pg_namespace n
      WHERE n.nspname NOT IN ('public', 'pg_catalog', 'information_schema')
        AND n.nspname NOT LIKE 'pg_%'
      UNION ALL
      SELECT n.nspname || '.' || p.proname || ':function' AS name
      FROM pg_catalog.pg_proc p
      JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
      UNION ALL
      SELECT n.nspname || '.' || t.typname || ':type' AS name
      FROM pg_catalog.pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typtype IN ('d','e','r','m')
    `);
    const tables = objects.rows.map((row) => row.name);
    const marker = "public.smn_installation:r";
    const history = "public._prisma_migrations:r";
    if (!tables.includes(marker) || tables.some((name) => name !== marker && name !== history)) {
      return { schemaUsage, schemaCreate, serverVersion, tables };
    }
    const perms = await client.query<{ installation: boolean; migrations: boolean }>(
      "SELECT has_table_privilege(current_user, 'public.smn_installation', 'SELECT') AS installation, CASE WHEN to_regclass('public._prisma_migrations') IS NOT NULL THEN has_table_privilege(current_user, 'public._prisma_migrations', 'SELECT') ELSE false END AS migrations",
    );
    const tableRead = perms.rows[0]?.installation === true;
    const migrationsRead = perms.rows[0]?.migrations === true;
    if (!tableRead || (tables.includes(history) && !migrationsRead)) {
      return { schemaUsage, schemaCreate, serverVersion, tables, tableRead, migrationsRead };
    }
    const installations = await client.query<{
      id: string; state: string; schema_version: number;
    }>("SELECT id, state, schema_version FROM public.smn_installation LIMIT 2");
    const migrations = tables.includes(history)
      ? (await client.query<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>(
          "SELECT migration_name, finished_at, rolled_back_at FROM public._prisma_migrations",
        )).rows
      : [];
    return { schemaUsage, schemaCreate, serverVersion, tables, tableRead, migrationsRead, installations: installations.rows, migrations };
  } finally {
    if (transaction) await client.query("ROLLBACK").catch(() => undefined);
    await client.end().catch(() => undefined);
  }
}
