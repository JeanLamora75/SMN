import {readdir,lstat,readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import path from "node:path";

export const ROOT_DIRS=Object.freeze(["app","runtime","data","updates"]);
export const ROOT_FILES=Object.freeze(["Demarrer SMN.bat"]);
const forbidden=new Set([
 ".agents",".git",".github","_bmad","_bmad-output","docs","src","tests",
 ".env",".env.local",".env.example",".gitignore","eslint.config.mjs",
 "tsconfig.json","next.config.ts","prisma.config.ts","pnpm-lock.yaml",
 "pnpm-workspace.yaml","README.md","node.exe","server.js","package.json"
]);
const buildJunk=new Set([".git",".github",".agents","_bmad","_bmad-output",
 "tests","docs","src",".env",".env.local",".env.example"]);
export async function auditWindowsDistribution(root){
 const listed=await readdir(root);
 const allowed=new Set([...ROOT_DIRS,...ROOT_FILES]);
 if(listed.length!==allowed.size||
   listed.some(name=>!allowed.has(name))||
   [...allowed].some(name=>!listed.includes(name)))
  throw Error("distribution-root-not-minimal");
 for(const name of ROOT_DIRS){
  const stat=await lstat(path.join(root,name));
  if(!stat.isDirectory()||stat.isSymbolicLink())
   throw Error("distribution-root-unsafe");
 }
 const batch=await lstat(path.join(root,ROOT_FILES[0]));
 if(!batch.isFile()||batch.isSymbolicLink())throw Error("distribution-launcher-unsafe");
 const text=await readFile(path.join(root,ROOT_FILES[0]),"utf8");
 if(!text.includes("runtime\\node\\node.exe")||
    !text.includes("runtime\\launcher.mjs"))
  throw Error("distribution-launcher-incomplete");
 const paths=[],top=new Map(),hash=createHash("sha256");
 async function walk(folder,relative){
  for(const name of (await readdir(folder)).sort()){
   if(((relative===""||relative==="app")&&buildJunk.has(name)) ||
      (relative===""&&forbidden.has(name)))
    throw Error("distribution-development-content");
   const absolute=path.join(folder,name);
   const info=await lstat(absolute);
   if(info.isSymbolicLink())throw Error("distribution-symlink");
   const item=relative?relative+"/"+name:name;
   if(info.isDirectory()){await walk(absolute,item);continue;}
   if(!info.isFile())throw Error("distribution-special-file");
   paths.push(item);
   hash.update(item+" "+info.size+"\n");
   const parent=item.split("/")[0];
   top.set(parent,(top.get(parent)??0)+info.size);
  }
 }
 await walk(root,"");
 if(!paths.includes("app/server.js")||!paths.includes("runtime/node/node.exe")||
    !paths.includes("runtime/launcher.mjs")||
    !paths.includes("app/distribution-version.json"))
  throw Error("distribution-runtime-incomplete");
 return {fileCount:paths.length,inventoryFingerprint:hash.digest("hex"),
  byRoot:[...top].sort((a,b)=>b[1]-a[1]).map(([folder,bytes])=>({folder,bytes})),
  files:paths};
}
