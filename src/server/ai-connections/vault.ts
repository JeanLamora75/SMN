import "server-only";
import {randomBytes} from "node:crypto";
import {chmod,lstat,mkdir,open,readFile,readdir,rename,rm} from "node:fs/promises";
import {join,resolve} from "node:path";
import {decryptAiKey,encryptAiKey} from "./crypto";

const ROOT=()=>resolve(process.cwd(),"data","ai-secrets");
const KEY_FILE=".vault-master-v1";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[a-f0-9]{12}$/i;
function assertId(id:string){if(!UUID.test(id))throw Error("ai-secret-invalid");}
const filename=(id:string,rev:number)=>{assertId(id);if(!Number.isSafeInteger(rev)||rev<1)throw Error("ai-secret-invalid");return id+"."+rev+".enc";};
async function directory(create:boolean){
 const data=join(process.cwd(),"data");
 if(create)await mkdir(data,{recursive:true,mode:0o700});
 const parent=await lstat(data).catch(()=>null);
 if(!parent?.isDirectory()||parent.isSymbolicLink())throw Error("ai-vault-unavailable");
 const root=ROOT();
 if(create)await mkdir(root,{mode:0o700}).catch((e:NodeJS.ErrnoException)=>{
  if(e.code!=="EEXIST")throw Error("ai-vault-unavailable");
 });
 const stat=await lstat(root).catch(()=>null);
 if(!stat?.isDirectory()||stat.isSymbolicLink())throw Error("ai-vault-unavailable");
 if(process.platform!=="win32"&&(stat.mode&0o077)!==0)throw Error("ai-vault-permissions-invalid");
 return root;
}
async function readMaster(root:string,create:boolean){
 const keyPath=join(root,KEY_FILE);
 const stat=await lstat(keyPath).catch(()=>null);
 if(stat){
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==32||
     process.platform!=="win32"&&(stat.mode&0o077)!==0)
   throw Error("ai-vault-key-invalid");
  const bytes=await readFile(keyPath);
  if(bytes.length!==32)throw Error("ai-vault-key-invalid");
  return bytes;
 }
 if(!create)throw Error("ai-vault-key-missing");
 const items=await readdir(root);
 // Never create a replacement master key over an existing vault.
 if(items.some(name=>name.endsWith(".enc")||name===KEY_FILE))
  throw Error("ai-vault-key-missing");
 const candidate=randomBytes(32);
 try{
  const fd=await open(keyPath,"wx",0o600);
  try{await fd.writeFile(candidate);await fd.sync();}finally{await fd.close();}
  await chmod(keyPath,0o600);
  return candidate;
 }catch(e){
  candidate.fill(0);
  if((e as NodeJS.ErrnoException).code==="EEXIST")return readMaster(root,false);
  throw Error("ai-vault-key-unavailable");
 }
}
async function writeExclusive(path:string,content:string){
 const fd=await open(path,"wx",0o600);
 try{await fd.writeFile(content,"utf8");await fd.sync();}
 finally{await fd.close();}
 await chmod(path,0o600);
}
export async function storeAiCredential(id:string,provider:string,revision:number,secret:string){
 const name=filename(id,revision);
 if(secret.length<8||secret.length>8192||secret!==secret.trim()||/\r|\n|\0/.test(secret))
  throw Error("ai-secret-invalid");
 const root=await directory(true),master=await readMaster(root,true);
 const plain=Buffer.from(secret,"utf8");
 try{
  const envelope=encryptAiKey(master,id,provider,revision,plain);
  // An attempted overwrite of an already committed revision always fails.
  await writeExclusive(join(root,name),JSON.stringify(envelope));
 }finally{plain.fill(0);master.fill(0);}
}
export async function loadAiCredential(id:string,provider:string,revision:number):Promise<Buffer>{
 const path=join(await directory(false),filename(id,revision));
 const stat=await lstat(path).catch(()=>null);
 if(!stat?.isFile()||stat.isSymbolicLink()||stat.size>18000||
  process.platform!=="win32"&&(stat.mode&0o077)!==0)
  throw Error("ai-secret-unavailable");
 const master=await readMaster(ROOT(),false);
 try{
  const raw=JSON.parse(await readFile(path,"utf8")) as unknown;
  return decryptAiKey(master,raw,id,provider,revision);
 }catch{throw Error("ai-secret-unavailable");}
 finally{master.fill(0);}
}
/** Revisions are unguessable only through authenticated callers, never sent to clients. */
export async function purgeAiCredentialVersions(id:string,keepRevision?:number){
 assertId(id);
 const root=await directory(false).catch((e:unknown)=>{
  if(e instanceof Error&&e.message==="ai-vault-unavailable")return null;
  throw e;
 });
 if(!root)return;
 for(const name of await readdir(root)){
  const match=new RegExp("^"+id.replace(/-/g,"\\-")+"\\.(\\d+)\\.enc$","i").exec(name);
  if(!match||Number(match[1])===keepRevision)continue;
  const path=join(root,name),stat=await lstat(path);
  if(!stat.isFile()||stat.isSymbolicLink())throw Error("ai-vault-untrusted-entry");
  await rm(path);
 }
}
