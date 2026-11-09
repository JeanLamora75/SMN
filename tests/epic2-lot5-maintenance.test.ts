import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,readFile,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {beginOfflineRestoreMaintenance,restoreMaintenanceActive,
 inspectOfflineRestoreMaintenance} from "../src/server/backup/restore-maintenance";

test("SMN-34 maintenance gate persists through a simulated server restart",
 async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn34-maintenance-"));
 const original=process.env.SMN_RESTORE_MAINTENANCE_MARKER;
 const backup=process.env.SMN_BACKUP_DIR;
 try{
  process.env.SMN_RESTORE_MAINTENANCE_MARKER=join(root,"restore-maintenance.lock");
  delete process.env.SMN_BACKUP_DIR;
  assert.equal(await restoreMaintenanceActive(),false);
  const marker=await beginOfflineRestoreMaintenance();
  assert.equal(marker.version,1);
  assert.equal(await restoreMaintenanceActive(),true);
  assert.deepEqual(await inspectOfflineRestoreMaintenance(),marker);
  await assert.rejects(beginOfflineRestoreMaintenance(),/EEXIST/);
  // The file outlives all in-memory sessions; stale process cannot grant access.
  assert.equal((await readFile(process.env.SMN_RESTORE_MAINTENANCE_MARKER,"utf8"))
   .includes(marker.operationId),true);
  await writeFile(process.env.SMN_RESTORE_MAINTENANCE_MARKER,"damaged");
  assert.equal(await restoreMaintenanceActive(),true);
  await assert.rejects(inspectOfflineRestoreMaintenance());
  await rm(process.env.SMN_RESTORE_MAINTENANCE_MARKER);
  assert.equal(await restoreMaintenanceActive(),false);
  process.env.SMN_RESTORE_MAINTENANCE_MARKER=join(process.cwd(),"not-private");
  assert.equal(await restoreMaintenanceActive(),true,
   "Unsafe configuration also denies sessions");
 }finally{
  if(original===undefined)delete process.env.SMN_RESTORE_MAINTENANCE_MARKER;
  else process.env.SMN_RESTORE_MAINTENANCE_MARKER=original;
  if(backup===undefined)delete process.env.SMN_BACKUP_DIR;
  else process.env.SMN_BACKUP_DIR=backup;
  await rm(root,{recursive:true,force:true});
 }
});
