import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {listDashboardSources} from "../src/server/dashboard-builder/sources";

type Indicator = {id:string;tag:string;name:string;unit:string;display_style:string;is_selected:boolean;is_visible:boolean};
const records:Indicator[]=[
 {id:"manual1",tag:"SP_FIN",name:"Story Points terminés",unit:"SP",display_style:"number",is_selected:true,is_visible:true},
 {id:"computed1",tag:"SP_REAL",name:"Taux de réalisation SP",unit:"%",display_style:"number",is_selected:false,is_visible:true},
 {id:"computed2",tag:"CAPA_DEV_MAX",name:"Capacité maximale",unit:"J/H",display_style:"number",is_selected:true,is_visible:false},
 {id:"computed3",tag:"TX_DISPO_DEV",name:"Disponibilité",unit:"%",display_style:"number",is_selected:true,is_visible:true},
];
const scope={installationId:"singleton",accountId:"account1",teamId:"team1"};
function dbFor(role:"admin"|"user",rows:Indicator[]=records){
 const calls:{sql:string;params?:unknown[]}[]=[];
 const db={query:async(sql:string,params?:unknown[])=>{
  calls.push({sql,params});
  if(sql.includes("smn_dashboard_team_grant"))return {rows:[{role,can_read:true,can_edit:true}]};
  if(sql.includes("schema_version"))return {rows:[{schema_version:33}]};
  if(sql.includes("smn_indicator_definition"))return {rows:role==="admin"?rows:rows.filter(r=>r.is_selected)};
  throw Error("unexpected SQL");
 }} as unknown as Client;
 return {db,calls};
}
test("Admin: le catalogue inclut indicateurs calculés et saisis, mais bloque les inactifs ou masqués",async()=>{
 const {db,calls}=dbFor("admin");
 const sources=await listDashboardSources(db,scope);
 const byCode=(id:string)=>sources.find(s=>s.code==="indicator:"+id);
 assert.equal(byCode("manual1")?.status,"available");
 assert.equal(byCode("computed1")?.status,"unavailable");
 assert.equal(byCode("computed1")?.reason,"indicator-not-selected");
 assert.equal(byCode("computed2")?.status,"unavailable");
 assert.equal(byCode("computed2")?.reason,"indicator-hidden-dashboard");
 assert.equal(byCode("computed3")?.status,"available");
 const query=calls.find(c=>c.sql.includes("smn_indicator_definition"));
 assert.ok(query);
 assert.match(query.sql,/LEFT JOIN public\.smn_indicator_team_selection/);
 assert.match(query.sql,/a\.role='admin'/);
 assert.deepEqual(query.params,["team1","account1","singleton"]);
 assert.ok(calls.every(c=>!/\b(INSERT|UPDATE|DELETE)\b/i.test(c.sql)));
});
test("Non-admin: la SQL ne révèle pas les définitions non sélectionnées pour son équipe",async()=>{
 const {db,calls}=dbFor("user");
 const sources=await listDashboardSources(db,scope);
 assert.equal(sources.find(s=>s.code==="indicator:computed1"),undefined);
 const sql=calls.find(c=>c.sql.includes("smn_indicator_definition"))?.sql??"";
 assert.match(sql,/COALESCE\(s\.is_active,false\)=true OR EXISTS/);
 assert.match(sql,/a\.id=\$2 AND a\.installation_id=\$3/);
});
test("La modale explique les indicateurs manquants et propose la sélection de l'équipe",()=>{
 const ui=readFileSync(new URL("../src/app/app/dashboard-builder/slot-wizard.tsx",import.meta.url),"utf8");
 assert.match(ui,/indicator-not-selected/);
 assert.match(ui,/indicator-hidden-dashboard/);
 assert.match(ui,/Paramétrer les indicateurs de l’équipe/);
 assert.match(ui,/source\.status!=="available"/);
});
