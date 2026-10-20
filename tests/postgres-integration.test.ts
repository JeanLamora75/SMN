import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Client } from "pg";
import { diagnoseInstallation } from "../src/server/installation/diagnostic";
import { parseConnectionSettings } from "../src/server/db/config";
import { probePostgres } from "../src/server/db/probe";

// Tests avec écritures de FIXTURES : interdits sur les bases personnelles.
// Seul le service smn_ci éphémère du runner CI est autorisé.
const ci = process.env.CI === "true";
const uri = ci ? process.env.SMN_TEST_DATABASE_URL : undefined;
if (ci && (!uri || !parseConnectionSettings(uri).ok || new URL(uri).pathname !== "/smn_ci")) {
  throw new Error("CI : base temporaire smn_ci obligatoire, sans base utilisateur.");
}

async function withConnection<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  assert.ok(uri);
  const client = new Client({ connectionString: uri });
  try {
    await client.connect();
    return await fn(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

describe("SMN-11 — probe PostgreSQL réel (CI et base éphémère exclusivement)", { skip: !ci }, () => {
  it("appelle le véritable probe sur une base vide", async () => {
    assert.ok(uri);
    const snapshot = await probePostgres(uri);
    assert.equal(snapshot.schemaUsage, true);
    assert.equal(snapshot.schemaCreate, true);
    assert.equal(Math.floor((snapshot.serverVersion ?? 0) / 10000), 18);
    assert.deepEqual(snapshot.tables, []);
    assert.equal((await diagnoseInstallation(() => probePostgres(uri))).status, "virgin");
  });

  it("rejette une vue et un schéma étranger au lieu de classifier virgin", async () => {
    assert.ok(uri);
    await withConnection(async (client) => {
      await client.query("CREATE VIEW public.other_view AS SELECT 1 AS value");
      await client.query("CREATE SCHEMA untrusted_data");
    });
    try {
      const snapshot = await probePostgres(uri);
      assert.ok(snapshot.tables.includes("public.other_view:v"));
      assert.ok(snapshot.tables.includes("untrusted_data.<schema>"));
      assert.equal((await diagnoseInstallation(() => probePostgres(uri))).status, "schema-incompatible");
    } finally {
      await withConnection(async (client) => {
        await client.query("DROP VIEW IF EXISTS public.other_view");
        await client.query("DROP SCHEMA IF EXISTS untrusted_data");
      });
    }
  });

  it("différencie installation complète, migration échouée et schéma incorrect", async () => {
    assert.ok(uri);
    await withConnection(async (client) => {
      await client.query("CREATE TABLE public.smn_installation (id text PRIMARY KEY, state text, schema_version int)");
      await client.query("CREATE TABLE public._prisma_migrations (migration_name text, finished_at timestamptz, rolled_back_at timestamptz)");
      await client.query("INSERT INTO public.smn_installation VALUES ('singleton', 'initialized', 1)");
      await client.query("INSERT INTO public._prisma_migrations VALUES ('fixture_migration', now(), null)");
    });
    try {
      assert.equal((await diagnoseInstallation(() => probePostgres(uri))).status, "initialized");
      await withConnection(async (client) => {
        await client.query("UPDATE public._prisma_migrations SET finished_at = null");
      });
      assert.equal((await diagnoseInstallation(() => probePostgres(uri))).status, "installation-incomplete");
      await withConnection(async (client) => {
        await client.query("ALTER TABLE public.smn_installation DROP COLUMN schema_version");
      });
      assert.equal((await diagnoseInstallation(() => probePostgres(uri))).status, "schema-incompatible");
    } finally {
      await withConnection(async (client) => {
        await client.query("DROP TABLE IF EXISTS public._prisma_migrations");
        await client.query("DROP TABLE IF EXISTS public.smn_installation");
      });
    }
  });

  it("identifie l'absence de droits CREATE du compte local restreint", async () => {
    assert.ok(uri);
    const settings = new URL(uri);
    const username = "smn_ci_restricted";
    await withConnection(async (client) => {
      await client.query(`CREATE ROLE ${username} LOGIN PASSWORD 'temporary-ci-test-password'`);
      await client.query(`GRANT CONNECT ON DATABASE smn_ci TO ${username}`);
      await client.query(`GRANT USAGE ON SCHEMA public TO ${username}`);
    });
    try {
      settings.username = username;
      settings.password = "temporary-ci-test-password";
      const snapshot = await probePostgres(settings.toString());
      assert.equal(snapshot.schemaUsage, true);
      assert.equal(snapshot.schemaCreate, false);
      assert.equal((await diagnoseInstallation(() => probePostgres(settings.toString()))).status, "permissions-insufficient");
    } finally {
      await withConnection(async (client) => {
        await client.query(`REVOKE USAGE ON SCHEMA public FROM ${username}`);
        await client.query(`REVOKE CONNECT ON DATABASE smn_ci FROM ${username}`);
        await client.query(`DROP ROLE IF EXISTS ${username}`);
      });
    }
  });

  it("classe la base absente sans créer de base", async () => {
    assert.ok(uri);
    const url = new URL(uri);
    url.pathname = "/smn_database_missing";
    assert.equal((await diagnoseInstallation(() => probePostgres(url.toString()))).status, "database-missing");
  });
});
