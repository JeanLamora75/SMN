import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {readAdminActiveTeam,saveAdminActiveTeam}
 from "../src/server/teams/active";

type Scenario={version?:number;admin?:boolean;team?:boolean;preferred?:string|null;
 failure?:boolean};
function fakeDb(s:Scenario={}){
 const statements:string[]=[];
 const query=async(sql:string,values:unknown[]=[]):Promise<{rows:any[]}>=>{
  statements.push(sql);
  if(sql.includes("FROM public.smn_account a"))return {rows:s.admin===false?[]:
   [{installation_id:"singleton",schema_version:s.version??28}]};
  if(sql.includes("FROM public.smn_account_team_preference p"))
   return {rows:s.preferred?[{team_id:s.preferred}]:[]};
  if(sql.includes("SELECT id,name FROM public.smn_team"))
   return {rows:[{id:"team1",name:"Koala"},{id:"team2",name:"Panda"}]};
  if(sql.includes("SELECT id FROM public.smn_team WHERE"))
   return {rows:s.team===false?[]:[{id:values[0]}]};
  if(s.failure&&sql.includes("INSERT INTO public.smn_account_team_preference"))
   throw Error("db-failed");
  return {rows:[]};
 };
 return {db:{query} as unknown as Client,statements};
}
test("préférence actuelle seulement pour Admin, selon la bonne installation",async()=>{
 const m=fakeDb({preferred:"team2"});
 const data=await readAdminActiveTeam(m.db,"admin");
 assert.equal(data?.ready,true);
 assert.equal(data?.teamId,"team2");
 assert.deepEqual(data?.items?.map(i=>i.id),["team1","team2"]);
 assert.ok(m.statements.some(s=>s.includes("t.installation_id=p.installation_id")));
});
test("aucun droit attribué aux comptes user et schéma 27 conservé",async()=>{
 const user=fakeDb({admin:false});
 assert.equal(await readAdminActiveTeam(user.db,"user"),null);
 const old=fakeDb({version:27});
 assert.deepEqual(await readAdminActiveTeam(old.db,"admin"),
  {ready:false,teamId:null,items:[]});
 assert.equal(old.statements.some(s=>s.includes("FROM public.smn_account_team_preference p")),false);
});
test("préférence enregistrée si team de l'installation",async()=>{
 const m=fakeDb();
 assert.deepEqual(await saveAdminActiveTeam(m.db,"admin","team2"),
  {ok:true,teamId:"team2"});
 assert.equal(m.statements.at(0),"BEGIN");
 assert.equal(m.statements.at(-1),"COMMIT");
 assert.ok(m.statements.some(s=>s.includes("ON CONFLICT(account_id) DO UPDATE")));
});
test("identifiant falsifié, équipe inconnue et user refusés",async()=>{
 const m=fakeDb();
 assert.deepEqual(await saveAdminActiveTeam(m.db,"admin","../../foo"),
  {ok:false,error:"invalid-input"});
 assert.equal(m.statements.length,0);
 const notFound=fakeDb({team:false});
 assert.deepEqual(await saveAdminActiveTeam(notFound.db,"admin","other"),
  {ok:false,error:"not-found"});
 assert.equal(notFound.statements.at(-1),"ROLLBACK");
 const user=fakeDb({admin:false});
 assert.deepEqual(await saveAdminActiveTeam(user.db,"user","team1"),
  {ok:false,error:"forbidden"});
});
test("erreur d'écriture : transaction annulée",async()=>{
 const m=fakeDb({failure:true});
 await assert.rejects(()=>saveAdminActiveTeam(m.db,"admin","team1"));
 assert.equal(m.statements.at(-1),"ROLLBACK");
});
