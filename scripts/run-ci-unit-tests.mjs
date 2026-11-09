import {readdirSync,writeFileSync,mkdirSync} from "node:fs";
import {join} from "node:path";
import {spawnSync} from "node:child_process";

/**
 * The portable unit suite is platform-neutral. PostgreSQL integration tests
 * are executed in their dedicated PG18 workflows, NOT against the live SMN DB
 * or an arbitrary CI URL. This runner never silently skips a failing test.
 */
const pgOnly=/(?:postgres|(?:^|-)pg\.test|smn-338-(native|real|v33-upgrade)|smn-dashboard-bmad-pg|smn-333-v31-v32|smn-355-dashboard-layout-pg)/i;
const explicitPg=new Set(["epic2-lot1-native-v33.test.ts"]);
const args=new Set(process.argv.slice(2));
if([...args].some(a=>!["--list","--run"].includes(a))||args.size!==1)
 throw Error("Usage: node scripts/run-ci-unit-tests.mjs --list|--run");
const all=readdirSync("tests").filter(s=>/\.test\.(?:ts|mjs)$/.test(s)).sort();
const omitted=all.filter(s=>pgOnly.test(s)||explicitPg.has(s));
const selected=all.filter(s=>!omitted.includes(s));
if(selected.length<300||!omitted.includes("epic2-lot1-native-v33.test.ts"))
 throw Error("ci-unit-suite-inventory-unexpected");
if(args.has("--list")){
 process.stdout.write(JSON.stringify({selected:selected.map(s=>"tests/"+s),postgresIsolated:omitted.map(s=>"tests/"+s)})+"\n");
 process.exit(0);
}
mkdirSync("audit-output",{recursive:true});
writeFileSync(join("audit-output","ci-unit-suite.json"),JSON.stringify({
 total:all.length,unitFiles:selected,postgresOnlyFiles:omitted,
 policy:"PostgreSQL-only suites are exercised by dedicated PostgreSQL 18 workflows."
},null,2)+"\n");
let failed=0;
for(let start=0;start<selected.length;start+=40){
 const files=selected.slice(start,start+40).map(s=>"tests/"+s);
 process.stdout.write("CI unit suite "+(start+1)+"-"+(start+files.length)+"/"+selected.length+"\n");
 const result=spawnSync(process.platform==="win32"?"pnpm.cmd":"pnpm",
  ["exec","tsx","--test",...files],{
   cwd:process.cwd(),env:{...process.env,CI:"false"},
   stdio:"inherit",shell:process.platform==="win32"
  });
 if(result.status!==0){failed++;
  process.stderr.write("CI unit batch failed at index "+start+": "+(result.error?.message??result.status)+"\n");}
}
if(failed){
 process.stderr.write("CI unit batches failed: "+failed+"\n");
 process.exitCode=1;
}
