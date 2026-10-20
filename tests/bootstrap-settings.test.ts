import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { existingUri, saveExistingConfig, loadExistingUri } from "../src/server/bootstrap/settings";

describe("SMN-12 — configuration PostgreSQL via formulaire", () => {
  it("ne vise que la base smn locale avec nom, port et secret échappés", () => {
    const uri = existingUri("postgres", "mot:de@passe", 5432);
    const parsed = new URL(uri);
    assert.equal(parsed.hostname, "127.0.0.1");
    assert.equal(parsed.pathname, "/smn");
    assert.equal(parsed.port, "5432");
    assert.equal(decodeURIComponent(parsed.password), "mot:de@passe");
    assert.throws(() => existingUri("postgres", "", 5432), /postgres-credentials-invalid/);
    assert.throws(() => existingUri("postgres", "secret", 0), /postgres-credentials-invalid/);
  });
  it("sauvegarde un secret chiffré, sans mot de passe en clair dans le fichier", {
    skip: process.platform !== "win32" || process.env.GITHUB_ACTIONS !== "true",
  }, async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), "smn-settings-test-"));
    const previous = process.env.LOCALAPPDATA;
    const password = "private-test-password-never-publish";
    try {
      process.env.LOCALAPPDATA = tmp;
      await saveExistingConfig("postgres", password, 5432);
      const config = await readFile(path.join(tmp,"ScrumMasterNotebook","postgres-connection.json"),"utf8");
      assert.equal(config.includes(password),false);
      const uri = await loadExistingUri();
      assert.ok(uri);
      assert.equal(decodeURIComponent(new URL(uri).password),password);
      assert.equal(new URL(uri).pathname,"/smn");
    } finally {
      if (previous === undefined) delete process.env.LOCALAPPDATA;
      else process.env.LOCALAPPDATA = previous;
      await rm(tmp,{recursive:true,force:true,maxRetries:5,retryDelay:200});
    }
  });
});
