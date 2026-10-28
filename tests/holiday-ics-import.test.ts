import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {parseHolidayIcs,executeHolidayIcs} from "../src/server/holidays/ics-import";
import {HOLIDAY_ICS_MIGRATION_SQL} from "../src/server/holidays/ics-migration";

const header="BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SMN//TEST//FR\n";
const footer="\nEND:VCALENDAR";
const event=(body:string)=>"BEGIN:VEVENT\n"+body+"\nEND:VEVENT";
const one=event("UID:one\nDTSTART;VALUE=DATE:20260501\nDTEND;VALUE=DATE:20260502\nSUMMARY:Fête du Travail");
const meeting=event("UID:meeting\nDTSTART;TZID=Europe/Paris:20260503T093000\nDTEND;TZID=Europe/Paris:20260503T103000\nSUMMARY:Réunion");
const repeat=event("UID:repeat\nDTSTART;VALUE=DATE:20260508\nSUMMARY:Récurrence\nRRULE:FREQ=YEARLY");
const multi=event("UID:multi\nDTSTART;VALUE=DATE:20260801\nDTEND;VALUE=DATE:20260805\nSUMMARY:Vacances");
const file=(...events:string[])=>header+events.join("\n")+footer;
const data=(ics:string,stage:"inspect"|"preview"|"commit",selected:string[]=[],fingerprint?:string,
 policy:"skip"|"replace"="skip",country="FR")=>({ics,country,stage,policy,selected,
 ...(fingerprint?{fingerprint}:{})});

function fakeDb(existing:Record<string,string>={},found=true){
 const days=new Map<string,string>(Object.entries(existing));
 const audit:unknown[][]=[];
 const sqls:string[]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  sqls.push(sql);
  if(sql.includes("SELECT revision,validated_revision,administrative_validated_at"))return {rows:[],rowCount:0};

  if(sql.includes("to_regclass('public.smn_country_name_audit')"))
   return {rows:[{schema_version:30,ready:true}],rowCount:1};
  if(sql==="BEGIN"||sql==="COMMIT"||sql==="ROLLBACK"||
     sql.includes("pg_advisory_xact_lock")||sql.includes("ALTER TABLE")||
     sql.includes("CREATE TABLE")||sql.includes("CREATE INDEX"))return {rowCount:0,rows:[]};
  if(sql.includes("SELECT code FROM public.smn_country"))
   return {rowCount:found?1:0,rows:found?[{code:args[0]}]:[]};
  if(sql.includes("SELECT to_char(holiday_date"))
   return {rowCount:0,rows:(args[1] as string[]).filter(d=>days.has(d))
    .map(d=>({date:d,name:days.get(d)}))};
  if(sql.includes("INSERT INTO public.smn_national_holiday(")){
   const date=String(args[1]);
   if(days.has(date))return {rowCount:0,rows:[]};
   days.set(date,String(args[2]));return {rowCount:1,rows:[]};
  }
  if(sql.includes("UPDATE public.smn_national_holiday SET")){
   const date=String(args[1]);
   if(days.get(date)!==String(args[3]))return {rowCount:0,rows:[]};
   days.set(date,String(args[2]));return {rowCount:1,rows:[]};
  }
  if(sql.includes("INSERT INTO public.smn_national_holiday_audit")){
   audit.push(args);return {rowCount:1,rows:[]};
  }
  if(sql.includes("SELECT count(*)::text AS total"))return {rowCount:1,rows:[{
   total:String([...days.keys()].filter(d=>d.startsWith(String(args[1]))).length)
  }]};
  if(sql.includes("INSERT INTO public.smn_national_calendar_coverage"))
   return {rowCount:1,rows:[]};
  throw new Error("unexpected SQL "+sql);
 }} as unknown as Client;
 return {db,days,audit,sqls};
}

