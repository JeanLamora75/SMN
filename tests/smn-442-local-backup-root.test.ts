import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,mkdir,rm,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {backupRootPath} from "../src/server/backup/runner";
import {privateFolder} from "../src/server/backup/files";

test("portable Windows backup store stays in SMN; legacy installations retain AppData",{
 skip:process.platform!=="win32"
},async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn-backup-location-"));
 const initial=process.cwd();
 const previousLocal=process.env.LOCALAPPDATA;
 const previousCustom=process.env.SMN_BACKUP_DIR;
 try{
  await mkdir(join(root,"data"));
  process.chdir(root);
  process.env.LOCALAPPDATA=join(root,"profile");
  delete process.env.SMN_BACKUP_DIR;
  const portable=join(root,"data","backups");
  assert.equal(backupRootPath(),portable);
  await privateFolder(portable,true);
  assert.equal(backupRootPath(),portable);
  const legacy=join(root,"profile","ScrumMasterNotebook","backups");
  await mkdir(legacy,{recursive:true});
  assert.equal(backupRootPath(),legacy,"Empty local placeholder must not hide existing legacy archives");
  await writeFile(join(portable,".backup-key"),Buffer.alloc(32,1));
  assert.equal(backupRootPath(),portable,"Nonempty local store takes precedence");
  await rm(portable,{recursive:true});
  assert.equal(backupRootPath(),legacy,"Legacy backup key path is not migrated or overwritten");
 }finally{
  process.chdir(initial);
  if(previousLocal===undefined)delete process.env.LOCALAPPDATA;
  else process.env.LOCALAPPDATA=previousLocal;
  if(previousCustom===undefined)delete process.env.SMN_BACKUP_DIR;
  else process.env.SMN_BACKUP_DIR=previousCustom;
  await rm(root,{recursive:true,force:true});
 }
});
