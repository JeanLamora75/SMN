import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import type {TeamContextRow} from "../src/server/teams/resolve";
import {readCenter,readTeamCenter} from "../src/server/reports/center";

const team:TeamContextRow={team_id:"panda",team:"Panda",product_id:null,
 product:null,mode:"scrum"};
function fixture(version=28){
 const queries:{sql:string;params:unknown[]}[]=[];
 const db={query:async(sql:string,params:unknown[]=[])=>{
  queries.push({sql,params});
  if(sql.includes("SELECT schema_version FROM public.smn_installation"))
   return {rows:[{schema_version:version}]};
  if(sql.includes("SELECT t.id FROM public.smn_team t")&&
     sql.includes("i.schema_version IN (28,29,30,31)"))return {rows:[{id:"panda"}]};
  if(sql.includes("SELECT s.id,s.name FROM public.smn_sprint s"))
   return {rows:[{id:"sprint_panda",name:"Sprint Panda"}]};
  if(sql.includes("to_regclass('public.smn_report_pdf_archive')"))return {rows:[{present:false}]};
  if(sql.includes("to_regclass('public.smn_report_document')"))
   return {rows:[{present:true}]};
  if(sql.includes('d.sprint_id AS "sprintId"'))
   return {rows:[{id:"report_panda",sprintId:"sprint_panda",
    sprintName:"Sprint Panda",title:"Rapport Panda",
    templateId:"standard",templateVersion:1,language:"fr",
    status:"draft",updatedAt:"2026-10-27T08:00:00Z"}]};
  if(sql.includes("to_regclass('public.smn_report_template')"))
   return {rows:[{exists:false}]};
  throw Error("Unexpected query "+sql);
 }} as unknown as Client;
 return {db,queries};
}
test("v28 : documents et cycles filtrés par même teamId, sans archive globale",async()=>{
 const f=fixture();
 const result=await readTeamCenter(f.db,team);
 assert.deepEqual(result.cycles,[{id:"sprint_panda",name:"Sprint Panda"}]);
 assert.equal(result.documents.length,1);
 assert.deepEqual(result.archives,[]);
 assert.ok(result.templates.length>=1);
 const scope=f.queries.find(x=>x.sql.includes("i.schema_version IN (28,29,30,31)"));
 const cycle=f.queries.find(x=>x.sql.includes("SELECT s.id,s.name"));
 const doc=f.queries.find(x=>x.sql.includes('d.sprint_id AS "sprintId"'));
 assert.deepEqual(scope?.params,["panda"]);
 assert.deepEqual(cycle?.params,["panda"]);
 assert.deepEqual(doc?.params,["panda"]);
 assert.match(doc!.sql,/d.team_id=\$1/);
 assert.match(doc!.sql,/s.team_id=d.team_id/);
 assert.ok(f.queries.some(x=>x.sql.includes("to_regclass(\'public.smn_report_pdf_archive\')")));
});
test("mode Kanban : aucune archive ou document Scrum présenté",async()=>{
 const f=fixture();
 const result=await readTeamCenter(f.db,{...team,mode:"kanban"});
 assert.deepEqual(result.documents,[]);
 assert.deepEqual(result.cycles,[]);
 assert.deepEqual(result.archives,[]);
 assert.equal(f.queries.length,0);
});
test("si l'équipe n'est plus sur l'installation, refuser plutôt que basculer",async()=>{
 const db={query:async()=>({rows:[]})} as unknown as Client;
 await assert.rejects(()=>readTeamCenter(db,team),/report-team-unavailable/);
});
test("v28 : centre historique ne peut plus lire les documents de toutes les équipes",async()=>{
 const f=fixture(28);
 await assert.rejects(()=>readCenter(f.db,"admin","admin"),/team-api-context-isolation-pending/);
 assert.equal(f.queries.length,1);
});