describe("ICS national — fichier local, sélection et validation",()=>{
 it("lit les dates et noms sans insérer, et signale les événements non admissibles",async()=>{
  const ics=file(one,meeting,repeat,multi);
  const f=fakeDb();
  const result=await executeHolidayIcs(f.db,data(ics,"inspect"),"admin");
  assert.equal(result.ok,true);
  if(!result.ok)return;
  assert.deepEqual(result.events.map(e=>[e.date,e.name,e.eligible,e.reason]),[
   ["2026-05-01","Fête du Travail",true,null],
   [null,"Réunion",false,"timed-or-invalid-start"],
   ["2026-05-08","Récurrence",false,"recurrence-unsupported"],
   ["2026-08-01","Vacances",false,"multi-day-or-invalid-end"]
  ]);
  assert.equal(f.days.size,0);
  assert.equal(f.audit.length,0);
 });
 it("normalise CRLF, les lignes pliées, les noms échappés et la journée entière sans DTEND",()=>{
  const ics=file(event("UID:a\nDTSTART;VALUE=DATE:19991231\nSUMMARY:Jour\\, spécial")).replaceAll("\n","\r\n");
  const r=parseHolidayIcs(ics);
  assert.equal(r.ok,true);
  if(r.ok){
   assert.equal(r.events[0].date,"1999-12-31");
   assert.equal(r.events[0].name,"Jour, spécial");
   assert.equal(r.events[0].eligible,true);
  }
  const folded=parseHolidayIcs(file(event("DTSTART;VALUE=DATE:20420101\nSUMMARY:Nouvel\n le An")));
  assert.equal(folded.ok,true);
  if(folded.ok)assert.equal(folded.events[0].name,"Nouvelle An");
 });
 it("refuse les dates impossibles, les annulations et les récurrences/Exceptions",()=>{
  for(const [body,reason] of [
   ["DTSTART;VALUE=DATE:20260230\nSUMMARY:Impossible","timed-or-invalid-start"],
   ["DTSTART;VALUE=DATE:20260501\nSUMMARY:Nom\nRDATE;VALUE=DATE:20270501","recurrence-unsupported"],
   ["DTSTART;VALUE=DATE:20260501\nSUMMARY:Nom\nRECURRENCE-ID;VALUE=DATE:20260501","recurrence-unsupported"],
   ["DTSTART;VALUE=DATE:20260501\nSUMMARY:Nom\nSTATUS:CANCELLED","cancelled"],
   ["DTSTART;VALUE=DATE:20260501\nSUMMARY:Nom\nDTEND;TZID=Europe/Paris:20260502T000000","multi-day-or-invalid-end"],
   ["DTSTART;VALUE=DATE:20260501\nSUMMARY:","invalid-name"]
  ]){
   const r=parseHolidayIcs(file(event(body)));
   assert.equal(r.ok,true);
   if(r.ok){assert.equal(r.events[0].eligible,false);assert.equal(r.events[0].reason,reason);}
  }
 });
 it("isole les sous-composants VEVENT interdits sans bloquer les autres événements",()=>{
  const nested=event("DTSTART;VALUE=DATE:20260101\nSUMMARY:Alarme\nBEGIN:VALARM\nACTION:DISPLAY\nEND:VALARM");
  const parsed=parseHolidayIcs(file(nested,one));
  assert.equal(parsed.ok,true);
  if(parsed.ok){
   assert.equal(parsed.events[0].eligible,false);
   assert.equal(parsed.events[0].reason,"nested-component");
   assert.equal(parsed.events[1].eligible,true);
  }
 });
 it("détecte un document invalide, un calendrier vide, des composants mal imbriqués et les limites",()=>{
  for(const ics of ["https://example.org/calendar.ics","BEGIN:VCALENDAR\nEND:VCALENDAR",
   "BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:bad\nEND:VCALENDAR",
   file("BEGIN:VEVENT\nBEGIN:VEVENT\nEND:VEVENT\nEND:VEVENT")
  ]){
   const r=parseHolidayIcs(ics);
   assert.equal(r.ok,false);
   if(!r.ok)assert.equal(r.error,"invalid-ics");
  }
  const tooBig=parseHolidayIcs(file(event("DTSTART;VALUE=DATE:20260101\nSUMMARY:"+"a".repeat(1024*1024))));
  assert.deepEqual(tooBig,{ok:false,error:"ics-too-large"});
 });
 it("prévisualise une sélection uniquement puis importe dans le pays avec origine ICS",async()=>{
  const f=fakeDb();
  const ics=file(meeting,one);
  const initial=await executeHolidayIcs(f.db,data(ics,"inspect"),"admin");
  assert.equal(initial.ok,true);
  const forbidden=await executeHolidayIcs(f.db,data(ics,"preview",["event-1"]),"admin");
  assert.equal(forbidden.ok,false);
  if(!forbidden.ok)assert.equal(forbidden.error,"invalid-selection");
  const preview=await executeHolidayIcs(f.db,data(ics,"preview",["event-2"]),"admin");
  assert.equal(preview.ok,true);
  if(!preview.ok||!preview.preview)return;
  assert.equal(preview.preview.proposed,1);
  assert.equal(f.days.size,0);
  const saved=await executeHolidayIcs(f.db,data(ics,"commit",["event-2"],preview.preview.fingerprint),"admin");
  assert.equal(saved.ok,true);
  if(saved.ok){assert.equal(saved.created,1);assert.equal(saved.replaced,0);}
  assert.equal(f.days.get("2026-05-01"),"Fête du Travail");
  assert.equal(f.audit.length,1);
  assert.equal(f.audit[0][1],"FR");
  assert.equal(f.audit[0][6],"ics");
 });
 it("réutilise les règles de doublon et de correction explicite des CSV",async()=>{
  const f=fakeDb({"2026-05-01":"Ancien nom"});
  const ics=file(one,one);
  const pre=await executeHolidayIcs(f.db,data(ics,"preview",["event-1","event-2"]),"admin");
  assert.equal(pre.ok,true);
  if(!pre.ok||!pre.preview)return;
  assert.equal(pre.preview.proposed,0);
  assert.equal(pre.preview.rejected,2);
  const correction=await executeHolidayIcs(f.db,data(ics,"preview",["event-1"],undefined,"replace"),"admin");
  assert.equal(correction.ok,true);
  if(!correction.ok||!correction.preview)return;
  assert.equal(correction.preview.rows[0].action,"replace");
  const done=await executeHolidayIcs(f.db,
   data(ics,"commit",["event-1"],correction.preview.fingerprint,"replace"),"admin");
  assert.equal(done.ok,true);
  assert.equal(f.days.get("2026-05-01"),"Fête du Travail");
  assert.equal(f.audit[0][3],"Ancien nom");
  assert.equal(f.audit[0][6],"ics");
 });
 it("refuse une confirmation si les données ont changé depuis l'aperçu",async()=>{
  const f=fakeDb(),ics=file(one);
  const pre=await executeHolidayIcs(f.db,data(ics,"preview",["event-1"]),"admin");
  assert.equal(pre.ok,true);
  if(!pre.ok||!pre.preview)return;
  f.days.set("2026-05-01","Mise à jour parallèle");
  const result=await executeHolidayIcs(f.db,
   data(ics,"commit",["event-1"],pre.preview.fingerprint),"admin");
  assert.equal(result.ok,false);
  if(!result.ok)assert.equal(result.error,"preview-expired");
  assert.equal(f.audit.length,0);
  assert.equal(f.sqls.at(-1),"ROLLBACK");
 });
 it("ne propose jamais d'URL ni de synchronisation et vérifie le catalogue",async()=>{
  const f=fakeDb({},false);
  const missing=await executeHolidayIcs(f.db,data(file(one),"inspect"),"admin");
  assert.deepEqual(missing,{ok:false,error:"country-not-found"});
  const withUrl=await executeHolidayIcs(f.db,{...data(file(one),"inspect"),url:"https://example.org"}, "admin");
  assert.deepEqual(withUrl,{ok:false,error:"invalid-input"});
  const mixed=await executeHolidayIcs(f.db,data(file(one),"preview",["event-1","event-1"]),"admin");
  assert.equal(mixed.ok,false);
  if(!mixed.ok)assert.equal(mixed.error,"invalid-selection");
  assert.match(HOLIDAY_ICS_MIGRATION_SQL,/origin IN \('csv','ics'\)/);
  assert.match(HOLIDAY_ICS_MIGRATION_SQL,/schema_version=18/);
  assert.doesNotMatch(HOLIDAY_ICS_MIGRATION_SQL,/DROP TABLE|ON DELETE CASCADE/i);
 });
});
