import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateExpressInput, INITIAL_MIGRATION, INSTALLATION_RELATIONS } from "../src/server/installation/contract";
import { setupAuthorized, passwordHash } from "../src/server/installation/install";
import { classifySnapshot, type Snapshot } from "../src/server/installation/diagnostic";
import { INITIAL_SCHEMA_SQL } from "../src/server/installation/migration";
import { createHash } from "node:crypto";
const base = { mode: "scrum", product: "Alpha", team: "Bravo", password: "SecretFort2026ABC" };
describe("SMN-12 — contrat d'installation", () => {
  it("valide Scrum/Kanban et rejette les saisies incomplètes", () => {
    assert.ok(validateExpressInput(base)); assert.ok(validateExpressInput({ ...base, mode: "kanban" }));
    assert.equal(validateExpressInput({ ...base, mode: "safe" }), null);
    assert.equal(validateExpressInput({ ...base, team: "" }), null);
    assert.equal(validateExpressInput({ ...base, password: "short" }), null);
  });
  it("protège le jeton local et dérive le secret", async () => {
    const token = "A".repeat(40);
    assert.equal(setupAuthorized(token, token), true);
    assert.equal(setupAuthorized(token, "B".repeat(40)), false);
    assert.equal(setupAuthorized("weak", "weak"), false);
    const hash = await passwordHash(base.password);
    assert.match(hash, /^scrypt:1:[a-f0-9]+:[a-f0-9]+$/);
    assert.equal(hash.includes(base.password), false);
  });
  it("reconnaît uniquement le manifeste officiel complet", () => {
    const ready: Snapshot = { schemaUsage: true, schemaCreate: true, serverVersion: 180006,
      tables: [...INSTALLATION_RELATIONS], tableRead: true, migrationsRead: true, shapeValid: true,
      installations: [{ id: "singleton", state: "initialized", schema_version: 1 }],
      migrations: [{ migration_name: INITIAL_MIGRATION, checksum: createHash("sha256").update(INITIAL_SCHEMA_SQL).digest("hex"), finished_at: new Date(), rolled_back_at: null }] };
    assert.equal(classifySnapshot(ready).status, "initialized");
    assert.equal(classifySnapshot({ ...ready, shapeValid: false }).status, "installation-incomplete");
    assert.equal(classifySnapshot({ ...ready, migrations: [{ ...ready.migrations![0], checksum: "bad" }] }).status, "installation-incomplete");
  });
});
