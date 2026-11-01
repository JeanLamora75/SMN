import {readdirSync,readFileSync} from "node:fs";
import {join,relative,resolve} from "node:path";

export const legacyRelations=[
 "smn_sprint_story_points","smn_sprint_ticket_counts",
 "smn_sprint_story_points_audit","smn_sprint_ticket_counts_audit"
] as const;
export type Dependency={file:string;line:number;relation:string;classification:"runtime-blocker"|"historical-compatibility"|"migration-or-test";excerpt:string};
const scanning=["src","scripts","tests","prisma/migrations"] as const;
const extension=/\.(?:ts|tsx|mjs|js|sql)$/;
const skip=new Set(["node_modules",".next",".git","dist","build"]);
export function classifyDependency(path:string):Dependency["classification"]{
 if(path.startsWith("tests/")||path.startsWith("prisma/migrations/")||path.startsWith("scripts/"))
  return "migration-or-test";
 if(path.startsWith("src/server/sprints/")||path.startsWith("src/server/reports/")||path.startsWith("src/app/api/"))
  return "runtime-blocker";
 return "historical-compatibility";
}
export function scanLegacyDependencies(root=process.cwd()):Dependency[]{
 const files:string[]=[];
 function walk(dir:string){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
   if(skip.has(entry.name))continue;
   const abs=join(dir,entry.name);
   if(entry.isDirectory())walk(abs);
   else if(entry.isFile()&&extension.test(entry.name))files.push(abs);
  }
 }
 for(const folder of scanning)walk(resolve(root,folder));
 const findings:Dependency[]=[];
 for(const file of files){
  const path=relative(root,file).split(String.fromCharCode(92)).join("/");
  const lines=readFileSync(file,"utf8").split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
   for(const relation of legacyRelations){
    if(lines[i].includes(relation))findings.push({file:path,line:i+1,relation,
      classification:classifyDependency(path),excerpt:lines[i].trim().slice(0,180)});
   }
  }
 }
 return findings.sort((a,b)=>a.file.localeCompare(b.file)||a.line-b.line||a.relation.localeCompare(b.relation));
}
export function auditApplicationDependencies(root=process.cwd()){
 const references=scanLegacyDependencies(root);
 const runtimeBlockers=references.filter(x=>x.classification==="runtime-blocker");
 return {authorizedForDrop:false,relations:[...legacyRelations],references,runtimeBlockers,
  blocking:["active-runtime-references","historical-migration-proof-not-verified"]};
}
async function main(){
 if(process.argv.slice(2).join(" ")!=="--check")throw Error("Usage: pnpm db:audit:smn-351 --check");
 const report=auditApplicationDependencies();
 console.log(JSON.stringify(report,null,2));
 if(report.runtimeBlockers.length||report.blocking.length)process.exitCode=2;
}
if(process.argv[1]?.replaceAll(String.fromCharCode(92),"/").endsWith("/smn-351-app-dependencies.ts"))
 main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1});
