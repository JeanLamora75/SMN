import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canVisitSetup, canVisitPrivate } from "../src/server/access-policy";
import type { DiagnosticStatus } from "../src/server/installation/diagnostic";

describe("SMN-11 — refus côté serveur sans authentification", () => {
  const states: DiagnosticStatus[] = [
    "configuration-missing", "configuration-invalid", "database-missing",
    "connection-error", "permissions-insufficient", "server-version-unsupported",
    "virgin", "initialized", "schema-incompatible", "installation-incomplete",
  ];
  for (const status of states) {
    it("route setup pour l'état " + status, () => {
      const isVirgin = status === "virgin";
      assert.equal(canVisitSetup({ status, canEnterSetup: isVirgin }), isVirgin);
      assert.equal(canVisitPrivate(), false);
    });
  }
  it("refuse setup si le diagnostic n'autorise pas le parcours", () => {
    assert.equal(canVisitSetup({ status: "virgin", canEnterSetup: false }), false);
  });
});
