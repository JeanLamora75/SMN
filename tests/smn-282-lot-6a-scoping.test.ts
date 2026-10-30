import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {listTeamMembers} from "../src/server/members/quick-create";
import {readDevelopmentCapacity} from "../src/server/capacity/engine";
import {readTeamCalendar,type TeamCalendarQuery} from "../src/server/members/team-calendar";

test("membres v28 : liste filtrée par affectation à l'équipe demandée",async()=>{
 const seen:{sql:string;args:unknown[]}[]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  seen.push({sql,args});return {rows:[]};
 }} as unknown as Client;
 const members=await listTeamMembers(db,{id:"panda",name:"Panda",mode:"scrum"});
 assert.deepEqual(members,{team:{id:"panda",name:"Panda",mode:"scrum"},members:[]});
 assert.equal(seen.length,1);
 assert.deepEqual(seen[0].args,["panda"]);
 assert.match(seen[0].sql,/WHERE a.member_id=m.id AND a.team_id=\$1/);
 assert.match(seen[0].sql,/x.member_id=m.id AND x.team_id=\$1/);
});
test("membres monoéquipe : lecteur historique refuse la structure v28",async()=>{
 const seen:string[]=[];
 const db={query:async(sql:string)=>{
  seen.push(sql);return {rows:[]};
 }} as unknown as Client;
 await assert.rejects(()=>listTeamMembers(db),/members-team-unavailable/);
 assert.match(seen[0],/schema_version<=27/);
});
test("capacité v28 : teamId est exigé explicitement dans le calcul",async()=>{
 const seen:{sql:string;args:unknown[]}[]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  seen.push({sql,args});
  if(sql.startsWith("SELECT t.id,t.name,i.mode"))return {rows:[]};
  return {rows:[]};
 }} as unknown as Client;
 await assert.rejects(()=>readDevelopmentCapacity(db,"2026-10-01","2026-10-31",
  {teamId:"panda"}),/capacity-team-unavailable/);
 assert.ok(seen.some(v=>/i\.schema_version\s*(?:BETWEEN\\s+28\\s+AND\\s+32|=28)/.test(v.sql)&&
  v.sql.includes("t.id=$1")&&v.args[0]==="panda"));
 assert.equal(seen.at(-1)?.sql,"ROLLBACK");
});
test("capacité v27 : un lecteur sans contexte ne peut ouvrir la base 28",async()=>{
 const queries:string[]=[];
 const db={query:async(sql:string)=>{
  queries.push(sql);return {rows:[]};
 }} as unknown as Client;
 await assert.rejects(()=>readDevelopmentCapacity(db,"2026-10-01","2026-10-31"),
  /capacity-team-unavailable/);
 assert.ok(queries.some(s=>s.includes("i.schema_version<=27")));
});
test("calendrier v28 : équipe autorisée passée au service, sans SELECT arbitraire",async()=>{
 const queries:string[]=[];
 const db={query:async(sql:string)=>{
  queries.push(sql);throw Error("stop-at-assignment");
 }} as unknown as Client;
 const query:TeamCalendarQuery={
  start:"2026-10-26",days:7,teamId:"panda",
  memberId:null,categoryId:null,kind:"all"
 };
 await assert.rejects(()=>readTeamCalendar(db,query,true,
  {id:"panda",name:"Panda",mode:"kanban"}),/stop-at-assignment/);
 assert.equal(queries.length,1);
 assert.match(queries[0],/WHERE a.team_id=\$1/);
});
test("contrats API v28 : équipe filtrée pour capacités, périodes, réunions et membres",()=>{
 const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
 const checks=[
  ["src/app/api/admin/members/route.ts",/resolveAdminTeam/],
  ["src/app/api/admin/development-capacity/route.ts",/resolveAdminTeam/],
  ["src/app/api/team-calendar/route.ts",/resolveAdminTeam/],
  ["src/app/api/team-calendar/periods/route.ts",/resolveAdminTeam/],
  ["src/app/api/team-calendar/meetings/route.ts",/resolveAdminTeam/]
 ] as const;
 for(const [path,pattern] of checks)assert.match(source(path),pattern);
 assert.match(source("src/server/kanban/meetings.ts"),/listScopedKanbanCalendarMeetings/);
 assert.match(source("src/app/app/team-calendar/team-calendar-view.tsx"),/initialTeamId/);
 assert.match(source("src/app/app/admin/members/team-overview.tsx"),/initialTeamId/);
});
