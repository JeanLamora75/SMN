import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyPostgresStartupLog } from "../src/server/bootstrap/postgres-startup";

describe("SMN-12 — diagnostic du démarrage PostgreSQL portable", () => {
  it("différencie les collisions de port", () => {
    assert.equal(classifyPostgresStartupLog(
      "LOG: could not bind IPv4 address \"127.0.0.1\": Address already in use",
    ), "managed-pg-port-in-use");
  });
  it("reconnaît le refus de socket Windows localisé en français", () => {
    const log = `2026-10-20 LOG: démarrage de PostgreSQL 18.6 on x86_64-windows
2026-10-20 LOG: n'a pas pu lier IPv4 à l'adresse « 127.0.0.1 » : Permission denied
2026-10-20 ATTENTION: n'a pas pu créer le socket d'écoute pour « 127.0.0.1 »
2026-10-20 FATAL: n'a pas pu créer de socket TCP/IP`;
    assert.equal(classifyPostgresStartupLog(log), "managed-pg-bind-denied");
    assert.equal(classifyPostgresStartupLog(
      'LOG: could not bind IPv4 address "127.0.0.1": Permission denied',
    ), "managed-pg-bind-denied");
  });
    it("différencie les erreurs de permissions", () => {
    assert.equal(classifyPostgresStartupLog(
      "FATAL: could not open configuration file: Permission denied",
    ), "managed-pg-permission-denied");
  });
  it("ne propose pas de récupérer un dossier verrouillé", () => {
    assert.equal(classifyPostgresStartupLog(
      'FATAL: lock file "postmaster.pid" already exists',
    ), "managed-pg-locked");
  });
  it("détecte les bibliothèques Windows manquantes et la mémoire partagée", () => {
    assert.equal(classifyPostgresStartupLog(
      "FATAL: could not load library: missing VCRUNTIME140.dll",
    ), "managed-pg-runtime-incomplete");
    assert.equal(classifyPostgresStartupLog(
      "FATAL: could not create shared memory segment",
    ), "managed-pg-shared-memory");
  });
  it("ne révèle pas les détails du journal ni de l'utilisateur si la cause est inconnue", () => {
    assert.equal(classifyPostgresStartupLog(
      'C:\\Users\\Personne\\secret\\data: unexpected crash',
    ), "managed-pg-start-failed");
    assert.equal(classifyPostgresStartupLog(""), "managed-pg-start-failed");
  });
  it("classe séparément les configurations et données incompatibles", () => {
    assert.equal(classifyPostgresStartupLog("FATAL: configuration file contains errors"), "managed-pg-config-invalid");
    assert.equal(classifyPostgresStartupLog("FATAL: database files are incompatible with server"), "managed-pg-data-incompatible");
  });
});
