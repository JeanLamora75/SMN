import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {readCycleRegistry,readCycleNotesAndAlerts} from "../src/server/dashboard/attention-reader";
import {createDashboardNote} from "../src/server/dashboard/notes";
import {parseRegistryInput} from "../src/server/registries/items";

function fake(handler:(sql:string,args:unknown[])=>unknown[]){
 const history:{sql:string;args:unknown[]}[]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  history.push({sql,args});return {rows:handler(sql,args),rowCount:1};
 }} as unknown as Client;
 return {db,history};
}
test("risques et obstacles existants sont projetés selon l'équipe et le Sprint, sans statut clos",async()=>{
 const saved=fake((sql,args)=>{
  if(sql.includes("to_regclass"))return [{present:args[0]==="public.smn_registry_item"}];
  if(sql.includes("COUNT(*)"))return [{total:7}];
  if(sql.includes("SELECT r.id,r.title"))return Array.from({length:5},(_,i)=>({
   id:"registry-"+i,title:"Risque "+i,status:"open",scope:"team"
  }));
  throw Error("SQL inattendu");
 });
 const r=await readCycleRegistry(saved.db,"team-a","cycle-a","risk");
 assert.equal(r.state,"available");
 if(r.state==="available"){
  assert.equal(r.total,7);assert.equal(r.items.length,5);
  assert.equal(r.items[0].title,"Risque 0");
  assert.equal(r.items[0].scope,"team");
  assert.match(r.items[0].href??"",/registries\/registry-0$/);
 }
 const query=saved.history.find(q=>q.sql.includes("COUNT(*)"));
 assert.deepEqual(query?.args,["team-a","risk",["resolved"]]);
 assert.match(query?.sql??"",/r\.status<>ALL/);
 assert.match(query?.sql??"",/r\.team_id/);
 assert.ok(!saved.history.some(q=>/CREATE|INSERT|UPDATE|DELETE/i.test(q.sql)));
});

test("notes de Sprint et alertes globales : À faire alertes, Terminées informations, Ignorées exclues",async()=>{
 const saved=fake((sql,args)=>{
  if(sql.includes("to_regclass"))return [{present:true}];
  if(sql.includes("FROM public.smn_dashboard_note"))return [
   {id:"note-1",body:"Décision de Sprint",status:"open"}
  ];
  if(sql.includes("FROM public.smn_configuration_task"))return [
   {task_key:"reference-country",status:"todo"},
   {task_key:"recovery-phrase",status:"done"},
   {task_key:"display-preferences",status:"done"}
  ];
  throw Error("SQL inattendu");
 });
 const result=await readCycleNotesAndAlerts(saved.db,"team-a","cycle-a");
 assert.equal(result.state,"available");
 if(result.state==="available"){
  assert.equal(result.total,4);
  assert.deepEqual(result.items.map(x=>x.kind),["alert","note","note","note"]);
  assert.equal(result.items[0].configurationKey,"reference-country");
  assert.equal(result.items[1].title,"Décision de Sprint");
  assert.equal(result.items[2].status,"done");
 }
 assert.ok(saved.history.some(q=>q.sql.includes("n.sprint_id=$2")&&q.args[1]==="cycle-a"));
});
test("la note exige un Sprint et une équipe et conserve un audit",async()=>{
 assert.equal((await createDashboardNote(fake(()=>[]).db,"",{})).ok,false);
 const inputs:{[key:string]:unknown}={
  sprintId:"123e4567-e89b-42d3-a456-426614174000",teamId:"team-a",text:" À surveiller "
 };
 const saved=fake(sql=>{
  if(sql.includes("to_regclass"))return [{ready:true}];
  if(sql.includes("SELECT s.id"))return [{id:inputs.sprintId}];
  return [];
 });
 const r=await createDashboardNote(saved.db,"actor-a",inputs);
 assert.equal(r.ok,true);
 assert.ok(!saved.history.some(q=>/\\bCREATE\\s+TABLE\\b/i.test(q.sql)));
 assert.ok(saved.history.some(q=>q.sql.includes("smn_dashboard_note_audit")));
 assert.ok(saved.history.some(q=>q.sql.includes("INSERT INTO public.smn_dashboard_note(")&&q.args[3]==="À surveiller"));
 assert.equal(saved.history.at(-1)?.sql,"COMMIT");
});
test("le formulaire du registre lie atomiquement le risque ou obstacle au Sprint",()=>{
 const raw={type:"obstacle",title:"Blocage",teamId:"team-a",
  cycleId:"123e4567-e89b-42d3-a456-426614174000",occurredOn:"2026-10-24",
  status:"open",description:null,owner:null,dueOn:null,comment:null};
 const parsed=parseRegistryInput(raw);
 assert.equal(parsed?.cycleId,raw.cycleId);
 assert.equal(parseRegistryInput({...raw,cycleId:"other-sprint"}),null);
 assert.equal(parseRegistryInput({...raw,type:"decision"}),null);
});
