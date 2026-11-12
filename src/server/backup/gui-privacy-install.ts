import {createHmac} from "node:crypto";
import {join} from "node:path";
import {lstat,mkdir,readFile,rename,writeFile} from "node:fs/promises";
import {privacyLocalPaths} from "../../../scripts/windows/privacy-ledger-env.mjs";
import {encryptSetting,privateSettingsDirectory} from "../bootstrap/settings";
import {erasureLedgerConfig,readErasureLedger} from "./erasure-ledger";
import {inspectGuiLedgerEvidence} from "./gui-transfer-evidence";
import {ERASURE_GENESIS_MAC} from "./erasure-evidence-format";

const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const exists=async(path:string)=>lstat(path).then(()=>true).catch(e=>{
 if((e as NodeJS.ErrnoException).code==="ENOENT")return false;
 throw e;
});

/** Must run only behind the offline maintenance fence. Existing destination
 * evidence is left untouched; nonempty erasure history blocks replacement.
 * New evidence goes in SMN/config, never in AppData.
 */
export async function installGuiPrivacyEvidence(
 encrypted:unknown,backupKey:Buffer,token:string
){
 if(!ID.test(token))throw Error("migration-privacy-token-invalid");
 const base=join(process.cwd(),"config");
 if(privateSettingsDirectory()!==base)
  throw Error("migration-privacy-settings-not-local");
 const paths=privacyLocalPaths();
 if(await exists(paths.keyFile)||await exists(paths.ledger)||
  await exists(paths.anchor))
  throw Error("migration-privacy-local-already-enrolled");
 const original=erasureLedgerConfig();
 if(original){
  try{
   const state=await readErasureLedger();
   if(state.markers.length>0)throw Error("migration-destination-erasure-history");
  }finally{original.key.fill(0);}
 }
 const source=inspectGuiLedgerEvidence(encrypted,backupKey);
 const marker=source.entries.at(-1);
 if(marker&&marker.occurredAt<source.coverageStart){
  source.ledgerKey.fill(0);
  throw Error("migration-privacy-ledger-window-invalid");
 }
 try{
  await mkdir(base,{recursive:true,mode:0o700});
  const config=await lstat(base);
  if(!config.isDirectory()||config.isSymbolicLink())
   throw Error("migration-privacy-config-untrusted");
  await mkdir(paths.ledger,{mode:0o700});
  await mkdir(paths.anchor,{mode:0o700});
  const headMac=source.entries.at(-1)?.mac??ERASURE_GENESIS_MAC;
  const statement={
   version:1 as const,coverageStart:source.coverageStart,
   count:source.entries.length,headMac
  };
  const seal=createHmac("sha256",source.ledgerKey).update(
   ["smn-erasure-anchor-v1",statement.version,statement.coverageStart,
    statement.count,statement.headMac].join("|")).digest("hex");
  await writeFile(join(paths.ledger,"erasure-ledger.jsonl"),
   source.entries.map(m=>JSON.stringify(m)+"\n").join(""),
   {flag:"wx",mode:0o600});
  await writeFile(join(paths.anchor,"erasure-anchor.json"),
   JSON.stringify({...statement,seal}),{flag:"wx",mode:0o600});
  const encryptedKey=await encryptSetting(source.ledgerKey.toString("hex"));
  // This is the publication marker. A partially prepared local ledger will
  // block rather than silently fall back to an unrelated legacy profile.
  await writeFile(paths.keyFile,encryptedKey,{flag:"wx",mode:0o600});
  for(const name of ["SMN_ERASURE_LEDGER_DIR","SMN_ERASURE_ANCHOR_DIR",
   "SMN_ERASURE_LEDGER_KEY_HEX"])delete process.env[name];
  const reloaded=await readErasureLedger();
  if(reloaded.coverageStart!==source.coverageStart||
   reloaded.markers.length!==source.entries.length)
   throw Error("migration-privacy-installed-ledger-mismatch");
  return {installed:true as const,markers:source.markers,
   privacyStoredLocally:true as const};
 }finally{source.ledgerKey.fill(0);}
}

/** After a failed migration, park only the new local evidence. The previous
 * Windows profile ledger, if present, is then selected again automatically.
 * No delete operation and no loss of either history.
 */
export async function parkGuiPrivacyEvidence(token:string){
 if(!ID.test(token))throw Error("migration-privacy-token-invalid");
 const paths=privacyLocalPaths();
 const entries=[paths.keyFile,paths.ledger,paths.anchor];
 const results=[];
 for(const name of entries){
  if(await exists(name)){
   const dest=name+".migration-rollback-"+token;
   if(await exists(dest))throw Error("migration-privacy-rollback-slot-occupied");
   await rename(name,dest);
   results.push(dest);
  }
 }
 for(const key of ["SMN_ERASURE_LEDGER_DIR","SMN_ERASURE_ANCHOR_DIR",
  "SMN_ERASURE_LEDGER_KEY_HEX"])delete process.env[key];
 return {parked:results.length};
}
