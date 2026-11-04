import assert from "node:assert/strict";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const catalogPath=resolve(root,"tests/coverage/requirements.json");
const tracePath=resolve(root,"src/lib/dashboard-builder/acceptance-traceability.ts");
export function loadRequirements(source=readFileSync(tracePath,"utf8")){
 const token="export const DASHBOARD_RX_TRACEABILITY=";
 const start=source.indexOf(token);
 if(start<0)throw Error("traceability-source-missing");
 const end=source.indexOf("] as const;",start);
 if(end<0)throw Error("traceability-source-invalid");
 return JSON.parse(source.slice(start+token.length,end+1));
}
export function checkCatalog(catalog,requirements,read=(p)=>readFileSync(resolve(root,p),"utf8")){
 const ids=new Set(Array.from({length:22},(_,i)=>"RX-"+String(i+1).padStart(2,"0")));
 assert.equal(catalog.scenarios.length,22,"22 scenarios required");
 assert.equal(new Set(catalog.scenarios.map(s=>s.id)).size,22,"duplicate RX");
 assert.ok(catalog.scenarios.every(s=>ids.has(s.id)),"unknown scenario");
 assert.equal(requirements.length,43,"33 UX + 10 MAQ");
 assert.equal(new Set(requirements.map(r=>r.requirement)).size,43,"duplicate requirements");
 for(const req of requirements)for(const id of req.scenarios)
  assert.ok(ids.has(id)&&catalog.scenarios.some(s=>s.id===id),"RX without evidence entry: "+id);
 for(const s of [...catalog.scenarios,...catalog.critical]){
  assert.ok(s.evidence&&["behavior","source"].includes(s.evidence.kind),"invalid evidence kind: "+s.id);
  assert.ok(/^tests\/[\w-]+\.test\.(?:ts|mjs)$/.test(s.evidence.file),"invalid test file: "+s.id);
  const text=read(s.evidence.file);
  assert.ok(text.includes('test("'+s.evidence.title)||text.includes("test('"+s.evidence.title),
   "missing named test contract for "+s.id+": "+s.evidence.title);
 }
 assert.equal(new Set(catalog.critical.map(s=>s.id)).size,catalog.critical.length,"duplicate critical IDs");
 return true;
}
export function parseTap(text){
 const passed=[],failed=[],skipped=[];
 for(const line of text.split(/\r?\n/)){
  const match=/^(not ok|ok)\s+\d+\s+-\s+(.+?)(?:\s+#\s+(SKIP|TODO).*)?$/.exec(line.trim());
  if(!match)continue;
  const name=match[2].trim();
  if(match[3])skipped.push(name);
  else if(match[1]==="ok")passed.push(name);
  else failed.push(name);
 }
 return {passed,failed,skipped};
}
export function reportCoverage(catalog,requirements,observed=null){
 const rows=[...catalog.scenarios,...catalog.critical].map(s=>{
  const evidence=s.evidence;
  const matched=observed?.passed.some(t=>t.startsWith(evidence.title))??false;
  const status=evidence.kind==="source"?"source-only":observed===null?"not-run":matched?"passed":"not-verified";
  return {id:s.id,status,level:evidence.kind,test:evidence.file,name:evidence.title,
   limitations:s.limitations};
 });
 const byId=new Map(rows.map(r=>[r.id,r]));
 const decisions=requirements.map(req=>{
  const statuses=req.scenarios.map(id=>byId.get(id)?.status??"missing");
  return {id:req.requirement,scenarios:req.scenarios,
   status:statuses.every(s=>s==="passed")?"behavior-pass":
    statuses.some(s=>s==="passed")?"partial":
    statuses.every(s=>s==="source-only")?"source-only":"not-verified"};
 });
 const summary={scenarios:catalog.scenarios.length,decisions:decisions.length,
  behaviorPassed:rows.filter(x=>x.status==="passed").length,
  sourceOnly:rows.filter(x=>x.status==="source-only").length,
  notVerified:rows.filter(x=>x.status==="not-verified"||x.status==="not-run").length,
  decisionBehaviorPassed:decisions.filter(x=>x.status==="behavior-pass").length,
  decisionPartial:decisions.filter(x=>x.status==="partial").length};
 return {summary,scenarios:rows.filter(r=>r.id.startsWith("RX-")),
  critical:rows.filter(r=>!r.id.startsWith("RX-")),decisions};
}
function runTests(paths){
 const command=process.platform==="win32"?"pnpm.cmd":"pnpm";
 const args=["exec","tsx","--test","--test-reporter=tap",...paths];
 const child=spawnSync(command,args,{cwd:root,encoding:"utf8",maxBuffer:24*1024*1024,
  shell:process.platform==="win32",env:{...process.env}});
 if(child.error)throw child.error;
 return {exitCode:child.status??1,tap:child.stdout??"",stderr:child.stderr??""};
}
export function main(args=process.argv.slice(2)){
 assert.ok(args.length===0||(args.length===1&&args[0]==="--run"),
  "Usage: node scripts/coverage-matrix.mjs [--run]");
 const catalog=JSON.parse(readFileSync(catalogPath,"utf8"));
 const requirements=loadRequirements();
 checkCatalog(catalog,requirements);
 let execution=null,observed=null;
 if(args[0]==="--run"){
  const files=[...new Set([...catalog.scenarios,...catalog.critical]
   .filter(x=>x.evidence.kind==="behavior").map(x=>x.evidence.file))];
  execution=runTests(files);
  observed=parseTap(execution.tap);
 }
 const report=reportCoverage(catalog,requirements,observed);
 const output=resolve(root,"audit-output/coverage-matrix.json");
 mkdirSync(dirname(output),{recursive:true});
 writeFileSync(output,JSON.stringify({
  version:1,commit:process.env.GITHUB_SHA??null,execution:{
   attempted:execution!==null,exitCode:execution?.exitCode??null,
   passedTests:observed?.passed.length??null,failedTests:observed?.failed.length??null,
   skippedTests:observed?.skipped.length??null
  },...report
 },null,2)+"\n");
 console.log("Matrice: "+output);
 console.log(JSON.stringify(report.summary));
 if(execution!==null){
  if(execution.exitCode!==0||observed.failed.length||observed.skipped.length){
   console.error(execution.stderr,execution.tap.slice(-10000));
   throw Error("Coverage evidence test execution did not pass");
  }
  const missing=[...report.scenarios,...report.critical]
   .filter(r=>r.level==="behavior"&&r.status!=="passed");
  if(missing.length)throw Error("Missing executed business evidence: "+missing.map(r=>r.id).join(", "));
 }
 return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{main();}catch(error){console.error(error);process.exitCode=1;}
}
