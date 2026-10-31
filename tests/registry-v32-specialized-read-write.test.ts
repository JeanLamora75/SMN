import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
for(const endpoint of ["relations","roam","assessment","relation-candidates"]){
 test("v32 "+endpoint+" uses scoped record access, not v27 legacy gate",()=>{
  const s=read("src/app/api/admin/registries/[id]/"+endpoint+"/route.ts");
  assert.match(s,/authorizeRegistryRecord/);
  assert.match(s,/withSprintIndexDb/);
  assert.doesNotMatch(s,/withLegacyTeamApi|withLegacyRegistryReadDb/);
 });
}
test("core team authorization rejects records outside resolved team",()=>{
 const s=read("src/server/registries/scoped-record.ts");
 assert.match(s,/resolveRegistryReadContext/);
 assert.match(s,/r\.team_id=\$2/);
 assert.match(s,/t\.installation_id='singleton'/);
});
