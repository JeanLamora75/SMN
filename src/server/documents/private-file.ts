import {createHash} from "node:crypto";
import {constants} from "node:fs";
import {open,realpath} from "node:fs/promises";
import {isAbsolute,relative,resolve,sep} from "node:path";
import {canAccess,type AccessActor} from "../access-policy";
import {validRecordId} from "../dashboard/read";

export type PrivateDocument=Readonly<{format:"PDF"|"TXT";body:Buffer;downloadName:string}>;
type Manifest={id:string;teamId:string;format:"PDF"|"TXT";userAuthorized:boolean;sha256:string};
const maxBytes=12*1024*1024;
const safeName=(id:string)=>validRecordId(id)&&id.length<=80;
async function readBounded(path:string,limit:number):Promise<Buffer>{
 const file=await open(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
 try{
  const stat=await file.stat();
  if(!stat.isFile()||stat.size<1||stat.size>limit)throw new Error("invalid-private-file");
  const bytes=await file.readFile();
  if(bytes.length!==stat.size)throw new Error("private-file-changed");
  return bytes;
 }finally{await file.close();}
}
function parseManifest(value:unknown,id:string):Manifest|null{
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 const v=value as Record<string,unknown>;
 if(v.id!==id||!safeName(v.teamId as string)||
 (v.format!=="PDF"&&v.format!=="TXT")||typeof v.userAuthorized!=="boolean"||
 typeof v.sha256!=="string"||!/^[0-9a-f]{64}$/.test(v.sha256))return null;
 return {id,teamId:v.teamId as string,format:v.format,userAuthorized:v.userAuthorized,sha256:v.sha256};
}
/**
 * Aucun contenu sous public/, aucune URL de fichier brute.
 * Les métadonnées privées sont résolues et vérifiées côté serveur seulement.
 * Si le dossier n'est pas configuré, tout téléchargement reste désactivé.
 */
export async function readPrivateDocument(rootSetting:string|undefined,id:string,activeTeamId:string,
 actor:AccessActor):Promise<PrivateDocument|null>{
 if(!rootSetting||!isAbsolute(rootSetting)||!safeName(id)||!safeName(activeTeamId))return null;
 try{
  const root=await realpath(rootSetting);
  const app=resolve(process.cwd());
  const insideApp=relative(app,root);
  if(insideApp===""||(!insideApp.startsWith(".."+sep)&&insideApp!=="..")||!isAbsolute(root))return null;
  const metadata=await readBounded(resolve(root,id+".meta.json"),2048);
  const manifest=parseManifest(JSON.parse(metadata.toString("utf8")),id);
  if(!manifest||manifest.teamId!==activeTeamId||!canAccess(actor,"download",{
    type:"documents",exists:true,inScope:true,format:manifest.format,userAuthorized:manifest.userAuthorized
  }))return null;
  const ext=manifest.format==="PDF"?"pdf":"txt";
  const body=await readBounded(resolve(root,id+"."+ext),maxBytes);
  if(createHash("sha256").update(body).digest("hex")!==manifest.sha256)return null;
  if(manifest.format==="PDF"&&!body.subarray(0,5).equals(Buffer.from("%PDF-")))return null;
  if(manifest.format==="TXT"){
    try{new TextDecoder("utf-8",{fatal:true}).decode(body);}catch{return null;}
  }
  return {format:manifest.format,body,downloadName:id+"."+ext};
 }catch{return null;}
}
