import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { negotiateLanguage } from "../src/lib/language";

describe("SMN-11 — langue et préférences du navigateur", () => {
  it("choisit français par défaut", () => {
    assert.equal(negotiateLanguage(null), "fr");
    assert.equal(negotiateLanguage("de-DE"), "fr");
  });
  it("respecte anglais, français et les coefficients", () => {
    assert.equal(negotiateLanguage("en-US,en;q=0.9,fr;q=0.8"), "en");
    assert.equal(negotiateLanguage("de-DE,de;q=0.8,en;q=0.7"), "en");
    assert.equal(negotiateLanguage("en;q=0,fr;q=0.8"), "fr");
    assert.equal(negotiateLanguage("en;q=0"), "fr");
    assert.equal(negotiateLanguage("en;q=0.3,fr-FR;q=0.9"), "fr");
    assert.equal(negotiateLanguage("en;q=abc,fr;q=0.8"), "fr");
  });
});
