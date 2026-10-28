import {readdir,readFile} from "node:fs/promises";
import {join,relative} from "node:path";
const root=join(process.cwd(),"src","app","api");
const results=[];
function classify(path,source){
 const auth=/authorizeApi/.test(source);
 const legacy=/withLegacyTeamApi|assertLegacyTeamApi|withLegacyMemberApi|withLegacyRegistryReadDb/.test(source);
 const scoped=/resolveAdminTeam|resolveRegistryReadContext|resolveTeamMember|saveTeamAssignmentRevision|saveMemberAbsence|saveTeamActualCapacity|createTeamMeeting|changeTeamMeeting|createScopedSprint|createScopedKanbanPeriod/.test(source);
 const gate=/MULTI_TEAM_CONTEXT_READY|SMN_MULTI_TEAM_WRITES_ENABLED/.test(source);
 const family=path.includes("/api/auth/")||path.includes("/api/setup/")||path.includes("/api/bootstrap/")?"authentication-setup":
  /\/api\/admin\/(?:countries|backups|accounts|settings|configuration-tasks)\//.test(path)?"installation-global":
  /\/api\/admin\/(?:registries|reports|sprints|kanban-periods|members|capacity|team-)/.test(path)?"team-business":"other";
 // Classification of evidence, not a security certification.
 const status=legacy?"legacy-guarded":
  scoped&&gate?"scoped-gated":
  family==="authentication-setup"?"separate-auth-review":
  family==="installation-global"?"global-scope-review":
  scoped?"scoped-needs-review":"unverified-business";
 const priority=status==="unverified-business"&&family==="team-business"?"high":
  status==="scoped-needs-review"?"high":
  status==="legacy-guarded"||status==="scoped-gated"?"verify-tests":"normal";
 return {path,family,scoped,legacy,gate,auth,status,priority,review:priority==="high"};
}
async function walk(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const file=join(directory,entry.name);
  if(entry.isDirectory()){await walk(file);continue;}
  if(entry.name!=="route.ts")continue;
  const source=await readFile(file,"utf8");
  if(!/export async function (POST|PUT|PATCH|DELETE)/.test(source))continue;
  const path=relative(process.cwd(),file).replaceAll("\\","/");
  results.push(classify(path,source));
 }
}
await walk(root);
results.sort((a,b)=>a.path.localeCompare(b.path));
const counts=Object.fromEntries([...new Set(results.map(x=>x.status))].sort().map(status=>
 [status,results.filter(x=>x.status===status).length]));
console.log(JSON.stringify({count:results.length,requiresReview:results.filter(x=>x.review).length,
 statusCounts:counts,results},null,2));
console.error("Classification heuristique : analyser les services, SQL et transactions avant toute activation.");
