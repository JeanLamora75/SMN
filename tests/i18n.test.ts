import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {translate} from "../src/i18n/catalog";
import {negotiateLanguage} from "../src/lib/language";
describe("SMN-27 — JSON i18n",()=>{
  it("reads both catalogues by semantic key",()=>{
    assert.equal(translate("fr","login.submit"),"Se connecter");
    assert.equal(translate("en","login.submit"),"Sign in");
    assert.equal(translate("en","home.heading"),"Installation diagnostics");
  });
  it("does not display unknown technical keys",()=>{
    assert.equal(translate("en","unknown.key" as never),"Translation unavailable.");
  });
  it("substitutes variables without ever interpreting HTML",()=>{
    assert.equal(translate("fr","settings.unknownCountry",{code:"DE"}),"DE — pays existant");
    assert.equal(translate("en","settings.unknownCountry",{code:"<script>"}),"<script> — existing country");
  });
  it("preserves language negotiation before setup",()=>{
    assert.equal(negotiateLanguage("en-US,en;q=0.8"),"en");
    assert.equal(negotiateLanguage("de-DE"),"fr");
  });
});
