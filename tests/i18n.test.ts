import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {translate,translateBootstrapStep,translateBootstrapError} from "../src/i18n/catalog";
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

  it("localises steps returned by the existing installation backend",()=>{
    assert.equal(translateBootstrapStep("en","Connexion au serveur PostgreSQL local"),"Connecting to local PostgreSQL server");
    assert.equal(translateBootstrapStep("fr","Connexion au serveur PostgreSQL local"),"Connexion au serveur PostgreSQL local");
    assert.equal(translateBootstrapStep("en","unrecognised step"),"Installing");
  });
  it("localises only allowlisted installation error codes and never exposes raw values",()=>{
    assert.equal(translateBootstrapError("en","postgres-auth-invalid"),"Incorrect PostgreSQL username or password.");
    assert.equal(translateBootstrapError("fr","postgres-auth-invalid"),"Identifiant ou mot de passe PostgreSQL incorrect.");
    assert.equal(translateBootstrapError("en","postgresql://secret@private"),"Installation was interrupted. No data folder was deleted.");
  });
  it("provides placeholders for context data without translating free text",()=>{
    assert.equal(translate("en","password.welcome",{username:"Jean"}),"Welcome, Jean. Before accessing the application, you must replace the password set during installation.");
    assert.equal(translate("fr","dashboard.team",{team:"Produit libre"}),"Équipe Produit libre");
  });
  it("preserves language negotiation before setup",()=>{
    assert.equal(negotiateLanguage("en-US,en;q=0.8"),"en");
    assert.equal(negotiateLanguage("de-DE"),"fr");
  });
});
