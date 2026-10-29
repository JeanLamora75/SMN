import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {assertLegacyMemberApi,requireTeamMemberScope}
 from "../src/server/members/team-scope";
import {assertLegacyTeamApi} from "../src/server/teams/legacy";

const mock=(version?:number)=>{
 const statements:Array<{sql:string;params:unknown[]}>= [];
 const db={query:async(sql:string,params:unknown[]=[])=>{
  statements.push({sql,params});
  if(sql.includes("FROM public.smn_installation")&&!sql.includes("JOIN"))
   return {rows:version===undefined?[]:[{schema_version:version}]};
  return {rows:[]};
 }} as unknown as Client;
 return {db,statements};
};
test("API membre historique : v27 autorisée et v28 refusée",async()=>{
 await assert.doesNotReject(()=>assertLegacyMemberApi(mock(27).db));
 await assert.rejects(()=>assertLegacyMemberApi(mock(28).db),/member-api-team-isolation-pending/);
 await assert.rejects(()=>assertLegacyMemberApi(mock().db),/member-api-team-isolation-pending/);
 await assert.rejects(()=>assertLegacyMemberApi(mock(29).db),/member-api-team-isolation-pending/);
});
test("API équipe historique : v27 autorisée et v28 refusée",async()=>{
 await assert.doesNotReject(()=>assertLegacyTeamApi(mock(27).db));
 await assert.rejects(()=>assertLegacyTeamApi(mock(28).db),/team-api-context-isolation-pending/);
 await assert.rejects(()=>assertLegacyTeamApi(mock().db),/team-api-context-isolation-pending/);
});
test("résolution individuelle v28 : rôle user ou identifiant forgé refusé",async()=>{
 const m=mock(28);
 await assert.rejects(()=>requireTeamMemberScope(m.db,
  {accountId:"user",role:"user"},"not-uuid","team_a"),/member-id-invalid/);
 const uuid="123e4567-e89b-42d3-a456-426614174000";
 await assert.rejects(()=>requireTeamMemberScope(m.db,
  {accountId:"user",role:"user"},uuid,"team_a"),/team-access-forbidden/);
 assert.equal(m.statements.length,0);
});
test("résolution individuelle v28 : refus si affectation absente",async()=>{
 const uuid="123e4567-e89b-42d3-a456-426614174000";
 const sqls:Array<{sql:string;params:unknown[]}>= [];
 const db={query:async(sql:string,params:unknown[]=[])=>{
  sqls.push({sql,params});
  if(sql.includes("SELECT a.installation_id,i.schema_version"))return {
   rows:[{installation_id:"singleton",schema_version:28}]
  };
  if(sql.includes("SELECT p.id AS product_id"))return {
   rows:[{product_id:null,product:null,team_id:"team_a",team:"Koala",mode:"scrum"}]
  };
  return {rows:[]};
 }} as unknown as Client;
 await assert.rejects(()=>requireTeamMemberScope(db,
  {accountId:"admin",role:"admin"},uuid,"team_a"),/member-out-of-team/);
 const membership=sqls.find(x=>x.sql.includes("FROM public.smn_member_assignment a"));
 assert.deepEqual(membership?.params,[uuid,"team_a"]);
 assert.match(membership!.sql,/a.team_id=\$2/);
 assert.match(membership!.sql,/t.installation_id='singleton'/);
});
test("routes individuelles : anciennes fonctions d'accès toutes couvertes",()=>{
 const files=[
  "src/app/api/admin/members/[id]/route.ts",
  "src/app/api/admin/members/[id]/absences/route.ts",
  "src/app/api/admin/members/[id]/calendar/route.ts",
  "src/app/api/admin/members/[id]/assignment/route.ts",
  "src/app/api/admin/members/[id]/history/route.ts",
  "src/app/api/admin/members/[id]/identity/route.ts",
  "src/app/api/admin/members/[id]/location/route.ts",
  "src/app/api/admin/members/[id]/lifecycle/route.ts",
  "src/app/api/admin/members/[id]/assignment/start-date/route.ts"
 ];
 for(const file of files){
  const content=readFileSync(new URL("../"+file,import.meta.url),"utf8");
  assert.match(content,/withLegacyMemberApi\(/,file);
  assert.doesNotMatch(content,/withAuthDb\(/,file);
 }
 const context=readFileSync(new URL("../src/app/api/admin/team-context/route.ts",import.meta.url),"utf8");
 assert.match(context,/resolveRegistryReadContext\(db/);
 assert.match(context,/context\.team\?\.team_id!==teamId/);
});
test("routes capacités et détails de réunion : garde v28",()=>{
 const files=[
  "src/app/api/admin/capacity-openings/route.ts",
  "src/app/api/admin/capacity-history/route.ts",
  "src/app/api/admin/capacity-replanning/route.ts",
  "src/app/api/team-calendar/meetings/[kind]/[id]/route.ts",
  "src/app/api/team-calendar/meetings/[kind]/[id]/outcomes/route.ts",
  "src/app/api/admin/kanban-meetings/route.ts",
 ];
 for(const file of files){
  const content=readFileSync(new URL("../"+file,import.meta.url),"utf8");
  assert.match(content,/withLegacyTeamApi\(/,file);
  assert.doesNotMatch(content,/withAuthDb\(/,file);
 }
});
