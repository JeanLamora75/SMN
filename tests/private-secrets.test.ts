import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mkdtemp, readFile, rm, writeFile, mkdir, lstat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseConnectionSettings } from "../src/server/db/config";
import { safeBootstrapError } from "../src/server/bootstrap/job";
import { appDataDirectory, readPrivateFile, decryptSetting, encryptSetting, loadExistingUri, saveExistingConfig } from "../src/server/bootstrap/settings";

describe("SMN-19 — confidentialité des secrets et diagnostics",()=>{
  it("n'accepte jamais une URL PostgreSQL dépourvue de secret ou une URL externe",()=>{
    for(const raw of [
      undefined,"postgresql://postgres@127.0.0.1:5432/smn",
      "postgresql://postgres:@127.0.0.1:5432/smn",
      "postgresql://postgres:secret@db.example.com/smn",
      "postgresql://postgres:secret@127.0.0.1:5432/autre",
      "postgresql://postgres:secret@127.0.0.1:5432/smn?sslmode=disable",
    ])assert.equal(parseConnectionSettings(raw).ok,false);
    const valid=parseConnectionSettings("postgresql://postgres:un-secret@127.0.0.1:5432/smn");
    assert.equal(valid.ok,true);
  });
  it("n'exporte jamais une erreur brute dans le diagnostic public",()=>{
    const secret="postgress://private-user:private-password@127.0.0.1:5432/smn";
    assert.equal(safeBootstrapError(new Error("unable to connect "+secret)),"installation-failed");
    assert.equal(safeBootstrapError(new Error("failed /Users/private/credentials.json")),"installation-failed");
    assert.equal(safeBootstrapError({message:secret}),"installation-failed");
    assert.equal(safeBootstrapError(new Error("configuration-key-missing")),"configuration-key-missing");
    assert.equal(safeBootstrapError(new Error("postgres-auth-invalid")),"postgres-auth-invalid");
  });
  it("refuse une lecture de cle dans un environnement non Windows",{
    skip:process.platform==="win32",
  },()=>{assert.throws(()=>appDataDirectory(),/windows-required/);});
  it("refuse toute décryption si la clé manque, sans la recréer",{
    skip:process.platform!=="win32"||process.env.GITHUB_ACTIONS!=="true",
  },async()=>{
    const tmp=await mkdtemp(path.join(os.tmpdir(),"smn-secrets-test-"));
    const previous=process.env.LOCALAPPDATA;
    const password="SHOULD-NEVER-APPEAR-IN-FILES-2026";
    try{
      process.env.LOCALAPPDATA=tmp;
      await saveExistingConfig("postgres",password,5432);
      const dir=appDataDirectory();
      const config=await readFile(path.join(dir,"postgres-connection.json"),"utf8");
      assert.ok(!config.includes(password));
      const key=await readPrivateFile(".settings-key");
      assert.equal(key?.length,32);
      assert.equal(decodeURIComponent(new URL((await loadExistingUri())!).password),password);
      await rm(path.join(dir,".settings-key"));
      await assert.rejects(()=>loadExistingUri());
      await assert.rejects(()=>encryptSetting("new secret"),/configuration-key-missing/);
      await assert.rejects(()=>decryptSetting(JSON.parse(config).passwordEncrypted),/configuration-key-missing/);
      await assert.rejects(()=>lstat(path.join(dir,".settings-key")),{code:"ENOENT"});
      // Restoring the original key recovers the existing ciphertext.
      await writeFile(path.join(dir,".settings-key"),key!,{flag:"wx"});
      assert.equal(decodeURIComponent(new URL((await loadExistingUri())!).password),password);
      const tampered=JSON.parse(config);
      tampered.passwordEncrypted=tampered.passwordEncrypted.slice(0,-2)+"aa";
      await writeFile(path.join(dir,"postgres-connection.json"),JSON.stringify(tampered));
      await assert.rejects(()=>loadExistingUri());
      const raw=await readPrivateFile("postgres-connection.json");
      assert.ok(raw&&!raw.toString("utf8").includes(password));
      await mkdir(path.join(dir,"runtime.json"),{recursive:false});
      await assert.rejects(()=>readPrivateFile("runtime.json"),/private-file-invalid/);
    }finally{
      if(previous===undefined)delete process.env.LOCALAPPDATA;
      else process.env.LOCALAPPDATA=previous;
      await rm(tmp,{recursive:true,force:true,maxRetries:5,retryDelay:200});
    }
  });
});
