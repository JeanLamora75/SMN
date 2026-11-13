import {test} from "node:test";
import assert from "node:assert/strict";
import {createHash,randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink,readdir} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {
 captureTicketTransfer,inspectTicketTransferBytes,stageTicketTransfer,
 ticketTransferScopes,TicketTransferError,
} from "../src/server/backup/tickets-transfer";
import {inspectRestoreFileTree} from "../src/server/backup/restore-file-cutover-drill";
import {fingerprintCurrentFileInventories} from "../src/server/backup/current-managed-file-fingerprint";

const header="Id jira,Type de ticket,Titre du ticket,Priorité,Statut,Story points";
const csv=header+"\nABC-1,Story,Ticket restauré,Haute,Terminé,3\n";
const hash=(b:Buffer)=>createHash("sha256").update(b).digest("hex");
const snapshotId=randomUUID(),date="2026-11-01";
const base="team-one/scrum/sprint-one/"+date;
function fixture(){
 const raw=Buffer.from(csv,"utf8");
 const metadata={
  schemaVersion:1,snapshotId,teamId:"team-one",cycleId:"sprint-one",
  mode:"scrum",businessDate:date,importedAt:"2026-11-01T12:00:00.000Z",
  originalFilename:"tickets.csv",importedBy:"admin",rowCount:1,
  csvBytes:raw.length,sha256:hash(raw),
 };
 return [
  {name:base+"/current.json",value:JSON.stringify({snapshotId})},
  {name:base+"/versions/"+snapshotId+"/metadata.json",value:JSON.stringify(metadata)},
  {name:base+"/versions/"+snapshotId+"/snapshot.csv",value:csv},
  {name:"jira-config.json",value:JSON.stringify({
   baseUrl:"https://jira.example.com",revision:2,updatedAt:"2026-11-01T12:00:00.000Z",
  })},
 ];
}
async function put(root:string,items=fixture()){
 for(const item of items){
  const destination=join(root,...item.name.split("/"));
  await mkdir(join(destination,".."),{recursive:true});
  await writeFile(destination,item.value);
 }
}
test("SMN-456 — sauvegarde inventoriée, sha256 et restauration de l'équipe/cycle exacts",async t=>{
 const root=await mkdtemp(join(tmpdir(),"smn456-source-"));
 const other=await mkdtemp(join(tmpdir(),"smn456-target-"));
 t.after(async()=>{await rm(root,{recursive:true,force:true});await rm(other,{recursive:true,force:true});});
 await put(root);
 const {bytes,report}=await captureTicketTransfer(root);
 assert.equal(report.files,4);
 assert.equal(report.snapshots,1);
 assert.equal(report.sha256.length,64);
 const parsed=inspectTicketTransferBytes(bytes);
 assert.deepEqual(ticketTransferScopes(parsed.bundle),[{
  teamId:"team-one",mode:"scrum",cycleId:"sprint-one",
 }]);
 const destination=join(other,"tickets");
 assert.deepEqual(await stageTicketTransfer(bytes,destination),report);
 for(const item of fixture()){
  assert.equal(await readFile(join(destination,...item.name.split("/")),"utf8"),item.value);
 }
 const inventory=fingerprintCurrentFileInventories([], {pdf:[],office:[],templates:[]},
  parsed.bundle.entries.map(e=>({path:e.path,sha256:e.sha256,size:e.size})));
 const inspected=await inspectRestoreFileTree(other);
 assert.equal(inspected.count,inventory.count);
 assert.equal(inspected.sha256,inventory.sha256);
});
test("SMN-456 — archive CSV altérée rejetée avant toute écriture",async t=>{
 const root=await mkdtemp(join(tmpdir(),"smn456-source-"));
 const other=await mkdtemp(join(tmpdir(),"smn456-target-"));
 t.after(async()=>{await rm(root,{recursive:true,force:true});await rm(other,{recursive:true,force:true});});
 await put(root);
 const {bytes}=await captureTicketTransfer(root);
 const altered=JSON.parse(bytes.toString("utf8")) as {
  version:number;entries:{path:string;size:number;sha256:string;data:string}[];totalBytes:number;
 };
 altered.entries.find(item=>item.path.endsWith("/snapshot.csv"))!.data=
  Buffer.from("CSV corrompu").toString("base64");
 assert.throws(()=>inspectTicketTransferBytes(Buffer.from(JSON.stringify(altered))),
  (e:unknown)=>e instanceof TicketTransferError&&e.code==="tickets-entry-integrity");
 await assert.rejects(stageTicketTransfer(Buffer.from(JSON.stringify(altered)),join(other,"tickets")));
 assert.deepEqual(await readdir(other),[]);
});
test("SMN-456 — absence de version ou de pointeur, absence d'association implicite",async t=>{
 const root=await mkdtemp(join(tmpdir(),"smn456-source-"));
 t.after(()=>rm(root,{recursive:true,force:true}));
 await put(root,fixture().filter(x=>!x.name.endsWith("metadata.json")));
 await assert.rejects(captureTicketTransfer(root),
  (e:unknown)=>e instanceof TicketTransferError&&e.code==="tickets-incomplete-snapshot");
 await rm(root,{recursive:true,force:true});
 await mkdir(root);
 await put(root,fixture().filter(x=>!x.name.endsWith("current.json")));
 await assert.rejects(captureTicketTransfer(root),
  (e:unknown)=>e instanceof TicketTransferError&&e.code==="tickets-orphan-snapshot");
});
test("SMN-456 — fichiers Jira invalides et chemins hostiles rejetés",async t=>{
 const root=await mkdtemp(join(tmpdir(),"smn456-source-"));
 t.after(()=>rm(root,{recursive:true,force:true}));
 await put(root);
 await writeFile(join(root,"jira-config.json"),JSON.stringify({
  baseUrl:"javascript:alert(1)",revision:1,updatedAt:null,
 }));
 await assert.rejects(captureTicketTransfer(root),
  (e:unknown)=>e instanceof TicketTransferError&&e.code==="tickets-jira-invalid");
 await writeFile(join(root,"jira-config.json"),JSON.stringify({
  baseUrl:"https://jira.example.com",revision:1,updatedAt:null,
 }));
 const hostile=JSON.parse((await captureTicketTransfer(root)).bytes.toString("utf8"));
 hostile.entries[0].path="../outside.csv";
 assert.throws(()=>inspectTicketTransferBytes(Buffer.from(JSON.stringify(hostile))),
  (e:unknown)=>e instanceof TicketTransferError&&e.code==="tickets-entry-invalid");
});
test("SMN-456 — source symlink et collision de destination interdits",async t=>{
 const root=await mkdtemp(join(tmpdir(),"smn456-source-"));
 const dest=await mkdtemp(join(tmpdir(),"smn456-dest-"));
 t.after(async()=>{await rm(root,{recursive:true,force:true});await rm(dest,{recursive:true,force:true});});
 await put(root);
 const {bytes}=await captureTicketTransfer(root);
 await mkdir(join(dest,"tickets"));
 await assert.rejects(stageTicketTransfer(bytes,join(dest,"tickets")),
  (e:unknown)=>e instanceof TicketTransferError&&e.code==="tickets-stage-not-pristine");
 await symlink(join(root,base,"current.json"),join(root,"linked.json"));
 await assert.rejects(captureTicketTransfer(root),
  (e:unknown)=>e instanceof TicketTransferError);
});
test("SMN-456 — paquet de mise à jour ne peut écrire sous data/tickets",()=>{
 const source=readFileSync("scripts/windows/distribution-layout.mjs","utf8");
 const contract=readFileSync("scripts/windows/update-contract.mjs","utf8");
 const packageScript=readFileSync("scripts/windows/package-portable.mjs","utf8");
 assert.match(source,/PERSISTENT = \["config", "data", "runtime", "updates"\]/);
 assert.match(contract,/assertApplicationPayload/);
 assert.match(packageScript,/distribution-private-tickets-not-empty/);
});
test("SMN-456 — sauvegarde, transport, vérification, staging et cutover raccordés",()=>{
 for(const file of [
  "src/server/backup/runner.ts",
  "src/server/backup/verification.ts",
  "src/server/backup/portable-package.ts",
  "src/server/backup/portable-import.ts",
  "src/server/backup/restore-sandbox.ts",
  "src/server/backup/fresh-install-cutover.ts",
 ]){
  const code=readFileSync(file,"utf8");
  assert.match(code,/(?:tickets|TicketTransfer)/i,file);
 }
 const restore=readFileSync("src/server/backup/restore-sandbox.ts","utf8");
 assert.match(restore,/restore-tickets-orphan-cycle/);
 assert.match(restore,/stageTicketTransfer/);
 assert.match(restore,/inspectRestoreFileTree/);
 const runner=readFileSync("src/server/backup/runner.ts","utf8");
 assert.match(runner,/version:5/);
 assert.match(runner,/backup-tickets-changed-before-publication/);
});
