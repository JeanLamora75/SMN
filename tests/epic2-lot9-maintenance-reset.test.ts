import assert from "node:assert/strict";
import {test} from "node:test";
import {mkdtemp,mkdir,readFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {beginOfflineResetMaintenance,beginOfflineRestoreMaintenance,
 inspectOfflineRestoreMaintenance,restoreMaintenanceActive,localRestoreMaintenanceLockPath}
 from "../src/server/backup/restore-maintenance";

test("SMN-37: reset shares the persistent fail-closed maintenance fence",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn-reset-fence-"));
 const path=join(root,"recovery-maintenance.lock");
 const oldCwd=process.cwd();
 await mkdir(join(root,"app"));
 process.chdir(join(root,"app"));
 const prev=process.env.SMN_RESTORE_MAINTENANCE_MARKER;
 const backup=process.env.SMN_BACKUP_DIR;
 try{
  process.env.SMN_RESTORE_MAINTENANCE_MARKER=path;
  delete process.env.SMN_BACKUP_DIR;
  assert.equal(await restoreMaintenanceActive(),false);
  const marker=await beginOfflineResetMaintenance();
  assert.equal(marker.purpose,"offline-reset");
  assert.equal((await inspectOfflineRestoreMaintenance())?.operationId,
   marker.operationId);
  assert.equal(await restoreMaintenanceActive(),true);
  await assert.rejects(beginOfflineRestoreMaintenance(),/EEXIST/);
  assert.equal(JSON.parse(await readFile(path,"utf8")).purpose,"offline-reset");
  await rm(path);
  assert.equal(await restoreMaintenanceActive(),true,"Local fence must survive absent external marker");
  await rm(localRestoreMaintenanceLockPath());
  assert.equal(await restoreMaintenanceActive(),false);
 }finally{
  if(prev===undefined)delete process.env.SMN_RESTORE_MAINTENANCE_MARKER;
  else process.env.SMN_RESTORE_MAINTENANCE_MARKER=prev;
  if(backup===undefined)delete process.env.SMN_BACKUP_DIR;
  else process.env.SMN_BACKUP_DIR=backup;
  process.chdir(oldCwd);
  await rm(root,{recursive:true,force:true});
 }
});
