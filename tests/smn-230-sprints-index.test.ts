import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {
 parseSprintIndexQuery,readSprintIndex,type SprintIndexQuery
} from "../src/server/sprints/index";
import {canAccess} from "../src/server/access-policy";
import {privateNavigation} from "../src/lib/private-navigation";

const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const uuid=(n:number)=>"sprint-"+String(n).padStart(4,"0");
const sample=Array.from({length:123},(_,i)=>({
 id:uuid(i),name:"Sprint "+String(i+1),status:i===9?"active":i===8?"closed":i===7?"finished":"planned",
 auto_suspended:i===3,start_at:new Date(Date.UTC(2026,0,1+i*14,8)),
 end_at:new Date(Date.UTC(2026,0,12+i*14,17)),time_zone:"Europe/Paris"
}));
const fixture=(records=sample)=>{
 const queries:string[]=[];
 const db={query:async (sql:string,params:unknown[]=[])=>{
  queries.push(sql);
  if(sql.includes("SELECT t.id,t.name"))return {rows:[{id:"team-1",name:"Equipe pilote"}]};
  if(sql.includes("SELECT DISTINCT"))return {
   rows:[...new Set(records.map(r=>r.auto_suspended?"suspended":r.status))].map(status=>({status}))
  };
  const match=(record:(typeof sample)[number])=>
   (String(params[1])===""||record.name.toLowerCase().includes(String(params[1]).toLowerCase()))&&
   (params[2]==="all"||(record.auto_suspended?"suspended":record.status)===params[2]);
  const selected=records.filter(match);
  if(sql.includes("count(*)::integer"))return {rows:[{total:selected.length}]};
  if(sql.includes("ORDER BY")){
   const sorted=[...selected].sort((a,b)=>{
    const priority=(r:(typeof sample)[number])=>r.status==="active"&&!r.auto_suspended&&r.start_at<=new Date()&&r.end_at>new Date()?0:1;
    if(sql.includes("CASE WHEN s.status='active'")){
     if(priority(a)!==priority(b))return priority(a)-priority(b);
    }
    const diff=a.start_at.getTime()-b.start_at.getTime();
    return sql.includes("s.start_at ASC")?diff||a.id.localeCompare(b.id):-diff||b.id.localeCompare(a.id);
   });
   return {rows:sorted.slice(Number(params[4]),Number(params[4])+Number(params[3]))};
  }
  throw Error("unexpected SQL");
 }} as unknown as Client;
 return {db,queries};
};
const query=(p:Partial<SprintIndexQuery>={}):SprintIndexQuery=>({
 page:1,pageSize:25,search:"",status:"all",sort:"newest",...p
});

