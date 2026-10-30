import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateExpressInput, INITIAL_MIGRATION, INSTALLATION_RELATIONS } from "../src/server/installation/contract";
import { setupAuthorized, passwordHash } from "../src/server/installation/install";
import { verifyPassword } from "../src/server/auth/password";
import { classifySnapshot, type Snapshot } from "../src/server/installation/diagnostic";
import { INITIAL_SCHEMA_SQL } from "../src/server/installation/migration";
import { createHash } from "node:crypto";
import { validateExistingDbInput } from "../src/server/bootstrap/existing";
import { validateDatabaseChoice } from "../src/server/bootstrap/job";
const base = { adminUsername: "admin", adminEmail: "admin@example.test", password: "SecretFort2026ABC" };
describe("SMN-12 — contrat d'installation", () => {
  it("valide le compte administrateur sans mode global ni équipe lors de l'installation native v32", () => {
    assert.deepEqual(validateExpressInput(base), base);
    assert.deepEqual(validateExpressInput({ password: base.password }), {
      password: base.password, adminUsername: "admin", adminEmail: "admin@localhot.com"
    });
    assert.deepEqual(validateExpressInput({ ...base, mode: "scrum", product: "Alpha", team: "Bravo" }), base);
    assert.deepEqual(validateExpressInput({ ...base, mode: "kanban" }), base);
    assert.deepEqual(validateExpressInput({ ...base, mode: "safe", team: "" }), base);
    assert.equal(validateExpressInput({ ...base, password: "abc" }), null);
    assert.equal(validateExpressInput({ ...base, adminUsername: "invalid name" }), null);
    assert.equal(validateExpressInput({ ...base, adminEmail: "invalid" }), null);
  });
  it("valide la connexion PostgreSQL existante et autorise une instance portable sans identifiants", () => {
    const existing = { dbMode: "existing", postgresUser: "postgres", postgresPassword: "secret", postgresPort: 5432 };
    assert.equal(validateDatabaseChoice(existing), true);
    assert.equal(validateDatabaseChoice({ dbMode: "portable" }), true);
    assert.equal(validateDatabaseChoice({ ...existing, postgresPassword: "" }), false);
    assert.equal(validateDatabaseChoice({ ...existing, postgresPort: -1 }), false);
    assert.equal(validateDatabaseChoice({ ...existing, postgresUser: "invalid/user" }), false);
    assert.equal(validateDatabaseChoice({ dbMode: "foreign" }), false);
    assert.deepEqual(validateExistingDbInput(existing), { postgresUser: "postgres", postgresPassword: "secret", postgresPort: 5432 });
  });
  it("protège le jeton local et dérive le secret", async () => {
    const token = "A".repeat(40);
    assert.equal(setupAuthorized(token, token), true);
    assert.equal(setupAuthorized(token, "B".repeat(40)), false);
    assert.equal(setupAuthorized("weak", "weak"), false);
    const hash = await passwordHash(base.password);
    assert.match(hash, /^scrypt:1:[a-f0-9]+:[a-f0-9]+$/);
    assert.equal(hash.includes(base.password), false);
    assert.equal(await verifyPassword(base.password, hash), true);
    assert.equal(await verifyPassword("mauvais", hash), false);
    assert.equal(await verifyPassword(base.password, "invalid-hash"), false);
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
