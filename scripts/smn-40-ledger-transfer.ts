/**
 * SMN-40: encrypted, portable evidence transfer for a NEW Windows user profile.
 * Does not restore PostgreSQL, alter existing ledgers, or grant cutover permission.
 * Passphrase arrives on stdin (not argv). This package is NEVER stored in SMN backups.
 */
import {createCipheriv,createDecipheriv,createHmac,randomBytes,scryptSync,timingSafeEqual} from "node:crypto";
import {spawnSync} from "node:child_process";
import {lstat,mkdir,readFile,rm,writeFile} from "node:fs/promises";
import {dirname,join,resolve} from "node:path";
import {privacyLedgerPaths} from "./windows/privacy-ledger-env.mjs";
import {erasureLedgerConfig,readErasureLedger} from "../src/server/backup/erasure-ledger";
import {hasUnresolvedErasureIntent} from "../src/server/backup/erasure-intent";
import {verifyErasureChain,ERASURE_GENESIS_MAC,type ErasureMarker} from "../src/server/backup/erasure-evidence-format";

const HEX=/^[a-f0-9]{64}$/;
const OUTPUT=/^smn-privacy-transfer-[a-z0-9-]+\.enc$/i;
type Anchor={version:1;coverageStart:string;count:number;headMac:string;seal:string};
type Payload={version:1;ledger:string;anchor:Anchor;keyHex:string};
type Envelope={version:1;kdf:"scrypt-N16384-r8-p1";salt:string;iv:string;tag:string;ciphertext:string};
const sign=(key:Buffer,a:Anchor)=>createHmac("sha256",key).update(
 ["smn-erasure-anchor-v1",a.version,a.coverageStart,a.count,a.headMac].join("|")).digest("hex");
const date=(v:string)=>typeof v==="string"&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const equalHex=(a:string,b:string)=>HEX.test(a)&&HEX.test(b)&&
 timingSafeEqual(Buffer.from(a,"hex"),Buffer.from(b,"hex"));
