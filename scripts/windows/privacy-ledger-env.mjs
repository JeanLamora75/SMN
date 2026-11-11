/**
 * Optional Windows user-scoped DPAPI bootstrap for an existing external ledger.
 * Never writes keys to disk in plaintext or prints them in application logs.
 * An absent enrollment leaves all privacy-restore gates unchanged.
 */
import {existsSync,lstatSync} from "node:fs";
import {join,resolve} from "node:path";
import {spawnSync} from "node:child_process";

const HEX=/^[a-f0-9]{64}$/;
export function privacyLedgerPaths(env=process.env){
 if(!env.LOCALAPPDATA||!env.APPDATA)throw Error("privacy-user-profile-unavailable");
 const ledger=resolve(env.LOCALAPPDATA,"ScrumMasterNotebook","privacy-ledger");
 const anchor=resolve(env.APPDATA,"ScrumMasterNotebook","privacy-anchor");
 const keyFile=join(anchor,"key.dpapi");
 return {ledger,anchor,keyFile};
}
export function loadPrivacyLedgerEnvironment(env=process.env){
 if(process.platform!=="win32")return false;
 const vars=["SMN_ERASURE_LEDGER_DIR","SMN_ERASURE_ANCHOR_DIR",
  "SMN_ERASURE_LEDGER_KEY_HEX"];
 if(vars.every(k=>!!env[k]))return true; // explicit legacy/test configuration
 if(vars.some(k=>!!env[k]))throw Error("privacy-ledger-partial-configuration");
 // Never auto-bind an installation's real evidence to an unconfigured test
 // runner; tests must supply their own explicit disposable ledger paths.
 if(env.NODE_ENV==="test"||env.NODE_TEST_CONTEXT||
  process.execArgv.includes("--test"))return false;
 const {ledger,anchor,keyFile}=privacyLedgerPaths(env);
 if(!existsSync(keyFile)){
  if(existsSync(ledger)||existsSync(anchor))
   throw Error("privacy-ledger-enrollment-incomplete");
  return false;
 }
 const st=lstatSync(keyFile);
 if(!st.isFile()||st.isSymbolicLink()||st.size<20||st.size>2048)
  throw Error("privacy-ledger-keyfile-untrusted");
 // The -Command is static. Only the path is inherited as an env value.
 const command=`$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.Security; $s=(Get-Content -LiteralPath $env:SMN_PRIVACY_KEY_FILE -Raw).Trim(); $c=[Convert]::FromBase64String($s); $p=[Security.Cryptography.ProtectedData]::Unprotect($c,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); try {[Console]::Out.Write([Text.Encoding]::UTF8.GetString($p))} finally {[Array]::Clear($p,0,$p.Length)}`;
 const result=spawnSync("powershell.exe",["-NoProfile","-NonInteractive","-Command",command],{
  windowsHide:true,encoding:"utf8",timeout:10000,maxBuffer:2048,
  env:{...env,SMN_PRIVACY_KEY_FILE:keyFile}
 });
 const secret=result.status===0?result.stdout.trim():"";
 if(!HEX.test(secret))throw Error("privacy-ledger-dpapi-unavailable");
 env.SMN_ERASURE_LEDGER_DIR=ledger;
 env.SMN_ERASURE_ANCHOR_DIR=anchor;
 env.SMN_ERASURE_LEDGER_KEY_HEX=secret;
 return true;
}