describe("SMN-230 — liste de sprints consultable en lecture seule",()=>{
 it("borne strictement pages, recherche, états et critères de tri",()=>{
  assert.deepEqual(parseSprintIndexQuery(new URLSearchParams()),query({sort:"priority"}));
  assert.deepEqual(parseSprintIndexQuery(new URLSearchParams("page=3&pageSize=50&search=Sprint&status=closed&sort=oldest")),
   query({page:3,pageSize:50,search:"Sprint",status:"closed",sort:"oldest"}));
  for(const value of [
   "page=0","page=1.5","page=100001","pageSize=51","pageSize=-1",
   "sort=DROP%20TABLE","status=%2A","search="+("x".repeat(101)),"unexpected=1"
  ])assert.equal(parseSprintIndexQuery(new URLSearchParams(value)),null,value);
 });
 it("pagine 123 sprints sans limite implicite à 100",async()=>{
  const {db,queries}=fixture();
  const first=await readSprintIndex(db,query());
  const last=await readSprintIndex(db,query({page:5}));
  assert.equal(first.total,123);
  assert.equal(first.totalPages,5);
  assert.equal(first.items.length,25);
  assert.equal(last.items.length,23);
  assert.equal(last.page,5);
  assert.equal(new Set([...first.items,...last.items].map(x=>x.id)).size,48);
  assert.ok(queries.some(sql=>sql.includes("LIMIT $4 OFFSET $5")));
 });
 it("trouve les anciens sprints et applique les filtres avant la pagination",async()=>{
  const {db}=fixture();
  const selected=await readSprintIndex(db,query({search:"Sprint 1",status:"closed"}));
  assert.equal(selected.total,0);
  const search=await readSprintIndex(db,query({search:"sprint 122"}));
  assert.equal(search.total,1);
  assert.equal(search.items[0].id,uuid(121));
  const archived=await readSprintIndex(db,query({status:"closed"}));
  assert.equal(archived.total,1);
  assert.equal(archived.items[0].id,uuid(8));
  const suspended=await readSprintIndex(db,query({status:"suspended"}));
  assert.equal(suspended.total,1);
  assert.equal(suspended.items[0].id,uuid(3));
 });
 it("respecte l'ordre de tri, les bornes de page et la zone effective",async()=>{
  const {db}=fixture();
  const newest=await readSprintIndex(db,query({sort:"newest"}));
  const oldest=await readSprintIndex(db,query({sort:"oldest"}));
  assert.equal(newest.items[0].id,uuid(122));
  assert.equal(oldest.items[0].id,uuid(0));
  assert.equal(oldest.items[0].timeZone,"Europe/Paris");
  assert.ok(oldest.items[0].startAt.endsWith("Z"));
  assert.equal((await readSprintIndex(db,query({page:1000}))).page,5);
 });
 it("ne lance jamais de mutation en consultant l'historique",async()=>{
  const {db,queries}=fixture();
  await readSprintIndex(db,query({page:2,sort:"priority"}));
  assert.ok(queries.length>0);
  for(const sql of queries)assert.match(sql.trim(),/^SELECT\b/i);
  assert.ok(queries.every(sql=>!/\b(?:UPDATE|INSERT|DELETE|ALTER|CREATE|TRUNCATE|BEGIN|COMMIT)\b/i.test(sql)));
 });
 it("ne normalise jamais silencieusement un état métier incohérent",async()=>{
  const stale=[{...sample[0],status:"active",start_at:new Date("2020-01-01T09:00:00Z"),end_at:new Date("2020-01-10T17:00:00Z")}];
  const {db}=fixture(stale);
  const output=await readSprintIndex(db,query());
  assert.equal(output.items[0].status,"active");
  assert.equal(output.items[0].stateMayBeStale,true);
 });
 it("permet la lecture collective au rôle user, sans débloquer l'écriture ni Kanban",()=>{
  const reader={role:"user",is_active:true,must_change_password:false};
  assert.equal(canAccess(reader,"read",{type:"collective",exists:true,inScope:true}),true);
  assert.equal(canAccess(reader,"write",{type:"settings",exists:true,inScope:true}),false);
  const cycles=(mode:"scrum"|"kanban")=>privateNavigation(mode,"user").flatMap(g=>g.entries).find(x=>x.id==="cycles");
  assert.equal(cycles("scrum")?.href,"/app/admin/sprints");
  assert.equal(cycles("kanban")?.href,null);
  const api=read("src/app/api/sprints/index/route.ts");
  assert.match(api,/authorizeApi\(request,"read",collective\)/);
  assert.doesNotMatch(api,/reconcileSprintStates|ensureSprintStateSchema/);
 });
 it("préserve les outils d'administration sans les afficher sur la liste",()=>{
  const page=read("src/app/app/admin/sprints/page.tsx");
  const tools=read("src/app/app/admin/sprints/tools/page.tsx");
  const ui=read("src/app/app/admin/sprints/sprint-index-view.tsx");
  assert.match(page,/container-fluid/);
  assert.doesNotMatch(page,/maxWidth:900/);
  assert.match(page,/<SprintIndexView canManage=/);
  for(const component of ["SprintForm","BatchPreviewForm","RenameSprintForm","DeleteSprintForm",
   "CeremonyEditor","RescheduleForm","SprintReviewLink"]){
   assert.doesNotMatch(page,new RegExp("<"+component));
   assert.ok(tools.includes("<"+component),component);
  }
  assert.match(tools,/canAccess\(actor,"read",\{type:"settings"/);
  assert.match(ui,/canManage&&<Link/);
  assert.match(ui,/useDeferredValue/);
  assert.match(ui,/table-responsive/);
  assert.match(ui,/sprintsIndex\.stateUnverified/);
  assert.match(ui,/sprintsIndex\.calendarPending/);
  assert.doesNotMatch(ui,/href="#"/);
  assert.doesNotMatch(ui,/href=\{.*?item\.id.*?\}/);
 });
 it("dispose des libellés localisés identiques pour les deux langues",()=>{
  const fr=JSON.parse(read("src/i18n/fr.json")).sprintsIndex;
  const en=JSON.parse(read("src/i18n/en.json")).sprintsIndex;
  assert.deepEqual(Object.keys(fr).sort(),Object.keys(en).sort());
  for(const key of Object.keys(fr)){
   assert.ok(typeof fr[key]==="string"&&fr[key].length>0);
   assert.ok(typeof en[key]==="string"&&en[key].length>0);
  }
 });
});
