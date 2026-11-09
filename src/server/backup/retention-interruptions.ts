import {lstat,readdir} from "node:fs/promises";
import {join} from "node:path";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PREFIX=".retention-removing-";
/** No automatic deletion: unresolved tombstones require inspection and audit reconciliation. */
export async function inspectInterruptedRetention(root:string):Promise<{
 interrupted:string[];unknown:string[]
}>{
 const dir=join(root,"packages");
 const stat=await lstat(dir).catch((error:NodeJS.ErrnoException)=>{
  if(error.code==="ENOENT")return null;throw error;
 });
 if(!stat)return {interrupted:[],unknown:[]};
 if(!stat.isDirectory()||stat.isSymbolicLink())
  throw Error("retention-packages-invalid");
 const names=await readdir(dir);
 if(names.length>2000)throw Error("retention-packages-too-many");
 const interrupted:string[]=[],unknown:string[]=[];
 for(const name of names){
  if(!name.startsWith(PREFIX))continue;
  const suffix=name.slice(PREFIX.length);
  const info=await lstat(join(dir,name));
  if(UUID.test(suffix)&&info.isDirectory()&&!info.isSymbolicLink())
   interrupted.push(suffix);
  else unknown.push(name);
 }
 return {interrupted:interrupted.sort(),unknown:unknown.sort()};
}
