// Emplacements Office privés, créés sans écraser les documents existants.
import {mkdirSync,lstatSync,realpathSync} from "node:fs";
import path from "node:path";

export function ensureOfficeDirectories(root=process.cwd(),env=process.env){
 ensurePrivateDocumentsDirectory(root,env);
 const defaults=[
  ["SMN_OFFICE_TEMPLATES_DIR","templates"],
  ["SMN_OFFICE_REPORTS_DIR","reports"]
 ];
 for(const [key,name] of defaults){
  const configured=env[key]?.trim();
  if(configured&&!path.isAbsolute(configured))throw Error(key+" must be absolute");
  const directory=configured?path.resolve(configured):path.join(root,"data","office",name);
  mkdirSync(directory,{recursive:true});
 }
}

/** Persistent installation data, never in public/ or Next standalone app/. */
export function ensurePrivateDocumentsDirectory(root=process.cwd(),env=process.env){
 const base=path.resolve(root);
 const configured=env.SMN_PRIVATE_DOCUMENTS_DIR?.trim();
 if(configured&&!path.isAbsolute(configured))
  throw Error("SMN_PRIVATE_DOCUMENTS_DIR must be absolute");
 const dir=configured?path.resolve(configured):path.join(base,"data","documents");
 if(!configured){
  const data=path.join(base,"data");
  mkdirSync(data,{recursive:true});
  const parent=lstatSync(data);
  if(!parent.isDirectory()||parent.isSymbolicLink()||
   path.resolve(realpathSync(data))!==path.resolve(data))
   throw Error("SMN private data directory is unsafe");
 }
 mkdirSync(dir,{recursive:true});
 const stat=lstatSync(dir);
 if(!stat.isDirectory()||stat.isSymbolicLink())throw Error("SMN private documents directory is unsafe");
 return dir;
}
