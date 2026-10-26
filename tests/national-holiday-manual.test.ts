import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {changeManualHoliday,isCivilHolidayDate,parseManualRequest,
 readAnnualHolidaySnapshot} from "../src/server/holidays/manual";

function fixture(initial:Record<string,string>={},opts:{archived?:boolean;auditFails?:boolean}={}){
 const dates=new Map(Object.entries(initial));
 const coverage=new Map<string,{status:string;revision:number}>();
 const sql:string[]=[],audits:unknown[][]=[];
 const client={query:async(text:string,args:unknown[]=[])=>{
  sql.push(text);
  if(["BEGIN","COMMIT","ROLLBACK"].includes(text)||text.includes("pg_advisory_xact_lock")||
    text.includes("ALTER TABLE")||text.includes("CREATE TABLE")||text.includes("CREATE INDEX"))
   return {rowCount:0,rows:[]};
  if(text.includes("SELECT archived_at"))return {rowCount:1,rows:[
   {archived_at:opts.archived?"2026-01-01":null}]};
  if(text.includes("SELECT c.code,to_char(h.holiday_date")){
   const year=Number(args[1]),items=[...dates].filter(([d])=>d.startsWith(String(year)+"-"));
   const r=coverage.get(String(year));
   return {rowCount:Math.max(items.length,1),rows:items.length?
    items.sort().map(([date,name])=>({code:args[0],date,name,
     revision:r?.revision??null,status:r?.status??null})):
    [{code:args[0],date:null,name:null,revision:r?.revision??null,status:r?.status??null}]};
  }
  if(text.includes("FROM public.smn_national_holiday")&&text.includes("FOR UPDATE")){
   const name=dates.get(String(args[1]));
   return {rowCount:name?1:0,rows:name?[{name}]:[]};
  }
  if(text.includes("SELECT 1 FROM public.smn_national_holiday"))
   return {rowCount:dates.has(String(args[1]))?1:0,rows:[]};
  if(text.includes("INSERT INTO public.smn_national_holiday")&&!text.includes("coverage")){
   const date=String(args[1]);
   if(dates.has(date))return {rowCount:0,rows:[]};
   dates.set(date,String(args[2]));return {rowCount:1,rows:[]};
  }
  if(text.includes("DELETE FROM public.smn_national_holiday")){
   const found=dates.get(String(args[1]))===args[2];if(found)dates.delete(String(args[1]));
   return {rowCount:found?1:0,rows:[]};
  }
  if(text.includes("UPDATE public.smn_national_holiday")){
   const old=String(args[1]),target=args.length===5?String(args[2]):old;
   const oldName=args.length===5?args[4]:args[3];
   if(dates.get(old)!==oldName)return {rowCount:0,rows:[]};
   dates.delete(old);dates.set(target,String(args.length===5?args[3]:args[2]));
   return {rowCount:1,rows:[]};
  }
  if(text.includes("SELECT count(*)::text AS total"))
   return {rowCount:1,rows:[{total:String([...dates.keys()].filter(d=>d.startsWith(args[1]+"-")).length)}]};
  if(text.includes("SELECT status")&&text.includes("FROM public.smn_national_calendar_coverage"))
   return {rowCount:coverage.has(String(args[1]))?1:0,rows:
    coverage.has(String(args[1]))?[{status:coverage.get(String(args[1]))!.status}]:[]};
  if(text.includes("INSERT INTO public.smn_national_calendar_coverage")){
   const year=String(args[1]),old=coverage.get(year);const revision=(old?.revision??0)+1;
   coverage.set(year,{status:String(args[2]),revision});
   return {rowCount:1,rows:[{revision}]};
  }
  if(text.includes("INSERT INTO public.smn_national_holiday_manual_audit")){
   if(opts.auditFails)throw Error("audit-failure");
   audits.push(args);return {rowCount:1,rows:[]};
  }
  throw Error("SQL imprévu : "+text);
 }} as unknown as Client;
 return {client,dates,coverage,sql,audits};
}
const fingerprint=async(db:Client,year:number)=>{
 const read=await readAnnualHolidaySnapshot(db,"FR",year);
 assert.ok(read);return read.fingerprint;
};
describe("Mutations manuelles nationales",()=>{
 it("contrôle date réelle, raison, année concernée et champs supplémentaires",()=>{
  assert.equal(isCivilHolidayDate("2028-02-29"),true);
  assert.equal(isCivilHolidayDate("2027-02-29"),false);
  assert.equal(isCivilHolidayDate("2026-02-30"),false);
  for(const input of [
   {action:"create",date:"2026-02-30",name:"Fête",reason:"Correction",expectedYears:{"2026":"0".repeat(64)}},
   {action:"create",date:"2026-05-01",name:"Fête",reason:"",expectedYears:{"2026":"0".repeat(64)}},
   {action:"create",date:"2026-05-01",name:"Fête",reason:"Correction",expectedYears:{"2025":"0".repeat(64)}},
   {action:"delete",originalDate:"2026-01-01",reason:"Retrait",expectedYears:{"2026":"0".repeat(64)},country:"DE"}
  ])assert.equal(parseManualRequest(input),null);
 });
 it("ajoute une date et sa trace dans la transaction, sans toucher aux snapshots",async()=>{
  const f=fixture(),hash=await fingerprint(f.client,2026);
  const r=await changeManualHoliday(f.client,"FR","admin",{action:"create",date:"2026-05-01",
   name:"Fête du Travail",reason:"Ajout national",expectedYears:{"2026":hash}});
  assert.deepEqual(r,{ok:true,years:[{year:2026,revision:1,status:"partial",count:1}]});
  assert.equal(f.dates.get("2026-05-01"),"Fête du Travail");
  assert.equal(f.audits.length,1);
  assert.equal(f.audits[0][7],"Ajout national");
  assert.equal(f.sql.at(-1),"COMMIT");
  assert.ok(f.sql.every(s=>!s.includes("smn_member")&&!s.includes("capacity_snapshot")&&!s.includes("report")));
 });
 it("une année vidée devient Non configuré avec une trace",async()=>{
  const f=fixture({"2026-01-01":"Jour de l'an"});
  const hash=await fingerprint(f.client,2026);
  const r=await changeManualHoliday(f.client,"FR","admin",{action:"delete",originalDate:"2026-01-01",
   reason:"Date erronée",expectedYears:{"2026":hash}});
  assert.deepEqual(r,{ok:true,years:[{year:2026,revision:1,status:"not-configured",count:0}]});
  assert.equal(f.dates.size,0);
  assert.equal(f.audits[0][2],"delete");
 });
 it("un déplacement interannuel marque chacune des deux années",async()=>{
  const f=fixture({"2026-12-31":"Ancien"});
  const old=await fingerprint(f.client,2026),next=await fingerprint(f.client,2027);
  const r=await changeManualHoliday(f.client,"FR","admin",{action:"update",
   originalDate:"2026-12-31",date:"2027-01-01",name:"Nouveau",
   reason:"Déplacement",expectedYears:{"2026":old,"2027":next}});
  assert.equal(r.ok,true);
  if(r.ok)assert.deepEqual(r.years.map(x=>[x.year,x.count]),[[2026,0],[2027,1]]);
  assert.equal(f.dates.get("2027-01-01"),"Nouveau");
  assert.equal(f.audits.length,1);
 });
 it("refuse la collision sans suppression partielle",async()=>{
  const f=fixture({"2026-01-01":"A","2026-05-01":"B"});
  const hash=await fingerprint(f.client,2026);
  const r=await changeManualHoliday(f.client,"FR","admin",{action:"update",
   originalDate:"2026-01-01",date:"2026-05-01",name:"C",
   reason:"Collision",expectedYears:{"2026":hash}});
  assert.deepEqual(r,{ok:false,error:"date-conflict"});
  assert.equal(f.dates.get("2026-01-01"),"A");
  assert.equal(f.sql.at(-1),"ROLLBACK");
  assert.equal(f.audits.length,0);
 });
 it("détecte la concurrence, y compris un nouvel import sur l'année",async()=>{
  const f=fixture(),old=await fingerprint(f.client,2026);
  f.dates.set("2026-01-01","Import récent");
  const r=await changeManualHoliday(f.client,"FR","admin",{action:"create",
   date:"2026-05-01",name:"B",reason:"Ajout",expectedYears:{"2026":old}});
  assert.deepEqual(r,{ok:false,error:"conflict"});
  assert.equal(f.sql.at(-1),"ROLLBACK");
  assert.equal(f.audits.length,0);
 });
 it("refuse un pays archivé",async()=>{
  const f=fixture({}, {archived:true}),hash=await fingerprint(f.client,2026);
  const r=await changeManualHoliday(f.client,"FR","admin",{action:"create",
   date:"2026-05-01",name:"B",reason:"Ajout",expectedYears:{"2026":hash}});
  assert.deepEqual(r,{ok:false,error:"country-archived"});
 });
 it("si l'audit échoue, le serveur ordonne le rollback",async()=>{
  const f=fixture({}, {auditFails:true}),hash=await fingerprint(f.client,2026);
  await assert.rejects(()=>changeManualHoliday(f.client,"FR","admin",{action:"create",
   date:"2026-05-01",name:"B",reason:"Ajout",expectedYears:{"2026":hash}}),/audit-failure/);
  assert.equal(f.sql.at(-1),"ROLLBACK");
 });
});
