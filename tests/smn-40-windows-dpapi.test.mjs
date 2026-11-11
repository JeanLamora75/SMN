import assert from "node:assert/strict";
import {test} from "node:test";
import {randomBytes} from "node:crypto";
import {spawnSync} from "node:child_process";
import {mkdtemp,mkdir,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {privacyLedgerPaths} from "../scripts/windows/privacy-ledger-env.mjs";

test("Windows: user-scoped DPAPI encrypt/decrypt round-trip for external HMAC key",
 {skip:process.platform!=="win32",timeout:30000},async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn-ledger-dpapi-"));
 try{
  const env={...process.env,
   APPDATA:join(root,"roaming"),LOCALAPPDATA:join(root,"local")};
  const {keyFile,ledger,anchor}=privacyLedgerPaths(env);
  await mkdir(dirname(keyFile),{recursive:true});
  const testSecret=randomBytes(32).toString("hex");
  const encrypt=`$ErrorActionPreference='Stop'; $s=[Console]::In.ReadToEnd().Trim(); $v=ConvertTo-SecureString -String $s -AsPlainText -Force; [Console]::Out.Write((ConvertFrom-SecureString -SecureString $v))`;
  const encrypted=spawnSync("powershell.exe",[
   "-NoProfile","-NonInteractive","-Command",encrypt
  ],{input:testSecret,encoding:"utf8",windowsHide:true,timeout:10000,maxBuffer:2048});
  assert.equal(encrypted.status,0,"Windows DPAPI encryption must work");
  assert.match(encrypted.stdout.trim(),/^[0-9a-f]{80,2048}$/i);
  await writeFile(keyFile,encrypted.stdout.trim());
  await mkdir(ledger,{recursive:true});
  const loader=fileURLToPath(new URL("../scripts/windows/privacy-ledger-env.mjs",import.meta.url));
  const source=`import {loadPrivacyLedgerEnvironment} from ${JSON.stringify("file:///"+loader.replaceAll("\\","/").replace(/^\//,""))}; const ok=loadPrivacyLedgerEnvironment(); process.stdout.write(ok && process.env.SMN_ERASURE_LEDGER_KEY_HEX===process.env.SMN_DPAPI_TEST_EXPECTED ? "PASS":"FAIL");`;
  const cleanEnv={...env,SMN_DPAPI_TEST_EXPECTED:testSecret};
  for(const k of ["NODE_TEST_CONTEXT","NODE_ENV",
   "SMN_ERASURE_LEDGER_DIR","SMN_ERASURE_ANCHOR_DIR",
   "SMN_ERASURE_LEDGER_KEY_HEX"])delete cleanEnv[k];
  const decrypted=spawnSync(process.execPath,["--input-type=module","-e",source],{
   env:cleanEnv,encoding:"utf8",windowsHide:true,timeout:10000,maxBuffer:2048
  });
  assert.equal(decrypted.status,0,"Windows DPAPI decryption must work");
  assert.equal(decrypted.stdout,"PASS");
  assert.equal(decrypted.stderr,"");
  assert.equal(anchor,dirname(keyFile));
 }finally{await rm(root,{recursive:true,force:true});}
});
