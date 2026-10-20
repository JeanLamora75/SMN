import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Client } from "pg";
import { classifySnapshot, diagnoseInstallation } from "../src/server/installation/diagnostic";
import { parseConnectionSettings } from "../src/server/db/config";

// Probe intégrée en CI sur une base PostgreSQL éphémère, jamais sur le PC utilisateur.
const uri = process.env.SMN_TEST_DATABASE_URL;
describe("SMN-11 — PostgreSQL réel (CI uniquement)", { skip: !uri }, () => {
  it("connexion au PostgreSQL de test, état vierge et classification", async () => {
    assert.ok(uri);
    const settings = parseConnectionSettings(uri);
    assert.equal(settings.ok, true);
    const client = new Client({ connectionString: uri });
    try {
      await client.connect();
      const tables = await client.query<{ name: string }>(
        "SELECT c.relname AS name FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind IN ('r','p')",
      );
      assert.equal(classifySnapshot({ schemaUsage: true, tables: tables.rows.map((r) => r.name) }).status, "virgin");
    } finally {
      await client.end().catch(() => undefined);
    }
  });

  it("classe un nom de base inexistant comme absent, sans écriture", async () => {
    assert.ok(uri);
    const missing = uri.replace(/\/smn_ci(?:\?|$)/, "/smn_database_missing");
    const diagnosis = await diagnoseInstallation(async () => {
      const client = new Client({ connectionString: missing, connectionTimeoutMillis: 1000 });
      try {
        await client.connect();
      } finally {
        await client.end().catch(() => undefined);
      }
      return { schemaUsage: true, tables: [] };
    });
    assert.equal(diagnosis.status, "database-missing");
  });
});
