import {tmpdir} from "node:os";
import {basename,isAbsolute,relative,resolve,sep} from "node:path";
import {lstat} from "node:fs/promises";

/**
 * Return an absolute, disposable candidate-file path accepted by the
 * restore sandbox. No files or directories are created.
 */
const name=process.argv[2]??"";
try{
 if(!/^smn_restore_test_files_[a-z0-9]{6,40}$/.test(name))
  throw Error("invalid-stage-name");
 const temp=resolve(tmpdir());
 const path=resolve(temp,name);
 const diff=relative(temp,path);
 if(!isAbsolute(path)||basename(path)!==name||
  diff!==name||diff===".."||diff.startsWith(".."+sep)||
  path!==resolve(path))
  throw Error("stage-not-inside-temp");
 const existing=await lstat(path).catch(e=>{
  if(e?.code==="ENOENT")return null;
  throw e;
 });
 if(existing)throw Error("stage-already-exists");
 process.stdout.write(path+"\n");
}catch{
 process.stderr.write("SMN40 staging preflight blocked (no write).\n");
 process.exitCode=2;
}
