// Emplacements Office privés, créés sans écraser les documents existants.
import {mkdirSync} from "node:fs";
import path from "node:path";

export function ensureOfficeDirectories(root=process.cwd(),env=process.env){
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
