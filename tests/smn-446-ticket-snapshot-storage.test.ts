import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,readFile,readdir,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {
 saveTicketSnapshot,listTicketSnapshots,readTicketSnapshot,deleteTicketSnapshot,
 TicketStorageError,type TicketScope,type TicketStorageOptions,
} from "../src/server/tickets/snapshot-storage";

const scope:TicketScope={teamId:"team_1",cycleId:"sprint_1",mode:"scrum"};
const header="id,type,resume,priority,status,sp";
const csv=(status="Done")=>header+"\nTKT-1,Bug,Erreur dans la page,High,"+status+",3\n";
async function fixture(t:{after:(callback:()=>Promise<void>)=>void}){
 const directory=await mkdtemp(path.join(tmpdir(),"smn-ticket-storage-"));
 t.after(()=>rm(directory,{recursive:true,force:true}));
 const options:TicketStorageOptions={directory,authorize:async()=>{}};
 return {directory,options};
}
function input(csvText=csv()){
 return{businessDate:"2025-05-23",filename:"tickets.csv",csv:csvText,actorId:"user_1"};
}

test("publication atomique d'une photographie avec CSV et métadonnées datées",async t=>{
 const {directory,options}=await fixture(t);
 const meta=await saveTicketSnapshot(scope,input(),options);
 assert.equal(meta.businessDate,"2025-05-23");
 assert.equal(meta.rowCount,1);
 assert.match(meta.importedAt,/^\d{4}-\d{2}-\d{2}T/);
 assert.match(meta.sha256,/^[a-f0-9]{64}$/);
 const stored=await readTicketSnapshot(scope,"2025-05-23",options);
 assert.equal(stored?.metadata.snapshotId,meta.snapshotId);
 assert.equal(stored.csv,csv());
 const entries=await readdir(path.join(directory,scope.teamId,scope.mode,scope.cycleId,"2025-05-23"));
 assert.ok(entries.includes("current.json"));
 assert.ok(entries.includes("versions"));
});

test("même date : confirmation explicite et remplacement complet, annulation sans effet",async t=>{
 const {options}=await fixture(t);
 const first=await saveTicketSnapshot(scope,input(),options);
 await assert.rejects(
  saveTicketSnapshot(scope,input(csv("Terminé")),options),
  (e:unknown)=>e instanceof TicketStorageError&&e.code==="confirmation-required",
 );
 assert.equal((await readTicketSnapshot(scope,"2025-05-23",options))?.csv,csv());
 const next=await saveTicketSnapshot(scope,{...input(csv("Terminé")),expectedSnapshotId:first.snapshotId},options);
 assert.notEqual(next.snapshotId,first.snapshotId);
 assert.equal((await readTicketSnapshot(scope,"2025-05-23",options))?.csv,csv("Terminé"));
 await assert.rejects(
  saveTicketSnapshot(scope,{...input(),expectedSnapshotId:first.snapshotId},options),
  (e:unknown)=>e instanceof TicketStorageError&&e.code==="confirmation-required",
 );
});

test("CSV invalide : aucun remplacement ni publication",async t=>{
 const {options}=await fixture(t);
 const first=await saveTicketSnapshot(scope,input(),options);
 await assert.rejects(
  saveTicketSnapshot(scope,{...input("id,status\nTKT-1,Done"),expectedSnapshotId:first.snapshotId},options),
  (e:unknown)=>e instanceof TicketStorageError&&e.code==="invalid-csv",
 );
 assert.equal((await readTicketSnapshot(scope,"2025-05-23",options))?.metadata.snapshotId,first.snapshotId);
});

test("liste : une seule photographie par date métier et isolation des cycles",async t=>{
 const {options}=await fixture(t);
 await saveTicketSnapshot(scope,input(),options);
 await saveTicketSnapshot(scope,{...input(),businessDate:"2025-05-21"},options);
 assert.deepEqual((await listTicketSnapshots(scope,options)).map(v=>v.businessDate),["2025-05-23","2025-05-21"]);
 assert.deepEqual(await listTicketSnapshots({...scope,cycleId:"sprint_2"},options),[]);
});

