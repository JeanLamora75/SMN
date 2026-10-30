import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import type {Client} from "pg";
import {translate} from "../src/i18n/catalog";
import SprintCapacityPanel from "../src/app/app/admin/sprints/[sprintId]/sprint-capacity-panel";
import {presenceFromCapacity,presenceFromSnapshot} from "../src/lib/sprint-presence";
import {mapSprintMemberMetadata,readSprintMemberMetadata} from "../src/server/sprints/presence-metadata-read";

const memberId="member-1", teamId="team-1";
const days=["2026-10-26","2026-10-27","2026-10-28"];
const report=()=>presenceFromCapacity({
 hoursPerJh:8,
 members:[{memberId,displayName:"Alex",totalJh:1.5,
  days:days.map(()=>({status:"calculated" as const,availableHalfDays:2}))}]
});
const version=(o:Partial<{
 effective_from:string;revision:number;
 scrum_master_percent:number;product_owner_percent:number;
 developer_percent:number;contribution_percent:number;
 start_on:string;end_on:string|null;professional_function:string|null
}>={})=>({
 member_id:memberId,assignment_id:"assignment-1",professional_function:"UX designer",
 start_on:"2026-10-01",end_on:null,
 effective_from:"2026-10-01",revision:1,
 scrum_master_percent:20,product_owner_percent:0,developer_percent:80,
 contribution_percent:75,...o
});
describe("Fiche Sprint — métadonnées des capacités",()=>{
 it("affiche les rôles Agile positifs uniquement, séparés par des virgules et traduits",()=>{
  const mapped=mapSprintMemberMetadata([{memberId,dates:days}], [version()]);
  assert.deepEqual(mapped.get(memberId),{
   professionalFunction:"UX designer",
   agileRoles:["scrumMaster","developer"],
   contributionPercents:[75]
  });
  const data={...report(),members:report().members.map(m=>({...m,...mapped.get(m.memberId)}))};
  const html=renderToStaticMarkup(createElement(SprintCapacityPanel,{
   data,teamId,canViewNames:true,locale:"fr",t:(key,params)=>translate("fr",key,params)
  }));
  assert.match(html,/Rôles Agile/);
  assert.match(html,/Fonction/);
  assert.match(html,/Contribution/);
  assert.match(html,/Scrum Master, Développeur/);
  assert.match(html,/UX designer/);
  assert.match(html,/75 %/);
  assert.match(html,/Présence \(J\/H\)/);
  assert.match(html,/Développement \(J\/H\)/);
 });
 it("respecte les révisions datées et garde une seule contribution si inchangée",()=>{
  const mapped=mapSprintMemberMetadata([{memberId,dates:days}], [
   version(),version({effective_from:"2026-10-27",revision:2,
    scrum_master_percent:0,product_owner_percent:100,developer_percent:0,
    contribution_percent:75})
  ]);
  assert.deepEqual(mapped.get(memberId)?.agileRoles,
   ["scrumMaster","productOwner","developer"]);
  assert.deepEqual(mapped.get(memberId)?.contributionPercents,[75]);
 });
 it("n'invente pas de rôles ni de taux sans version applicable",()=>{
  const mapped=mapSprintMemberMetadata([{memberId,dates:days}], [
   version({effective_from:"2026-11-01",revision:5})
  ]);
  assert.deepEqual(mapped.get(memberId),{
   professionalFunction:"UX designer",agileRoles:null,contributionPercents:null
  });
 });
 it("présente les changements de contribution de la période dans leur ordre réel",()=>{
  const mapped=mapSprintMemberMetadata([{memberId,dates:days}], [
   version({contribution_percent:50}),
   version({effective_from:"2026-10-27",revision:2,contribution_percent:80})
  ]);
  assert.deepEqual(mapped.get(memberId)?.contributionPercents,[50,80]);
  const data={...report(),members:report().members.map(m=>({...m,...mapped.get(m.memberId)}))};
  const html=renderToStaticMarkup(createElement(SprintCapacityPanel,{
   data,teamId,canViewNames:true,locale:"fr",t:(key,params)=>translate("fr",key,params)
  }));
  assert.match(html,/50 % → 80 %/);
 });
 it("la fiche d'un utilisateur non admin ne divulgue aucune métadonnée nominative",()=>{
  const data={...report(),members:[{...report().members[0],
   professionalFunction:"UX designer",agileRoles:["scrumMaster" as const],
   contributionPercents:[75]}]};
  const html=renderToStaticMarkup(createElement(SprintCapacityPanel,{
   data,teamId,canViewNames:false,locale:"fr",t:(key,params)=>translate("fr",key,params)
  }));
  assert.doesNotMatch(html,/Alex|UX designer|Scrum Master|75 %/);
 });
 it("valide les nouvelles métadonnées dans le snapshot, accepte les anciens",()=>{
  const baseline=report();
  const previous=presenceFromSnapshot(baseline,2);
  assert.equal(previous.state,"available");
  if(previous.state==="available")assert.equal(previous.members[0].agileRoles,undefined);
  const latest=presenceFromSnapshot({...baseline,members:[{
   ...baseline.members[0],professionalFunction:"UX designer",
   agileRoles:["scrumMaster","developer"],contributionPercents:[75]
  }]},3);
  assert.equal(latest.state,"available");
  if(latest.state==="available"){
   assert.deepEqual(latest.members[0].agileRoles,["scrumMaster","developer"]);
   assert.deepEqual(latest.members[0].contributionPercents,[75]);
  }
  assert.deepEqual(presenceFromSnapshot({...baseline,members:[{
   ...baseline.members[0],agileRoles:["administrator"]
  }]},3),{state:"unavailable",reason:"read-failed"});
 });
 it("lit les versions bornées aux membres de l'équipe et aux dates du Sprint sans écriture",async()=>{
  const queries:{sql:string;params:unknown[]}[]=[];
  const db={query:async(sql:string,params:unknown[])=>{
   queries.push({sql,params});
   return {rows:[version()]};
  }} as unknown as Client;
  const attributes=await readSprintMemberMetadata(db,teamId,"2026-10-26","2026-10-28",
   [{memberId,dates:days}]);
  assert.equal(attributes.get(memberId)?.professionalFunction,"UX designer");
  assert.equal(queries.length,1);
  assert.deepEqual(queries[0].params,[teamId,[memberId],"2026-10-26","2026-10-28"]);
  assert.match(queries[0].sql,/m\.professional_function/);
  assert.match(queries[0].sql,/a\.team_id=\$1/);
  assert.match(queries[0].sql,/a\.member_id=ANY\(\$2::text\[\]\)/);
  assert.ok(!/\b(?:INSERT|UPDATE|DELETE|ALTER|CREATE)\b/i.test(queries[0].sql));
 });
 it("conserve la protection serveur des données nominatives et des anciens schémas",()=>{
  const get=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8") as string;
  const page=get("src/app/app/admin/sprints/[sprintId]/page.tsx");
  const reader=get("src/server/sprints/presence-detail-read.ts");
  assert.match(page,/active==="capacity"&&canViewMembers\?/);
  assert.match(page,/data=\{canViewMembers\?presence:null\}/);
  assert.match(reader,/SAVEPOINT smn_presence_metadata/);
  assert.match(reader,/ROLLBACK TO SAVEPOINT smn_presence_metadata/);
  assert.match(reader,/return enriched/);
  assert.doesNotMatch(reader,/CREATE TABLE|ALTER TABLE|INSERT INTO public/);
 });

});
