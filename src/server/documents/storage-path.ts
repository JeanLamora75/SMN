import {lstat,realpath} from "node:fs/promises";
import {isAbsolute,join,relative,resolve,sep} from "node:path";

/** Installation-owned private documents: root/data/documents, never public/. */
export function installedPrivateDocumentsDirectory(
 configured=process.env.SMN_PRIVATE_DOCUMENTS_DIR,
 root=process.cwd()
):string{
 if(configured?.trim()){
  if(!isAbsolute(configured))throw Error("smn-private-documents-path-invalid");
  return resolve(configured);
 }
 return join(resolve(root),"data","documents");
}
export function isInstalledPrivateDocumentDirectory(
 directory:string,root=process.cwd()
):boolean{
 return resolve(directory)===join(resolve(root),"data","documents");
}
/**
 * Reject symlinked installation-owned storage and data parent. Existing
 * explicitly configured out-of-installation directories remain supported.
 */
export async function validatePrivateDocumentDirectory(
 directory:string,root=process.cwd()
):Promise<void>{
 const path=resolve(directory);
 if(!isAbsolute(directory))throw Error("smn-private-documents-path-invalid");
 const app=resolve(root);
 const inside=relative(app,path);
 const dedicated=isInstalledPrivateDocumentDirectory(path,app);
 const outside=inside!==""&&(inside===".."||
  inside.startsWith(".."+sep)||isAbsolute(inside));
 if(!dedicated&&!outside)throw Error("smn-private-documents-path-unsafe");
 const stat=await lstat(path);
 if(!stat.isDirectory()||stat.isSymbolicLink())
  throw Error("smn-private-documents-path-unsafe");
 if(dedicated){
  const data=join(app,"data");
  const parent=await lstat(data);
  // Windows temporary roots can be junctions or canonicalized aliases
  // (short names, volume casing). Compare the child with its resolved
  // physical parent, not against the user-facing lexical path.
  const physicalPath=await realpath(path),physicalParent=await realpath(data);
  const expectedPhysical=join(physicalParent,"documents");
  const equal=(a:string,b:string)=>process.platform==="win32"?
   resolve(a).toLowerCase()===resolve(b).toLowerCase():
   resolve(a)===resolve(b);
  if(!parent.isDirectory()||parent.isSymbolicLink()||
   !equal(physicalPath,expectedPhysical))
   throw Error("smn-private-documents-path-unsafe");
 }
}
