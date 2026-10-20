import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifySnapshot, diagnoseInstallation, type Snapshot } from "../src/server/installation/diagnostic";
import { parseConnectionSettings } from "../src/server/db/config";

const names = ["public.smn_installation:r", "public._prisma_migrations:r"];
const virgin: Snapshot = { schemaUsage: true, schemaCreate: true, serverVersion: 180006, tables: [] };
const valid: Snapshot = {
  ...virgin, tables: names, tableRead: true, migrationsRead: true,
  installations: [{ id: "singleton", state: "initialized", schema_version: 1 }],
  migrations: [{ migration_name: "fixture_migration", finished_at: new Date(), rolled_back_at: null }],
};

describe("SMN-11 — diagnostic sans mutation", () => {
  it("reconnaît une base vierge sous PostgreSQL 18", async () => {
    assert.deepEqual(await diagnoseInstallation(async () => virgin), { status: "virgin", canEnterSetup: true });
  });
  it("reconnaît une installation versionnée avec migrations réussies", () => {
    assert.equal(classifySnapshot(valid).status, "installation-incomplete");
    assert.equal(classifySnapshot(valid).canEnterSetup, false);
  });
  it("refuse les objets étrangers, y compris vues, séquences et autres schémas", () => {
    for (const name of ["public.articles:r", "public.vue:v", "public.sequence:S", "other.orders:r", "other.<schema>"]) {
      assert.equal(classifySnapshot({ ...virgin, tables: [name] }).status, "schema-incompatible");
    }
    assert.equal(classifySnapshot({ ...virgin, tables: ["public._prisma_migrations:r"] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, tables: [...names, "public.unexpected_view:v"], tableRead: false }).status, "schema-incompatible");
  });
  it("refuse les installations partielles et versions futures inconnues", () => {
    assert.equal(classifySnapshot({ ...valid, migrations: [] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, migrations: [{ migration_name: "x", finished_at: null, rolled_back_at: null }] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, tables: ["public.smn_installation:r"] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, installations: [] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, installations: [{ id: "singleton", state: "pending", schema_version: 1 }] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, installations: [{ id: "singleton", state: "initialized", schema_version: 2 }] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, installations: [{ id: "singleton", state: "initialized", schema_version: 3 }] }).status, "schema-incompatible");
    assert.equal(classifySnapshot({ ...valid, tables: [...names, "public.users:r"] }).status, "schema-incompatible");
  });
  it("distingue permissions de lecture et capacité future de création", () => {
    assert.equal(classifySnapshot({ ...virgin, schemaUsage: false }).status, "permissions-insufficient");
    assert.equal(classifySnapshot({ ...virgin, schemaCreate: false }).status, "permissions-insufficient");
    assert.equal(classifySnapshot({ ...virgin, schemaCreate: undefined }).status, "permissions-insufficient");
    assert.equal(classifySnapshot({ ...virgin, serverVersion: undefined }).status, "server-version-unsupported");
    assert.equal(classifySnapshot({ ...valid, tableRead: false }).status, "permissions-insufficient");
    assert.equal(classifySnapshot({ ...valid, schemaCreate: false }).status, "installation-incomplete");
  });
  it("rejette un PostgreSQL hors version qualifiée", () => {
    assert.equal(classifySnapshot({ ...virgin, serverVersion: 170006 }).status, "server-version-unsupported");
  });
  it("classe les échecs SQL sans révéler leurs détails", async () => {
    for (const [code, expected] of [
      ["3D000", "database-missing"], ["42501", "permissions-insufficient"],
      ["42703", "schema-incompatible"], ["42P01", "schema-incompatible"],
      ["28P01", "connection-error"], ["ECONNREFUSED", "connection-error"], ["ETIMEDOUT", "connection-error"],
    ]) {
      const failure = Object.assign(new Error("password=secret-should-not-leak"), { code });
      const diagnosed = await diagnoseInstallation(async () => { throw failure; });
      assert.equal(diagnosed.status, expected);
      assert.equal(JSON.stringify(diagnosed).includes("secret"), false);
      assert.equal(diagnosed.canEnterSetup, false);
    }
  });
  it("rejette les URL non locales, d'autres bases ou avec options", () => {
    for (const invalid of [
      "bad-uri", "postgresql://local:pass@localhost:5432/lmn24",
      "postgresql://local:pass@remote.example:5432/smn",
      "postgresql://local:pass@localhost:5432/smn?host=remote.example",
      "postgresql://local:pass@localhost:5432/smn?sslmode=disable",
    ]) assert.deepEqual(parseConnectionSettings(invalid), { ok: false, status: "configuration-invalid" });
    assert.deepEqual(parseConnectionSettings(undefined), { ok: false, status: "configuration-missing" });
    assert.equal(parseConnectionSettings("postgresql://local:pass@localhost:5432/smn").ok, true);
    assert.equal(parseConnectionSettings("postgresql://local:pass@[::1]:5432/smn_test").ok, true);
  });
});
