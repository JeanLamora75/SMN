import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {comparisonJh,parseHistoricalInput,readHistoricalQuality,
 saveHistoricalQuality,type HistoricalValue}
 from "../src/server/capacity/historical";
import {CAPACITY_HISTORICAL_MIGRATION_SQL}
 from "../src/server/capacity/historical-migration";
import {canAccess} from "../src/server/access-policy";

const actorId="11111111-1111-4111-8111-111111111111";
const start="2026-10-01",end="2026-10-14",today="2026-10-21";
const payload=(overrides:Record<string,unknown>={})=>({
 start,end,revision:0,quality:"known",qualifiedJh:32,
 sourceKind:"document",sourceRef:"Bilan Sprint signé 2026-10-01",
 rationale:"Document original attesté par le Scrum Master",
 ...overrides
});
type Row={
 id:string;quality:"known"|"estimated"|"not-supplied";qualified_jh:number|null;
 source_kind:"document"|"import"|"reconstruction"|"other"|null;
 source_ref:string|null;rationale:string;revision:number;updated_at:string;
};
type Change={revision:number;before_values:HistoricalValue|null;
 after_values:HistoricalValue;changed_at:string;changed_by:string|null};
function fixture(clock=today){
 let row:Row|null=null;const audit:Change[]=[];const queries:string[]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  queries.push(sql);
  if(sql.startsWith("BEGIN")||sql==="COMMIT"||sql==="ROLLBACK")
   return {rows:[],rowCount:0};
  if(sql.includes("FROM public.smn_team t"))
   return {rows:[{id:"team-main"}],rowCount:1};
  if(sql.includes("AS today"))
   return {rows:[{today:clock}],rowCount:1};
  if(sql.includes("FROM public.smn_capacity_historical_quality_history"))
   return {rows:[...audit].reverse(),rowCount:audit.length};
  if(sql.includes("FROM public.smn_capacity_historical_quality"))
   return {rows:row?[{...row}]:[],rowCount:row?1:0};
  if(sql.startsWith("INSERT INTO public.smn_capacity_historical_quality_history")){
   audit.push({
    revision:Number(args[2]),
    before_values:args[3]?JSON.parse(String(args[3])) as HistoricalValue:null,
    after_values:JSON.parse(String(args[4])) as HistoricalValue,
    changed_at:"2026-10-21 14:00:00+02",changed_by:String(args[5])
   });
   return {rows:[],rowCount:1};
  }
  if(sql.startsWith("INSERT INTO public.smn_capacity_historical_quality")){
   row={id:String(args[0]),quality:String(args[4]) as Row["quality"],
    qualified_jh:args[5]===null?null:Number(args[5]),
    source_kind:args[6]===null?null:String(args[6]) as Row["source_kind"],
    source_ref:args[7]===null?null:String(args[7]),
    rationale:String(args[8]),revision:1,updated_at:"2026-10-21 13:00:00+02"};
   return {rows:[],rowCount:1};
  }
  if(sql.startsWith("UPDATE public.smn_capacity_historical_quality")){
   if(!row||row.revision!==args[7])return {rows:[],rowCount:0};
   row={...row,quality:String(args[1]) as Row["quality"],
    qualified_jh:args[2]===null?null:Number(args[2]),
    source_kind:args[3]===null?null:String(args[3]) as Row["source_kind"],
    source_ref:args[4]===null?null:String(args[4]),rationale:String(args[5]),
    revision:row.revision+1,updated_at:"2026-10-21 14:00:00+02"};
   return {rows:[],rowCount:1};
  }
  throw Error("SQL inattendu : "+sql);
 }} as unknown as Client;
 return {db,queries,audit,get row(){return row}};
}
describe("SMN-61 — qualification honnête des capacités historiques",()=>{
 it("AC1 : une période historique sans preuve reste Non renseignée et null, sans insertion",async()=>{
  const f=fixture();
  const r=await readHistoricalQuality(f.db,start,end);
  assert.equal(r.isHistorical,true);
  assert.equal(r.quality,"not-supplied");
  assert.equal(r.qualifiedJh,null);
  assert.equal(r.revision,0);
  assert.deepEqual(r.history,[]);
  assert.ok(f.queries.every(q=>q.startsWith("SELECT")||q.startsWith("BEGIN")||q==="COMMIT"));
  assert.equal(f.row,null);
 });
 it("AC2 : Connue conserve source datée, valeur et qualité séparément de Calcul/Saisie",async()=>{
  const f=fixture();
  assert.deepEqual(await saveHistoricalQuality(f.db,actorId,payload()),{
   ok:true,revision:1
  });
  const r=await readHistoricalQuality(f.db,start,end);
  assert.equal(r.quality,"known");
  assert.equal(r.qualifiedJh,32);
  assert.equal(r.sourceKind,"document");
  assert.match(r.sourceRef??"",/Bilan Sprint signé/);
  assert.equal(r.history.length,1);
  assert.equal(r.history[0].before,null);
  assert.equal(r.history[0].after.quality,"known");
  assert.equal(r.history[0].changedBy,actorId);
  assert.equal(comparisonJh(r,28,"finished"),-4);
 });
 it("AC3 : une reconstitution partielle reste Estimée même si 32 JH sont calculables",async()=>{
  const f=fixture();
  await saveHistoricalQuality(f.db,actorId,payload({
   quality:"estimated",sourceKind:"reconstruction",
   sourceRef:"Méthode interpolée depuis feuilles de temps",
   rationale:"Seulement une partie des indisponibilités a été retrouvée"
  }));
  const r=await readHistoricalQuality(f.db,start,end);
  assert.equal(r.qualifiedJh,32);
  assert.equal(r.quality,"estimated");
  assert.equal(r.sourceKind,"reconstruction");
  assert.equal(comparisonJh(r,28,"finished"),null);
 });
 it("AC4 : la capacité prévue inconnue coexiste avec un réalisé mesuré, sans écart",()=>{
  const initial:HistoricalValue={quality:"not-supplied",qualifiedJh:null,
   sourceKind:null,sourceRef:null,rationale:null,revision:0,updatedAt:null};
  assert.equal(comparisonJh(initial,27,"finished"),null);
  assert.equal(comparisonJh({...initial,quality:"estimated",qualifiedJh:28},27,"closed"),null);
  assert.equal(comparisonJh({...initial,quality:"known",qualifiedJh:0},0,"closed"),0);
  assert.equal(comparisonJh({...initial,quality:"known",qualifiedJh:30},27,"in-progress"),null);
  assert.equal(comparisonJh({...initial,quality:"known",qualifiedJh:30},null,"finished"),null);
 });
 it("AC5 : correction d'une estimation source 1 vers source 2 traçable et sans cliché réécrit",async()=>{
  const f=fixture();
  await saveHistoricalQuality(f.db,actorId,payload({
   quality:"estimated",qualifiedJh:35,sourceKind:"reconstruction",
   sourceRef:"Feuille de temps partielle 1",
   rationale:"Estimation provisoire fondée sur 3 membres"
  }));
  const corrected=await saveHistoricalQuality(f.db,actorId,payload({
   quality:"estimated",qualifiedJh:31,revision:1,
   sourceKind:"reconstruction",sourceRef:"Feuille de temps partielle 2",
   rationale:"Correction suite à récupération d'un relevé de présence"
  }));
  assert.deepEqual(corrected,{ok:true,revision:2});
  const r=await readHistoricalQuality(f.db,start,end);
  assert.equal(r.quality,"estimated");
  assert.equal(r.qualifiedJh,31);
  assert.equal(r.history.length,2);
  assert.equal(r.history[0].before?.qualifiedJh,35);
  assert.match(r.history[0].after.sourceRef??"",/partielle 2/);
  assert.match(r.history[1].after.sourceRef??"",/partielle 1/);
  assert.ok(f.queries.filter(q=>/INSERT INTO|UPDATE public/.test(q)).every(q=>
   q.includes("smn_capacity_historical_quality")));
  assert.equal(f.queries.some(q=>/UPDATE.*smn_capacity_initial_snapshot|UPDATE.*smn_capacity_actual_snapshot/i.test(q)),false);
 });
 it("requalifier en Non renseignée conserve un historique et aucune valeur fictive",async()=>{
  const f=fixture();
  await saveHistoricalQuality(f.db,actorId,payload());
  const result=await saveHistoricalQuality(f.db,actorId,payload({
   quality:"not-supplied",revision:1,qualifiedJh:null,
   sourceKind:null,sourceRef:null,rationale:"Le document initial ne peut plus être attesté"
  }));
  assert.deepEqual(result,{ok:true,revision:2});
  const r=await readHistoricalQuality(f.db,start,end);
  assert.equal(r.quality,"not-supplied");
  assert.equal(r.qualifiedJh,null);
  assert.equal(r.history[0].before?.qualifiedJh,32);
 });
 it("refuse faux Connue, mauvaise preuve, valeur vide ou date invalide",()=>{
  assert.equal(parseHistoricalInput(payload({quality:"known",sourceKind:"reconstruction"})),null);
  assert.equal(parseHistoricalInput(payload({qualifiedJh:null})),null);
  assert.equal(parseHistoricalInput(payload({qualifiedJh:""})),null);
  assert.equal(parseHistoricalInput(payload({qualifiedJh:-1})),null);
  assert.equal(parseHistoricalInput(payload({qualifiedJh:12.00001})),null);
  assert.equal(parseHistoricalInput(payload({sourceRef:"x"})),null);
  assert.equal(parseHistoricalInput(payload({sourceRef:null})),null);
  assert.equal(parseHistoricalInput(payload({start:"2026-02-30"})),null);
  assert.equal(parseHistoricalInput(payload({quality:"not-supplied",qualifiedJh:0,
   sourceKind:null,sourceRef:null})),null);
  assert.equal(parseHistoricalInput(payload({unexpected:42})),null);
  assert.equal(parseHistoricalInput(payload({qualifiedJh:0}))?.qualifiedJh,0);
 });
 it("qualification interdite sur période non terminée ou révision périmée",async()=>{
  const f=fixture();
  assert.deepEqual(await saveHistoricalQuality(f.db,actorId,payload({
   start:"2026-10-20",end:"2026-10-27"
  })),{ok:false,error:"not-historical"});
  await saveHistoricalQuality(f.db,actorId,payload());
  assert.deepEqual(await saveHistoricalQuality(f.db,actorId,payload({
   qualifiedJh:99,revision:0
  })),{ok:false,error:"conflict"});
  assert.equal(f.audit.length,1);
 });
 it("v25 : audit immuable, sources contraintes, aucune mutation des snapshots/export historiques",()=>{
  assert.match(CAPACITY_HISTORICAL_MIGRATION_SQL,/schema_version=25/);
  assert.match(CAPACITY_HISTORICAL_MIGRATION_SQL,/historical_quality_history_guard/);
  assert.match(CAPACITY_HISTORICAL_MIGRATION_SQL,/BEFORE UPDATE OR DELETE/);
  assert.match(CAPACITY_HISTORICAL_MIGRATION_SQL,/quality='estimated'/);
  assert.doesNotMatch(CAPACITY_HISTORICAL_MIGRATION_SQL,/DROP TABLE|ON DELETE CASCADE|pdf/i);
  const resource={type:"members",exists:true,inScope:true};
  assert.equal(canAccess({role:"admin",is_active:true,must_change_password:false},
   "write",resource),true);
  assert.equal(canAccess({role:"user",is_active:true,must_change_password:false},
   "read",resource),false);
 });
});