test("suppression confirmée par version, refusée si sprint clôturé",async t=>{
 const {options}=await fixture(t);
 const old=await saveTicketSnapshot(scope,input(),options);
 let closed=true;
 const protectedOptions:TicketStorageOptions={
  ...options,authorize:async(_scope,action)=>{
   if(action==="delete"&&closed)throw new TicketStorageError("closed-sprint");
  },
 };
 await assert.rejects(deleteTicketSnapshot(scope,"2025-05-23",old.snapshotId,protectedOptions),
  (e:unknown)=>e instanceof TicketStorageError&&e.code==="closed-sprint");
 assert.ok(await readTicketSnapshot(scope,"2025-05-23",options));
 closed=false;
 assert.equal(await deleteTicketSnapshot(scope,"2025-05-23",old.snapshotId,protectedOptions),true);
 assert.equal(await readTicketSnapshot(scope,"2025-05-23",options),null);
});

test("lien de suppression obsolète refusé après remplacement",async t=>{
 const {options}=await fixture(t);
 const first=await saveTicketSnapshot(scope,input(),options);
 await saveTicketSnapshot(scope,{...input(csv("Terminé")),expectedSnapshotId:first.snapshotId},options);
 await assert.rejects(deleteTicketSnapshot(scope,"2025-05-23",first.snapshotId,options),
  (e:unknown)=>e instanceof TicketStorageError&&e.code==="stale-confirmation");
});

test("refuse les traversées de chemin, dates illégales et noms de fichiers dangereux",async t=>{
 const {options}=await fixture(t);
 await assert.rejects(saveTicketSnapshot({...scope,teamId:"../other"},input(),options),
  (e:unknown)=>e instanceof TicketStorageError&&e.code==="invalid-scope");
 await assert.rejects(saveTicketSnapshot(scope,{...input(),businessDate:"2025-02-30"},options),
  (e:unknown)=>e instanceof TicketStorageError&&e.code==="invalid-business-date");
 await assert.rejects(saveTicketSnapshot(scope,{...input(),filename:"../../ticket.csv"},options),
  (e:unknown)=>e instanceof TicketStorageError&&e.code==="invalid-filename");
});

test("vérification SHA-256 : un fichier altéré n'est pas servi",async t=>{
 const {directory,options}=await fixture(t);
 const meta=await saveTicketSnapshot(scope,input(),options);
 const file=path.join(directory,scope.teamId,scope.mode,scope.cycleId,"2025-05-23","versions",meta.snapshotId,"snapshot.csv");
 await writeFile(file,csv("In Progress"));
 await assert.rejects(readTicketSnapshot(scope,"2025-05-23",options),
  (e:unknown)=>e instanceof TicketStorageError&&e.code==="integrity-failure");
});

test("le verrou exclusif refuse une opération concurrente sans écraser",async t=>{
 const {directory,options}=await fixture(t);
 await saveTicketSnapshot(scope,input(),options);
 const lock=path.join(directory,scope.teamId,scope.mode,scope.cycleId,"2025-05-23",".mutation.lock");
 await writeFile(lock,"locked");
 await assert.rejects(saveTicketSnapshot(scope,{...input(),expectedSnapshotId:(await listTicketSnapshots(scope,options))[0].snapshotId},options),
  (e:unknown)=>e instanceof TicketStorageError&&e.code==="snapshot-busy");
});

test("aucune autorisation de mutation : refus avant création du fichier",async t=>{
 const {options}=await fixture(t);
 const denied:TicketStorageOptions={...options,authorize:async(_scope,action)=>{
  if(action==="write")throw new TicketStorageError("forbidden");
 }};
 await assert.rejects(saveTicketSnapshot(scope,input(),denied),
  (e:unknown)=>e instanceof TicketStorageError&&e.code==="forbidden");
 assert.deepEqual(await listTicketSnapshots(scope,options),[]);
});