function verifyPayload(v:Payload):void{
 if(v?.version!==1||!HEX.test(v.keyHex)||typeof v.ledger!=="string"||
  v.ledger.length>16*1024*1024||!v.ledger.endsWith("\n")&&v.ledger!==""||
  v.anchor?.version!==1||!date(v.anchor.coverageStart)||
  !Number.isSafeInteger(v.anchor.count)||v.anchor.count<0||
  !HEX.test(v.anchor.headMac)||!HEX.test(v.anchor.seal))
  throw Error("transfer-evidence-invalid");
 const key=Buffer.from(v.keyHex,"hex");
 try{
  if(!equalHex(sign(key,v.anchor),v.anchor.seal))throw Error("transfer-anchor-invalid");
  const lines=v.ledger===""?[]:v.ledger.slice(0,-1).split("\n");
  if(lines.length!==v.anchor.count)throw Error("transfer-count-invalid");
  const markers=lines.map(s=>JSON.parse(s) as ErasureMarker);
  if(!verifyErasureChain(key,markers)||markers.some(m=>m.occurredAt<v.anchor.coverageStart)||
   (markers.at(-1)?.mac??ERASURE_GENESIS_MAC)!==v.anchor.headMac)
   throw Error("transfer-chain-invalid");
 }finally{key.fill(0);}
}
function derive(passphrase:string,salt:Buffer){
 if(passphrase.length<20||passphrase.length>1024)throw Error("transfer-passphrase-invalid");
 return scryptSync(passphrase,salt,32,{N:16384,r:8,p:1,maxmem:64*1024*1024});
}
export function sealTransfer(payload:Payload,passphrase:string):Envelope{
 verifyPayload(payload);
 const salt=randomBytes(32),iv=randomBytes(12),key=derive(passphrase,salt);
 try{
  const cipher=createCipheriv("aes-256-gcm",key,iv);
  cipher.setAAD(Buffer.from("SMN-40-LEDGER-TRANSFER-V1"));
  const plaintext=Buffer.from(JSON.stringify(payload));
  try{
   const encrypted=Buffer.concat([cipher.update(plaintext),cipher.final()]);
   return {version:1,kdf:"scrypt-N16384-r8-p1",salt:salt.toString("hex"),
    iv:iv.toString("hex"),tag:cipher.getAuthTag().toString("hex"),
    ciphertext:encrypted.toString("base64")};
  }finally{plaintext.fill(0);}
 }finally{key.fill(0);}
}
export function openTransfer(value:unknown,passphrase:string):Payload{
 const v=value as Partial<Envelope>;
 if(!v||v.version!==1||v.kdf!=="scrypt-N16384-r8-p1"||
  !/^[a-f0-9]{64}$/.test(v.salt??"")||
  !/^[a-f0-9]{24}$/.test(v.iv??"")||
  !/^[a-f0-9]{32}$/.test(v.tag??"")||
  typeof v.ciphertext!=="string"||v.ciphertext.length>24*1024*1024||
  !/^[A-Za-z0-9+/]*={0,2}$/.test(v.ciphertext))
  throw Error("transfer-envelope-invalid");
 const key=derive(passphrase,Buffer.from(v.salt,"hex"));
 let decrypted:Buffer|undefined;
 try{
  const decipher=createDecipheriv("aes-256-gcm",key,Buffer.from(v.iv,"hex"));
  decipher.setAAD(Buffer.from("SMN-40-LEDGER-TRANSFER-V1"));
  decipher.setAuthTag(Buffer.from(v.tag,"hex"));
  decrypted=Buffer.concat([decipher.update(Buffer.from(v.ciphertext,"base64")),decipher.final()]);
  const payload=JSON.parse(decrypted.toString("utf8")) as Payload;
  verifyPayload(payload);
  return payload;
 }finally{decrypted?.fill(0);key.fill(0);}
}
async function absent(path:string){
 try{await lstat(path);return false;}
 catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return true;throw e;}
}
async function regular(path:string,max:number){
 const s=await lstat(path);
 if(!s.isFile()||s.isSymbolicLink()||s.size>max)throw Error("transfer-file-untrusted");
}
function protectWindowsKey(hex:string):string{
 if(process.platform!=="win32")throw Error("transfer-windows-required");
 const command=`$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.Security; $s=[Console]::In.ReadToEnd().Trim(); if($s -notmatch '^[a-f0-9]{64}$'){throw 'invalid-key'}; $p=[Text.Encoding]::UTF8.GetBytes($s); try {$c=[Security.Cryptography.ProtectedData]::Protect($p,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($c))} finally {[Array]::Clear($p,0,$p.Length)}`;
 const result=spawnSync("powershell.exe",["-NoProfile","-NonInteractive","-Command",command],
  {windowsHide:true,encoding:"utf8",input:hex,timeout:10000,maxBuffer:2048});
 const value=result.status===0?result.stdout.trim():"";
 if(!/^[A-Za-z0-9+/=]{80,2048}$/.test(value))
  throw Error("transfer-dpapi-protection-failed");
 return value;
}
export async function exportLedger(output:string,passphrase:string){
 if(process.platform!=="win32"||!OUTPUT.test(output.split(/[\\/]/).at(-1)??"")||
  resolve(output)!==output||!await absent(output))
  throw Error("transfer-export-target-invalid");
 if(await hasUnresolvedErasureIntent())throw Error("transfer-pending-erasure");
 const snapshot=await readErasureLedger();
 const config=erasureLedgerConfig();
 if(!config)throw Error("transfer-ledger-unconfigured");
 try{
  if(!await absent(join(config.anchor,".erasure-ledger.lock"))||
   !await absent(join(config.anchor,".erasure-finalize.lock")))
   throw Error("transfer-ledger-busy");
  const aPath=join(config.anchor,"erasure-anchor.json");
  const lPath=join(config.ledger,"erasure-ledger.jsonl");
  await regular(aPath,4096);await regular(lPath,16*1024*1024);
  const payload:Payload={version:1,ledger:await readFile(lPath,"utf8"),
   anchor:JSON.parse(await readFile(aPath,"utf8")) as Anchor,
   keyHex:config.key.toString("hex")};
  verifyPayload(payload);
  if(payload.anchor.coverageStart!==snapshot.coverageStart||
   payload.anchor.count!==snapshot.markers.length)
   throw Error("transfer-ledger-changed");
  const bytes=JSON.stringify(sealTransfer(payload,passphrase));
  await writeFile(output,bytes,{flag:"wx",mode:0o600});
  return {mode:"export",markers:payload.anchor.count,coverageStart:payload.anchor.coverageStart,
   restorationAuthorized:false,activeDatabaseModified:false};
 }finally{config.key.fill(0);}
}
export async function importLedger(input:string,passphrase:string){
 if(process.platform!=="win32")throw Error("transfer-windows-required");
 await regular(input,24*1024*1024);
 const payload=openTransfer(JSON.parse(await readFile(input,"utf8")),passphrase);
 const paths=privacyLedgerPaths();
 // Absolutely never replace evidence or DPAPI material, even if unreadable.
 if(!await absent(paths.ledger)||!await absent(paths.anchor)||
  !await absent(paths.keyFile))
  throw Error("transfer-destination-not-pristine");
 const dpapi=protectWindowsKey(payload.keyHex);
 // Check the profile folder before writing. A fresh profile must not contain
 // an existing journal; create both directories exclusively.
 await mkdir(dirname(paths.ledger),{recursive:true});
 await mkdir(dirname(paths.anchor),{recursive:true});
 let madeLedger=false,madeAnchor=false;
 try{
  await mkdir(paths.ledger,{mode:0o700});madeLedger=true;
  await mkdir(paths.anchor,{mode:0o700});madeAnchor=true;
  await writeFile(join(paths.ledger,"erasure-ledger.jsonl"),payload.ledger,
   {flag:"wx",mode:0o600});
  await writeFile(join(paths.anchor,"erasure-anchor.json"),JSON.stringify(payload.anchor),
   {flag:"wx",mode:0o600});
  await writeFile(paths.keyFile,dpapi,{flag:"wx",mode:0o600});
  // Do not report any historical reconciliation: an authenticated ledger is
  // not proof that older off-ledger erasures never occurred.
  return {mode:"import",markers:payload.anchor.count,
   coverageStart:payload.anchor.coverageStart,historyReconciled:false,
   restorationAuthorized:false,activeDatabaseModified:false};
 }catch(e){
  if(madeAnchor)await rm(paths.anchor,{recursive:true,force:true});
  if(madeLedger)await rm(paths.ledger,{recursive:true,force:true});
  throw e;
 }
}
async function stdinPassphrase():Promise<string>{
 const chunks:Buffer[]=[];
 for await(const chunk of process.stdin){chunks.push(Buffer.from(chunk));
  if(chunks.reduce((n,b)=>n+b.length,0)>4096)throw Error("transfer-input-too-large");}
 return Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/,"");
}
async function main(){
 const args=process.argv.slice(2);
 if(!((args.length===1&&args[0]==="--check")||
  (args.length===2&&["--export","--import"].includes(args[0]))))
  throw Error("transfer-arguments-invalid");
 if(args[0]==="--check"){
  if(process.platform!=="win32")throw Error("transfer-windows-required");
  const p=privacyLedgerPaths();
  process.stdout.write(JSON.stringify({mode:"check",
   sourcePresent:!await absent(join(p.ledger,"erasure-ledger.jsonl")),
   destinationPristine:await absent(p.ledger)&&await absent(p.anchor),
   restorationAuthorized:false})+"\n");
  return;
 }
 const phrase=await stdinPassphrase();
 const result=args[0]==="--export"?
  await exportLedger(args[1],phrase):await importLedger(args[1],phrase);
 process.stdout.write(JSON.stringify(result)+"\n");
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/smn-40-ledger-transfer.ts"))
 main().catch(()=>{process.stderr.write("SMN-40 ledger transfer blocked; no active restoration performed.\n");
  process.exitCode=2;});
