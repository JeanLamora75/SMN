import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertIdentityMigrationValid,
  assertMultiTeamMigrationValid,
  isSupportedAuthenticationSchemaVersion,
} from "../src/server/accounts/migration";

describe("Authentification : compatibilité du schéma v27", () => {
  it("autorise les schémas 1 à 30, dont les migrations manuelles de l'identité et des équipes", () => {
    for (let version = 1; version <= 30; version++) {
      assert.equal(isSupportedAuthenticationSchemaVersion(version), true);
    }
  });

  it("refuse les versions futures, absentes ou mal formées", () => {
    for (const version of [0, 31, 99, -1, 1.5, Number.NaN, Infinity]) {
      assert.equal(isSupportedAuthenticationSchemaVersion(version), false);
    }
  });

  it("accepte v27 seulement si la migration et ses sept colonnes sont présentes", () => {
    assert.doesNotThrow(() => assertIdentityMigrationValid(27, true, "7"));
    assert.throws(() => assertIdentityMigrationValid(27, false, "7"), /smn-schema-incompatible/);
    assert.throws(() => assertIdentityMigrationValid(27, true, "6"), /smn-schema-incompatible/);
    assert.throws(() => assertIdentityMigrationValid(27, true, undefined), /smn-schema-incompatible/);
    assert.throws(() => assertIdentityMigrationValid(28, false, "7"), /smn-schema-incompatible/);
  });

  it("refuse la v28 si migration absente ou structure incomplète",()=>{
    assert.doesNotThrow(()=>assertMultiTeamMigrationValid(28,true,true));
    assert.throws(()=>assertMultiTeamMigrationValid(28,false,true),/smn-schema-incompatible/);
    assert.throws(()=>assertMultiTeamMigrationValid(28,true,false),/smn-schema-incompatible/);
    assert.doesNotThrow(()=>assertMultiTeamMigrationValid(27,false,false));
  });

  it("n'impose pas rétroactivement la migration facultative aux schémas antérieurs", () => {
    assert.doesNotThrow(() => assertIdentityMigrationValid(26, false, undefined));
    assert.doesNotThrow(() => assertIdentityMigrationValid(1, false, undefined));
  });
});
