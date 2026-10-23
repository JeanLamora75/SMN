import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertIdentityMigrationValid,
  isSupportedAuthenticationSchemaVersion,
} from "../src/server/accounts/migration";

describe("Authentification : compatibilité du schéma v27", () => {
  it("autorise les schémas 1 à 27, dont la migration manuelle de l'identité", () => {
    for (let version = 1; version <= 27; version++) {
      assert.equal(isSupportedAuthenticationSchemaVersion(version), true);
    }
  });

  it("refuse les versions futures, absentes ou mal formées", () => {
    for (const version of [0, 28, 99, -1, 1.5, Number.NaN, Infinity]) {
      assert.equal(isSupportedAuthenticationSchemaVersion(version), false);
    }
  });

  it("accepte v27 seulement si la migration et ses sept colonnes sont présentes", () => {
    assert.doesNotThrow(() => assertIdentityMigrationValid(27, true, "7"));
    assert.throws(() => assertIdentityMigrationValid(27, false, "7"), /smn-schema-incompatible/);
    assert.throws(() => assertIdentityMigrationValid(27, true, "6"), /smn-schema-incompatible/);
    assert.throws(() => assertIdentityMigrationValid(27, true, undefined), /smn-schema-incompatible/);
  });

  it("n'impose pas rétroactivement la migration facultative aux schémas antérieurs", () => {
    assert.doesNotThrow(() => assertIdentityMigrationValid(26, false, undefined));
    assert.doesNotThrow(() => assertIdentityMigrationValid(1, false, undefined));
  });
});
