import assert from "node:assert/strict";
import {test} from "node:test";
import {spawnSync} from "node:child_process";
import {mkdtemp,mkdir,readFile,rm,writeFile} from "node:fs/promises";
import {fileURLToPath,pathToFileURL} from "node:url";
import {createRequire} from "node:module";
import {tmpdir} from "node:os";
import {join} from "node:path";

test("SMN-34: maintenance persistante entre trois processus externes sans jamais autoriser de restore",
 {timeout:30000},async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn34-maintenance-test-"));
 const sandbox=join(root,"smn_restore_test_maintenance_lab");
 await mkdir(sandbox);
 const marker=join(sandbox,"maintenance.lock");
 const cwd=join(root,"app");
 await mkdir(cwd);
 const project=fileURLToPath(new URL("../",import.meta.url));
 const loader=pathToFileURL(createRequire(join(project,"package.json")).resolve("tsx")).href;
 const script=fileURLToPath(new URL("../scripts/smn-34-sandbox-maintenance.ts",import.meta.url));
 const invoke=(mode:string,location=marker)=>spawnSync(process.execPath,
  ["--import",loader,script,mode,location],{cwd,encoding:"utf8",timeout:14000,
   env:{...process.env,SMN_RESTORE_MAINTENANCE_MARKER:""}});
 try{
  const empty=invoke("--inspect");
  assert.equal(empty.status,2,empty.stderr);
  assert.equal(empty.stdout,"");
  const begin=invoke("--begin");
  assert.equal(begin.status,0,begin.stderr);
  assert.deepEqual(JSON.parse(begin.stdout),{
   mode:"sandbox-maintenance",status:"fenced",restoreEnabled:false,
   serverStoppedProven:false
  });
  const record=JSON.parse(await readFile(marker,"utf8"));
  assert.equal(record.purpose,"offline-restore");
  assert.match(record.operationId,/^[0-9a-f-]{36}$/);
  const another=invoke("--inspect");
  assert.equal(another.status,0,another.stderr);
  assert.equal(JSON.parse(another.stdout).status,"fenced");
  assert.equal(JSON.parse(another.stdout).serverStoppedProven,false);
  const duplicate=invoke("--begin");
  assert.equal(duplicate.status,2);
  assert.equal(duplicate.stdout,"");
  assert.match(duplicate.stderr,/production remains locked/);
  assert.equal((await readFile(marker,"utf8")).includes(record.operationId),true);
  await writeFile(marker,"corrupted");
  const broken=invoke("--inspect");
  assert.equal(broken.status,2);
  assert.equal(broken.stdout,"");
  assert.equal((await readFile(marker,"utf8")),"corrupted",
   "Malformed markers are never removed or overwritten by the supervisor");
 }finally{await rm(root,{recursive:true,force:true});}
});
test("SMN-34: refuse des dossiers dans le workspace, faux chemins et secrets",()=>{
 const cwd=fileURLToPath(new URL("../",import.meta.url));
 const script=fileURLToPath(new URL("../scripts/smn-34-sandbox-maintenance.ts",import.meta.url));
 const bad=spawnSync(process.execPath,["--import","tsx",script,"--begin",
  join(cwd,"maintenance.lock")],{cwd,encoding:"utf8",timeout:14000});
 assert.equal(bad.status,2,bad.stderr);
 assert.equal(bad.stdout,"");
 assert.match(bad.stderr,/production remains locked/);
 assert.doesNotMatch(bad.stderr,/Error:|at .*\.ts:\d+|password/i);
});
