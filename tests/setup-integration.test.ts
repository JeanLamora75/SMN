import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Client } from "pg";
import { installExpress } from "../src/server/installation/install";
import { classifySnapshot } from "../src/server/installation/diagnostic";
import { probePostgres } from "../src/server/db/probe";
import { parseConnectionSettings } from "../src/server/db/config";
import { readFile } from "node:fs/promises";
import { INITIAL_SCHEMA_SQL } from "../src/server/installation/migration";

// Base créée et supprimée exclusivement par le runner éphémère GitHub Actions.
const source = process.env.SMN_TEST_DATABASE_URL;
const enabled = process.env.GITHUB_ACTIONS === "true" && process.env.CI === "true" &&
  !!source && /^postgresql:\/\/smn_ci:[^@]+@127\.0\.0\.1:5432\/smn_ci$/.test(source);
const input = { mode: "scrum", product: "Produit SMN", team: "Équipe Alpha", password: "MotDePasseTest2026Solide" };
const target = enabled ? new URL(source!) : undefined;
if (target) target.pathname = "/smn_ci_setup";
async function withClient<T>(uri: string, task: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: uri });
  try { await client.connect(); return await task(client); }
  finally { await client.end().catch(() => undefined); }
}
describe("SMN-12 — installation réelle sur base CI temporaire", { skip: !enabled }, () => {
  it("le fichier de migration Prisma correspond exactement au schéma versionné", async () => {
    assert.equal(await readFile("prisma/migrations/20261020_smn12_initial/migration.sql", "utf8"), INITIAL_SCHEMA_SQL);
  });
  it("crée une seule installation et refuse la répétition, sans secret en clair", async () => {
    assert.ok(source && target);
    assert.equal(parseConnectionSettings(target.toString()).ok, true);
    const maintenance = new URL(source); maintenance.pathname = "/postgres";
    // Précondition : instance CI jetable connue. Ne supprimer que la base de test réservée.
    await withClient(maintenance.toString(), async (client) => {
      const check = await client.query<{ present: boolean }>(
        "SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname='smn_ci_setup') AS present",
      );
      assert.equal(check.rows[0].present, false, "La base de test doit être absente avant essai.");
    });
    try {
      const first = await installExpress(input, target.toString());
      assert.deepEqual(first, { ok: true });
      const snapshot = await probePostgres(target.toString());
      assert.equal(classifySnapshot(snapshot).status, "initialized");
      const data = await withClient(target.toString(), async (client) =>
        client.query<{ email: string; password_hash: string; must_change_password: boolean }>(
          "SELECT email,password_hash,must_change_password FROM public.smn_account",
        ));
      assert.equal(data.rowCount, 1);
      assert.equal(data.rows[0].email, "admin@locahost.com");
      assert.equal(data.rows[0].must_change_password, true);
      assert.equal(data.rows[0].password_hash.includes(input.password), false);
      assert.equal((await installExpress(input, target.toString())).ok, false);
      const accounts = await withClient(target.toString(), async (client) =>
        client.query("SELECT id FROM public.smn_account"));
      assert.equal(accounts.rowCount, 1);
    } finally {
      await withClient(maintenance.toString(), async (client) => {
        await client.query("DROP DATABASE IF EXISTS smn_ci_setup WITH (FORCE)");
      });
    }
  });
});
