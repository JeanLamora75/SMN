import assert from "node:assert/strict";
import {test} from "node:test";
import {mkdtemp,rm,writeFile,mkdir,symlink,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {launcherMaintenanceBlocked,validateLauncherMaintenanceMarker}
 from "../scripts/windows/restore-launch-gate.mjs";

test("SMN-34: le lanceur bloque sur verrou externe existant, endommagé ou symlink",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn34-launch-"));
 const app=join(root,"application"),outside=join(root,"control");
 await mkdir(app);await mkdir(outside);
 const marker=join(outside,"restore.lock");
 try{
  assert.equal(validateLauncherMaintenanceMarker(marker,app,null),true);
  assert.equal(await launcherMaintenanceBlocked(marker,app,null),false);
  await writeFile(marker,"damaged");
  assert.equal(await launcherMaintenanceBlocked(marker,app,null),true);
  await rm(marker);
  await symlink(app,marker,"dir");
  assert.equal(await launcherMaintenanceBlocked(marker,app,null),true);
  await rm(marker);
  await mkdir(marker);
  assert.equal(await launcherMaintenanceBlocked(marker,app,null),true);
 }finally{await rm(root,{recursive:true,force:true});}
});
test("SMN-34: une configuration de verrou dangereuse bloque le démarrage",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn34-launch-"));
 const app=join(root,"application"),backups=join(root,"backups");
 await mkdir(app);await mkdir(backups);
 try{
  const unsafe=[
   "relative.lock",join(app,"maintenance.lock"),join(backups,"restore.lock")
  ];
  for(const marker of unsafe){
   assert.equal(await launcherMaintenanceBlocked(marker,app,backups),true);
  }
  assert.equal(await launcherMaintenanceBlocked(undefined,app,backups),false,
   "Old installations without a configured marker retain normal startup");
 }finally{await rm(root,{recursive:true,force:true});}
});
test("SMN-34: le lanceur propriétaire vérifie le verrou avant lancement et pendant activité",async()=>{
 const cwd=fileURLToPath(new URL("../",import.meta.url));
 const launch=await readFile(join(cwd,"scripts/windows/launch-portable.mjs"),"utf8");
 const packageSource=await readFile(join(cwd,"scripts/windows/package-portable.mjs"),"utf8");
 assert.match(launch,/from "\.\/scripts\/windows\/restore-launch-gate\.mjs"/);
 assert.match(launch,/if\(await maintenanceBlocked\(\)\)throw Error/);
 assert.match(launch,/while\(!shuttingDown\)\{\s*if\(await maintenanceBlocked\(\)\)/);
 assert.match(launch,/if\(await maintenanceBlocked\(\)\)\{\s*shuttingDown=true;\s*console\.log/);
 assert.match(launch,/child\.kill\("SIGTERM"\)/);
 assert.match(launch,/if\(shuttingDown\)break;/);
 assert.match(packageSource,/copyFile\("scripts\/windows\/restore-launch-gate\.mjs"/);
 assert.match(packageSource,/from "\.\/maintenance\/restore-launch-gate\.mjs"/);
});

test("SMN portable launcher blocks local migration gate even without environment",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn-local-fence-"));
 const app=join(root,"SMN");
 await mkdir(app);
 await mkdir(join(app,"updates"));
 const local=join(app,"updates","restore-maintenance.lock");
 try{
  assert.equal(await launcherMaintenanceBlocked(undefined,app,undefined),false);
  await writeFile(local,"fenced");
  assert.equal(await launcherMaintenanceBlocked(undefined,app,undefined),true);
  await rm(local);
  assert.equal(await launcherMaintenanceBlocked(undefined,app,undefined),false);
 }finally{await rm(root,{recursive:true,force:true});}
});
