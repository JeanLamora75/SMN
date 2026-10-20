import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifySnapshot,
  diagnoseInstallation,
  type Snapshot,
} from "../src/server/installation/diagnostic";
import { parseConnectionSettings } from "../src/server/db/config";

const virgin: Snapshot = { schemaUsage: true, tables: [] };
const valid: Snapshot = {
  schemaUsage: true,
  tables: ["smn_installation", "_prisma_migrations"],
  tableRead: true,
  installations: [{ id: "singleton", state: "initialized", schema_version: 1 }],
};

describe("SMN-11 — diagnostic sans mutation", () => {
  it("reconnaît une base vierge sans créer de compte ou d'équipe", async () => {
    assert.deepEqual(await diagnoseInstallation(async () => virgin), {
      status: "virgin",
      canEnterSetup: true,
    });
  });

  it("reconnaît une installation valide et ferme l'assistant", () => {
    assert.equal(classifySnapshot(valid).status, "initialized");
    assert.equal(classifySnapshot(valid).canEnterSetup, false);
  });

  it("ne confond pas une base étrangère avec une base vierge", () => {
    assert.equal(classifySnapshot({ schemaUsage: true, tables: ["articles"] }).status, "schema-incompatible");
    assert.equal(classifySnapshot({ schemaUsage: true, tables: ["_prisma_migrations"] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ schemaUsage: true, tables: ["smn_installation", "articles"] }).status, "schema-incompatible");
  });

  it("refuse les schémas modifiés et les installations partielles", () => {
    assert.equal(classifySnapshot({ ...valid, installations: [{ id: "singleton", state: "initialized", schema_version: 2 }] }).status, "schema-incompatible");
    assert.equal(classifySnapshot({ ...valid, installations: [] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, installations: [{ id: "singleton", state: "pending", schema_version: 1 }] }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...valid, installations: [{ id: "x", state: "initialized", schema_version: 1 }] }).status, "installation-incomplete");
  });

  it("distingue les privilèges manquants, sans exiger CREATEDB", () => {
    assert.equal(classifySnapshot({ schemaUsage: false, tables: [] }).status, "permissions-insufficient");
    assert.equal(classifySnapshot({ ...valid, tableRead: false }).status, "permissions-insufficient");
    assert.equal(classifySnapshot(virgin).status, "virgin");
  });

  it("classe les échecs PostgreSQL sans révéler l'erreur brute", async () => {
    for (const [code, expected] of [
      ["3D000", "database-missing"],
      ["42501", "permissions-insufficient"],
      ["28P01", "connection-error"],
      ["ECONNREFUSED", "connection-error"],
      ["ETIMEDOUT", "connection-error"],
    ]) {
      const failure = Object.assign(new Error("password=secret-should-not-leak"), { code });
      const result = await diagnoseInstallation(async () => { throw failure; });
      assert.equal(result.status, expected);
      assert.equal(JSON.stringify(result).includes("secret"), false);
      assert.equal(result.canEnterSetup, false);
    }
  });

  it("rejette une configuration absente ou dirigée vers une autre application", () => {
    assert.equal(parseConnectionSettings(undefined).status, "configuration-missing");
    assert.equal(parseConnectionSettings("bad-uri").status, "configuration-invalid");
    assert.equal(parseConnectionSettings("postgresql://local:pass@localhost:5432/lmn24").status, "configuration-invalid");
    assert.equal(parseConnectionSettings("postgresql://local:pass@remote.example:5432/smn").status, "configuration-invalid");
    assert.equal(parseConnectionSettings("postgresql://local:pass@localhost:5432/smn").ok, true);
    assert.equal(parseConnectionSettings("postgresql://local:pass@[::1]:5432/smn_test").ok, true);
    assert.equal(JSON.stringify(parseConnectionSettings("bad-uri")).includes("bad-uri"), false);
  });
});
