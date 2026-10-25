import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {parseRegistryFilters,readRegistryPage,readRegistryCycles,registryLifecycle} from "../src/server/registries/list";

const cycleId="11111111-1111-4111-8111-111111111111";
test("périmètre transverse équipe sans cycle implicite ; validation stricte",()=>{
 assert.deepEqual(parseRegistryFilters(new URLSearchParams()),{
  type:"all",search:"",status:"",owner:"",page:1,lifecycle:"all",sort:"default",cycleId:""
 });
 assert.equal(parseRegistryFilters(new URLSearchParams("type=highlight&status=recorded"))?.type,"highlight");
 assert.equal(parseRegistryFilters(new URLSearchParams("type=all&status=satisfied"))?.status,"satisfied");
 assert.equal(parseRegistryFilters(new URLSearchParams("type=all&status=notreal")),null);
 assert.equal(parseRegistryFilters(new URLSearchParams("lifecycle=unknown")),null);
 assert.equal(parseRegistryFilters(new URLSearchParams("sort=id%3BDELETE")),null);
 assert.equal(parseRegistryFilters(new URLSearchParams("cycleId=other-team")),null);
});
test("les six types gardent leurs statuts ; Consigné n'est ni actif ni final",()=>{
 assert.equal(registryLifecycle("risk","open"),"followup");
 assert.equal(registryLifecycle("obstacle","abandoned"),"final");
 assert.equal(registryLifecycle("dependency","satisfied"),"final");
 assert.equal(registryLifecycle("decision","active"),"followup");
 assert.equal(registryLifecycle("action","cancelled"),"final");
 assert.equal(registryLifecycle("highlight","recorded"),"unclassified");
});
function fakeDb(sql:string[],values:unknown[][],count=1):Client{
 return {query:async(statement:string,params?:unknown[])=>{
  sql.push(statement);values.push(params??[]);
  if(statement.includes("to_regclass"))return {rows:[{present:true}]};
  if(statement.includes("FROM public.smn_team t"))return {rows:[{id:"team-1",name:"Team"}]};
  if(statement.includes("COUNT(*)"))return {rows:[{total:count}]};
  return {rows:[]};
 }} as unknown as Client;
}
test("le filtre cycle est un EXISTS dédoublonné avant comptage et pagination",async()=>{
 const sql:string[]=[],values:unknown[][]=[];
 const db=fakeDb(sql,values,55);
 const f=parseRegistryFilters(new URLSearchParams("type=all&cycleId="+cycleId+"&lifecycle=followup&sort=titleAsc&page=4"))!;
 const result=await readRegistryPage(db,f,false);
 assert.equal(result.state,"available");
 if(result.state!=="available")return;
 assert.equal(result.total,55);assert.equal(result.page,3);
 const count=sql.find(s=>s.includes("COUNT(*)"))!;
 const items=sql.find(s=>s.includes("LIMIT 25"))!;
 assert.match(count,/EXISTS \(SELECT 1 FROM public\.smn_registry_cycle_link/);
 assert.match(items,/EXISTS \(SELECT 1 FROM public\.smn_registry_cycle_link/);
 assert.match(items,/ORDER BY r\.title ASC/);
 assert.match(items,/OFFSET \$8/);
 assert.ok(!items.includes('AS "owner"'));
 assert.equal(values.at(-1)?.at(-1),50);
 assert.ok(!sql.some(s=>s.includes("UPDATE ")||s.includes("INSERT ")));
});
test("rôle user ne peut chercher par propriétaire ni lire sa colonne",async()=>{
 const sql:string[]=[],values:unknown[][]=[],db=fakeDb(sql,values);
 const f=parseRegistryFilters(new URLSearchParams("owner=Alice"))!;
 assert.deepEqual(await readRegistryPage(db,f,false),{state:"forbidden"});
 assert.equal(sql.filter(s=>s.includes("COUNT(*)")).length,0);
});
test("ordre par défaut : actifs, non classés, puis états finaux",async()=>{
 const sql:string[]=[],values:unknown[][]=[],db=fakeDb(sql,values);
 await readRegistryPage(db,parseRegistryFilters(new URLSearchParams())!,true);
 const s=sql.find(s=>s.includes("LIMIT 25"))!;
 assert.match(s,/CASE WHEN .* THEN 0 WHEN .* THEN 2 ELSE 1 END ASC/);
 assert.match(s,/r\.occurred_on DESC/);
 assert.match(s,/AS "owner"/);
 assert.ok(!s.includes("smn_registry_cycle_link"));
});
test("si les liens ne sont pas installés : indisponibilité, pas faux zéro",async()=>{
 const sql:string[]=[];
 const db={query:async(s:string)=>{
  sql.push(s);
  if(s.includes("to_regclass"))return {rows:[{present:!s.includes("smn_registry_cycle_link")}]};
  if(s.includes("FROM public.smn_team t"))return {rows:[{id:"team-1",name:"Team"}]};
  return {rows:[]};
 }} as unknown as Client;
 const f=parseRegistryFilters(new URLSearchParams("cycleId="+cycleId))!;
 assert.deepEqual(await readRegistryPage(db,f,false),{state:"unavailable",reason:"links-not-installed"});
 assert.ok(!sql.some(s=>s.includes("COUNT(*)")));
});
test("les cycles proposés sont uniquement ceux de l'équipe résolue côté serveur",async()=>{
 const sql:string[]=[],values:unknown[][]=[];
 const result=await readRegistryCycles(fakeDb(sql,values));
 assert.equal(result.state,"available");
 assert.match(sql.at(-1)!,/s\.team_id=\$1/);
 assert.deepEqual(values.at(-1),["team-1"]);
});

test("Kanban utilise ses périodes et liens qualitatifs existants, sans les confondre avec les Sprints",async()=>{
 const sql:string[]=[],values:unknown[][]=[];
 const db={query:async(statement:string,params?:unknown[])=>{
  sql.push(statement);values.push(params??[]);
  if(statement.includes("to_regclass"))return {rows:[{present:true}]};
  if(statement.includes("FROM public.smn_team t"))return {rows:[{id:"kanban-team",name:"Team Kanban",mode:"kanban"}]};
  if(statement.includes("FROM public.smn_kanban_period p"))return {rows:[{id:cycleId,name:"Octobre",status:"active"}]};
  if(statement.includes("COUNT(*)"))return {rows:[{total:1}]};
  return {rows:[]};
 }} as unknown as Client;
 const cycles=await readRegistryCycles(db);
 assert.equal(cycles.state,"available");
 if(cycles.state!=="available")return;
 assert.equal(cycles.cycles.length,1);
 assert.deepEqual(values.at(-1),["kanban-team"]);
 const filters=parseRegistryFilters(new URLSearchParams("cycleId="+cycleId))!;
 const page=await readRegistryPage(db,filters,false);
 assert.equal(page.state,"available");
 const count=sql.find(x=>x.includes("COUNT(*)"))!;
 const pageSql=sql.find(x=>x.includes("LIMIT 25"))!;
 assert.match(count,/EXISTS \(SELECT 1 FROM public\.smn_kanban_registry_link/);
 assert.match(count,/p\.team_id=r\.team_id/);
 assert.match(pageSql,/EXISTS \(SELECT 1 FROM public\.smn_kanban_registry_link/);
 assert.ok(!count.includes("smn_registry_cycle_link"));
 assert.ok(!sql.some(x=>/UPDATE public\.smn_|DELETE FROM public\.smn_|INSERT INTO public\.smn_/.test(x)));
});
test("l'absence des liens Kanban est un état indisponible, non un registre vide",async()=>{
 const sql:string[]=[];
 const db={query:async(statement:string)=>{
  sql.push(statement);
  if(statement.includes("to_regclass"))return {rows:[{present:!statement.includes("smn_kanban_registry_link")}]};
  if(statement.includes("FROM public.smn_team t"))return {rows:[{id:"team-kanban",name:"Kanban",mode:"kanban"}]};
  return {rows:[]};
 }} as unknown as Client;
 const filters=parseRegistryFilters(new URLSearchParams("cycleId="+cycleId))!;
 assert.deepEqual(await readRegistryPage(db,filters,false),{state:"unavailable",reason:"links-not-installed"});
 assert.ok(!sql.some(x=>x.includes("COUNT(*)")));
});
test("une période hors équipe n'est jamais remontée dans la liste ou le registre",async()=>{
 const sql:string[]=[],values:unknown[][]=[];
 const db=fakeDb(sql,values,0);
 await readRegistryPage(db,parseRegistryFilters(new URLSearchParams("cycleId="+cycleId))!,false);
 const sqlCount=sql.find(x=>x.includes("COUNT(*)"))!;
 assert.match(sqlCount,/s\.team_id=r\.team_id/);
 assert.ok(values.some(v=>v.includes("team-1")&&v.includes(cycleId)));
});

