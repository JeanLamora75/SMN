import {readdir,readFile} from "node:fs/promises";
import {join,relative} from "node:path";
const root=join(process.cwd(),"src","app","api");
const results=[];
async function walk(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const file=join(directory,entry.name);
  if(entry.isDirectory()){await walk(file);continue;}
  if(entry.name!=="route.ts")continue;
  const source=await readFile(file,"utf8");
  if(!/export async function (POST|PUT|PATCH|DELETE)/.test(source))continue;
  const scoped=/resolveAdminTeam|resolveRegistryReadContext|saveTeamAssignmentRevision|saveMemberAbsence|saveTeamActualCapacity|createTeamMeeting|changeTeamMeeting|createScopedSprint|createScopedKanbanPeriod/.test(source);
  const legacy=/withLegacyTeamApi|assertLegacyTeamApi/.test(source);
  const gate=/MULTI_TEAM_CONTEXT_READY|SMN_MULTI_TEAM_WRITES_ENABLED/.test(source);
  const auth=/authorizeApi/.test(source);
  const path=relative(process.cwd(),file).replaceAll("\\","/");
  results.push({path,scoped,legacy,gate,auth,review:!auth||(!scoped&&!legacy)||(!gate&&!legacy)});
 }
}
await walk(root);
results.sort((a,b)=>a.path.localeCompare(b.path));
console.log(JSON.stringify({count:results.length,requiresReview:results.filter(x=>x.review).length,results},null,2));
console.error("Inventaire statique : les routes listées requièrent une vérification métier et transactionnelle, pas une activation automatique.");
