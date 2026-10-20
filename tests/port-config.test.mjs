import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_SMN_PORT, RESERVED_PORTS, resolveSmnPort } from "../scripts/port-config.mjs";

describe("SMN-11 — coexistence des serveurs locaux", () => {
  it("utilise 3003 par défaut, hors des ports réservés", () => {
    assert.equal(resolveSmnPort(undefined), 3003);
    assert.equal(DEFAULT_SMN_PORT, 3003);
    assert.equal(RESERVED_PORTS.includes(resolveSmnPort(undefined)), false);
  });
  it("accepte un port personnalisé non réservé sans changer la valeur par défaut", () => {
    assert.equal(resolveSmnPort("3010"), 3010);
    assert.equal(resolveSmnPort("3003"), 3003);
    assert.equal(resolveSmnPort(""), DEFAULT_SMN_PORT);
  });
  it("rejette les ports 3000 à 3002 déjà attribués à l'autre projet", () => {
    for (const port of RESERVED_PORTS) {
      assert.throws(() => resolveSmnPort(String(port)), /réservés/);
    }
  });
  it("rejette les numéros invalides, partiels ou non autorisés", () => {
    for (const value of ["0", "80", "65536", "3003x", "-3003", "3003.5", " 3003", "Infinity"]) {
      assert.throws(() => resolveSmnPort(value));
    }
  });
});
