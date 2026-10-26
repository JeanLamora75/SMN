import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {executeHolidayCsv,parseCsvRequest} from "../src/server/holidays/csv-import";
import {HOLIDAY_CSV_MIGRATION_SQL} from "../src/server/holidays/csv-migration";
import {canAccess} from "../src/server/access-policy";

const header="date;nom;pays\n";
const request=(csv:string,stage:"preview"|"commit"="preview",policy:"skip"|"replace"="skip",
 fingerprint?:string)=>({country:"FR",csv,stage,policy,...(fingerprint?{fingerprint}:{})});

function fakeDb(initial:Record<string,string>={},found=true,validatedYears=new Set<number>()){
 const holidays=new Map(Object.entries(initial)),audits:unknown[][]=[],validationAudits:unknown[][]=[],queries:string[]=[];
 const db={query:async(sql:string,params:unknown[]=[])=>{
  queries.push(sql);
  if(sql==="BEGIN"||sql==="COMMIT"||sql==="ROLLBACK"||sql.includes("pg_advisory_xact_lock")||
   sql.includes("ALTER TABLE")||sql.includes("CREATE TABLE")||sql.includes("CREATE INDEX"))
   return {rows:[],rowCount:0};
  if(sql.includes("SELECT code FROM public.smn_country"))
   return {rows:found?[{code:"FR"}]:[],rowCount:found?1:0};
  if(sql.includes("SELECT to_char(holiday_date"))return {rows:(params[1] as string[])
   .filter(d=>holidays.has(d)).map(d=>({date:d,name:holidays.get(d)!})),rowCount:holidays.size};
  if(sql.includes("INSERT INTO public.smn_national_holiday(")){
   const date=String(params[1]);
   if(holidays.has(date))return {rows:[],rowCount:0};
   holidays.set(date,String(params[2]));return {rows:[],rowCount:1};
  }
  if(sql.includes("UPDATE public.smn_national_holiday SET")){
   const date=String(params[1]),old=String(params[3]);
   if(holidays.get(date)!==old)return {rows:[],rowCount:0};
   holidays.set(date,String(params[2]));return {rows:[],rowCount:1};
  }
  if(sql.includes("INSERT INTO public.smn_national_holiday_audit")){
   audits.push(params);return {rows:[],rowCount:1};
  }
  if(sql.includes("SELECT revision,validated_revision,administrative_validated_at"))
   return {rows:validatedYears.has(Number(params[1]))?
    [{revision:2,validated_revision:2,administrative_validated_at:"2026-10-26"}]:[],
    rowCount:validatedYears.has(Number(params[1]))?1:0};
  if(sql.includes("INSERT INTO public.smn_national_calendar_validation_audit")){
   validationAudits.push(params);return {rows:[],rowCount:1};
  }
  if(sql.includes("SELECT revision")&&sql.includes("FROM public.smn_national_calendar_coverage"))
   return {rows:[{revision:1}],rowCount:1};
  if(sql.includes("SELECT count(*)::text AS total")){
   return {rows:[{total:String([...holidays.keys()].filter(d=>d.startsWith(String(params[1]))).length)}],rowCount:1};
  }
  if(sql.includes("INSERT INTO public.smn_national_calendar_coverage"))
   return {rows:[],rowCount:1};
  throw new Error("SQL not expected: "+sql);
 }} as unknown as Client;
 return {db,holidays,audits,validationAudits,queries};
}
describe("Importer CSV national — prévisualisation et confirmation",()=>{
 it("accepte des années historiques/futures sans fenêtre de quatre ans, et des champs entre guillemets",async()=>{
  const f=fakeDb();
  const csv=header+'1999-01-01;"Jour; historique";FR\n2042-05-01;Fête future;FR\n';
  const r=await executeHolidayCsv(f.db,request(csv),"admin");
  assert.equal(r.ok,true);
  if(r.ok){
   assert.equal(r.preview.proposed,2);
   assert.deepEqual(r.preview.rows.map(x=>x.date),["1999-01-01","2042-05-01"]);
   assert.equal(r.preview.rows[0].name,"Jour; historique");
   assert.equal(r.preview.rows[0].line,2);
  }
  assert.equal(f.holidays.size,0);
 });
 it("signale doublon, pays incohérent, date impossible, nom vide et pays vide, sans inventer de données",async()=>{
  const csv=header+[
   "2026-05-01;Fête du Travail;FR",
   "2026-05-01;Doublon;FR",
   "2026-02-30;Invalide;FR",
   "2026-05-02;;FR",
   "2026-05-03;Autre pays;DE",
   "2026-05-04;Pays absent;",
   "",
   "2026-05-05;Fête valable;FR"
  ].join("\n");
  const f=fakeDb();
  const r=await executeHolidayCsv(f.db,request(csv),"admin");
  assert.equal(r.ok,true);
  if(r.ok){
   assert.equal(r.preview.proposed,2);
   assert.equal(r.preview.rejected,6);
   assert.deepEqual(r.preview.rows.filter(x=>x.reason).map(x=>x.reason),
    ["duplicate-in-file","invalid-date","invalid-name","country-mismatch","country-mismatch","column-count"]);
  }
  assert.equal(f.holidays.size,0);
 });
 it("ignore les conflits par défaut, puis confirme sans doublon ni modification historique silencieuse",async()=>{
  const f=fakeDb({"2020-01-01":"Ancien"});
  const csv=header+"2020-01-01;Nouveau;FR\n2020-05-01;Travail;FR";
  const r=await executeHolidayCsv(f.db,request(csv),"admin");
  assert.equal(r.ok,true);
  if(!r.ok)return;
  assert.equal(r.preview.rejected,1);
  assert.equal(r.preview.rows[0].reason,"existing-date");
  assert.equal(r.preview.proposed,1);
  const done=await executeHolidayCsv(f.db,request(csv,"commit","skip",r.preview.fingerprint),"admin");
  assert.equal(done.ok,true);
  if(done.ok){assert.equal(done.created,1);assert.equal(done.replaced,0);}
  assert.equal(f.holidays.get("2020-01-01"),"Ancien");
  assert.equal(f.audits.length,1);
  assert.equal(f.audits[0][5],"create");
  assert.equal(f.queries.at(-1),"COMMIT");
  assert.ok(f.queries.every(q=>!q.includes("UPDATE public.smn_member")&&
   !q.includes("capacity")&&!q.includes("pdf")));
 });
 it("remplace uniquement avec politique explicite et journalise avant/après",async()=>{
  const f=fakeDb({"2020-01-01":"Avant"});
  const csv=header+"2020-01-01;Après;FR";
  const preview=await executeHolidayCsv(f.db,request(csv,"preview","replace"),"admin");
  assert.equal(preview.ok,true);
  if(!preview.ok)return;
  assert.equal(preview.preview.rows[0].action,"replace");
  const changed=await executeHolidayCsv(f.db,request(csv,"commit","replace",preview.preview.fingerprint),"admin");
  assert.equal(changed.ok,true);
  if(changed.ok)assert.equal(changed.replaced,1);
  assert.equal(f.holidays.get("2020-01-01"),"Après");
  assert.deepEqual(f.audits[0].slice(3,6),["Avant","Après","replace"]);
 });
 it("un réimport identique ne révoque pas l'attestation",async()=>{
  const f=fakeDb({"2026-05-01":"Travail"},true,new Set([2026]));
  const csv=header+"2026-05-01;Travail;FR";
  const preview=await executeHolidayCsv(f.db,request(csv),"admin");
  assert.equal(preview.ok,true);
  if(!preview.ok)return;
  const done=await executeHolidayCsv(f.db,request(csv,"commit","skip",preview.preview.fingerprint),"admin");
  assert.equal(done.ok,true);
  assert.equal(f.validationAudits.length,0);
 });
 it("un import qui remplace réellement un nom invalide l'attestation une seule fois",async()=>{
  const f=fakeDb({"2026-05-01":"Avant"},true,new Set([2026]));
  const csv=header+"2026-05-01;Après;FR";
  const preview=await executeHolidayCsv(f.db,request(csv,"preview","replace"),"admin");
  assert.equal(preview.ok,true);
  if(!preview.ok)return;
  const done=await executeHolidayCsv(f.db,request(csv,"commit","replace",preview.preview.fingerprint),"admin");
  assert.equal(done.ok,true);
  assert.equal(f.validationAudits.length,1);
  assert.equal(f.validationAudits[0][1],"FR");
  assert.equal(f.validationAudits[0][2],2026);
 });
 it("refuse de confirmer si la base change depuis l'aperçu",async()=>{
  const f=fakeDb();
  const csv=header+"2020-01-01;Férié;FR";
  const preview=await executeHolidayCsv(f.db,request(csv),"admin");
  assert.equal(preview.ok,true);
  if(!preview.ok)return;
  f.holidays.set("2020-01-01","Modification concurrente");
  const changed=await executeHolidayCsv(f.db,request(csv,"commit","skip",preview.preview.fingerprint),"admin");
  assert.deepEqual(changed.ok,false);
  if(!changed.ok)assert.equal(changed.error,"preview-expired");
  assert.equal(f.audits.length,0);
  assert.equal(f.queries.at(-1),"ROLLBACK");
 });
 it("refuse un schéma absent, un pays non répertorié ou une requête non conforme",async()=>{
  const f=fakeDb();
  const invalid=await executeHolidayCsv(f.db,request("date,nom\n2020-01-01,Nom"),"admin");
  assert.deepEqual(invalid,{ok:false,error:"invalid-csv"});
  const unknown=await executeHolidayCsv(fakeDb({},false).db,request(header+"2020-01-01;Jour;FR"),"admin");
  assert.deepEqual(unknown,{ok:false,error:"country-not-found"});
  assert.equal(parseCsvRequest({country:"FR",csv:header,policy:"replace",stage:"commit"}),null);
  assert.equal(parseCsvRequest({...request(header),admin:true}),null);
  assert.equal(parseCsvRequest({...request(header),country:"France"}),null);
 });
 it("contrôle le rôle et la migration d'audit additive v17",()=>{
  assert.equal(canAccess({role:"user",is_active:true,must_change_password:false},"write",
   {type:"settings",exists:true,inScope:true}),false);
  assert.equal(canAccess({role:"admin",is_active:true,must_change_password:false},"write",
   {type:"settings",exists:true,inScope:true}),true);
  assert.match(HOLIDAY_CSV_MIGRATION_SQL,/schema_version=17/);
  assert.match(HOLIDAY_CSV_MIGRATION_SQL,/CREATE TABLE public.smn_national_holiday_audit/);
  assert.match(HOLIDAY_CSV_MIGRATION_SQL,/previous_name/);
  assert.match(HOLIDAY_CSV_MIGRATION_SQL,/partial/);
  assert.doesNotMatch(HOLIDAY_CSV_MIGRATION_SQL,/DROP TABLE|ON DELETE CASCADE/i);
 });
});
