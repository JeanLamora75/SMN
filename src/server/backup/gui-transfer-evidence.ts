import {createHash} from "node:crypto";
import {lstat,readFile} from "node:fs/promises";
import {join} from "node:path";
import {Client} from "pg";
import {installedDatabaseUri} from "../auth/database";
import {backupRootPath} from "./runner";
import {inspectBackup} from "./verification";
import {readErasureLedger,erasureLedgerConfig} from "./erasure-ledger";
import {hasUnresolvedErasureIntent} from "./erasure-intent";
import {ERASURE_GENESIS_MAC,verifyErasureChain} from "./erasure-evidence-format";
import {fingerprintPublicTables} from "./restore-row-fingerprint";
import {fingerprintCurrentManagedFiles} from "./current-managed-file-fingerprint";
import {signCurrentStateReceipt} from "./current-state-transfer-receipt";
import {seal,unseal} from "./crypto";

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
type LedgerPayload={version:1;coverageStart:string;
 markers:Awaited<ReturnType<typeof readErasureLedger>>["markers"];keyHex:string};

/** The source still runs. This detects writes WHILE hashing, but cannot
 * attest future writes on the source after ZIP download. The destination
 * must compare the reconstructed candidate against the signed fingerprints.
 */
export async function captureGuiTransferEvidence(archiveId:string){
 if(!UUID.test(archiveId))throw Error("migration-source-id-invalid");
 const root=backupRootPath();
 const keyFile=join(root,".backup-key");
 const stat=await lstat(keyFile);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==32)
  throw Error("migration-source-key-unavailable");
 const key=await readFile(keyFile);
 let ledgerKey:Buffer|null=null;
 let client:Client|null=null;
 try{
  const archive=await inspectBackup(root,archiveId,key);
  if(archive.status!=="verified"||!archive.integrityVerified||
    !archive.scopeComplete||archive.schemaVersion!==33||
    !archive.postgresVersion?.startsWith("18.")||!archive.createdAt)
   throw Error("migration-source-backup-not-complete");
  const first=await readErasureLedger();
  if(first.coverageStart>archive.createdAt||
    first.markers.some(e=>e.occurredAt>archive.createdAt!)||
    await hasUnresolvedErasureIntent())
   throw Error("migration-source-erasure-window");
  const config=erasureLedgerConfig();
  if(!config)throw Error("migration-source-ledger-key-missing");
  ledgerKey=config.key;
  if(!verifyErasureChain(ledgerKey,first.markers))
   throw Error("migration-source-ledger-unverified");
  const uri=await installedDatabaseUri();
  client=new Client({connectionString:uri,connectionTimeoutMillis:3500,
   statement_timeout:120000,query_timeout:120000});
  await client.connect();
  const wal=async()=>{
   const r=await client!.query<{lsn:string}>(
    "SELECT pg_current_wal_lsn()::text AS lsn");
   if(!r.rows[0]?.lsn)throw Error("migration-source-wal-unavailable");
   return r.rows[0].lsn;
  };
  const firstLsn=await wal();
  await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const version=await client.query<{version:string}>(
   "SELECT current_setting('server_version') AS version");
  if(!version.rows[0]?.version.startsWith("18."))
   throw Error("migration-source-pg-incompatible");
  const database=await fingerprintPublicTables(client);
  const files=await fingerprintCurrentManagedFiles(client);
  await client.query("ROLLBACK");
  const secondLsn=await wal();
  const second=await readErasureLedger();
  if(firstLsn!==secondLsn||
    first.coverageStart!==second.coverageStart||
    JSON.stringify(first.markers)!==JSON.stringify(second.markers)||
    await hasUnresolvedErasureIntent())
   throw Error("migration-source-changed-during-evidence");
  const receipt=signCurrentStateReceipt({
   version:1,purpose:"frozen-current-state-migration",archiveId,
   archiveCreatedAt:archive.createdAt,measuredAt:new Date().toISOString(),
   schemaVersion:33,databaseDigest:database.digest,
   filesDigest:files.sha256,filesCount:files.count,
   ledgerCoverageStart:first.coverageStart,
   ledgerHeadMac:first.markers.at(-1)?.mac??ERASURE_GENESIS_MAC,
   ledgerCount:first.markers.length
  },key);
  const data=Buffer.from(JSON.stringify({
   version:1,coverageStart:first.coverageStart,markers:first.markers,
   keyHex:ledgerKey.toString("hex")
  } satisfies LedgerPayload),"utf8");
  try{
   if(data.length>16*1024*1024)
    throw Error("migration-source-ledger-too-large");
   const encrypted=seal(key,data);
   const evidence=Buffer.from(JSON.stringify({
    version:1,purpose:"migration-erasure-evidence",
    algorithm:"aes-256-gcm",nonce:encrypted.nonce,tag:encrypted.tag,
    ciphertext:encrypted.ciphertext.toString("base64"),
    sha256:createHash("sha256").update(data).digest("hex")
   }),"utf8");
   return {receipt:Buffer.from(JSON.stringify(receipt),"utf8"),
    ledger:evidence};
  }finally{data.fill(0);}
 }finally{
  key.fill(0);ledgerKey?.fill(0);
  if(client)await client.end().catch(()=>undefined);
 }
}
export function inspectGuiLedgerEvidence(
 encrypted:unknown,key:Buffer
):{coverageStart:string;markers:number;headMac:string;ledgerKey:Buffer}{
 const e=encrypted as {version?:unknown;purpose?:unknown;
  algorithm?:unknown;nonce?:string;tag?:string;ciphertext?:string;sha256?:string};
 if(!e||e.version!==1||e.purpose!=="migration-erasure-evidence"||
  e.algorithm!=="aes-256-gcm"||
  !/^[a-f0-9]{24}$/.test(e.nonce??"")||
  !/^[a-f0-9]{32}$/.test(e.tag??"")||
  !/^[a-f0-9]{64}$/.test(e.sha256??"")||
  !e.ciphertext||e.ciphertext.length>24*1024*1024)
  throw Error("migration-ledger-envelope-invalid");
 const plain=unseal(key,{nonce:e.nonce!,tag:e.tag!,
  ciphertext:Buffer.from(e.ciphertext,"base64")});
 try{
  if(createHash("sha256").update(plain).digest("hex")!==e.sha256)
   throw Error("migration-ledger-integrity-invalid");
  const payload=JSON.parse(plain.toString("utf8")) as LedgerPayload;
  if(payload?.version!==1||!Array.isArray(payload.markers)||
   payload.markers.length>50000||
   !/^[a-f0-9]{64}$/.test(payload.keyHex??"")||
   !Number.isFinite(Date.parse(payload.coverageStart))||
   new Date(payload.coverageStart).toISOString()!==payload.coverageStart)
   throw Error("migration-ledger-payload-invalid");
  const ledgerKey=Buffer.from(payload.keyHex,"hex");
  if(!verifyErasureChain(ledgerKey,payload.markers)){
   ledgerKey.fill(0);
   throw Error("migration-ledger-chain-invalid");
  }
  return {coverageStart:payload.coverageStart,markers:payload.markers.length,
   headMac:payload.markers.at(-1)?.mac??ERASURE_GENESIS_MAC,ledgerKey};
 }finally{plain.fill(0);}
}
