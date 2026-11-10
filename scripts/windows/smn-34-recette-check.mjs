/**
 * SMN-34: printable REC-01..14 checklist and strictly read-only validation.
 * From Windows without an IDE:
 *   node scripts/windows/smn-34-recette-check.mjs --template
 *   node scripts/windows/smn-34-recette-check.mjs --check <local-private-json>
 * No writes, network, restoration or authorization.
 */
import {readFile,lstat} from "node:fs/promises";
import {resolve,isAbsolute} from "node:path";
import {emptyRecette,inspectRecetteEvidence} from "./smn-34-recette-contract.mjs";
const args=process.argv.slice(2);
async function run(){
 if(args.length===1&&args[0]==="--template"){
  process.stdout.write(JSON.stringify(emptyRecette(),null,2)+"\n");
  return;
 }
 if(args.length!==2||args[0]!=="--check"||!isAbsolute(args[1])||
  args[1]!==resolve(args[1]))throw Error("invalid-recette-arguments");
 const stat=await lstat(args[1]);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size<2||stat.size>100*1024)
  throw Error("untrusted-recette-file");
 const json=JSON.parse(await readFile(args[1],"utf8"));
 const report=inspectRecetteEvidence(json);
 process.stdout.write(JSON.stringify(report,null,2)+"\n");
 // A structurally complete report still cannot authorize an offline restore.
 process.exitCode=2;
}
run().catch(()=>{
 process.stderr.write("SMN-34 recette checklist unavailable; no restore performed.\n");
 process.exitCode=2;
});
