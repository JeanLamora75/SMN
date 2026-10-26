import {createHash,randomUUID} from "node:crypto";
import type {Client} from "pg";
import {isValidCountry} from "../members/location";
import {ensureAnnualValidationSchema} from "./validation-migration";
import {COUNTRY_LIFECYCLE_LOCK} from "../countries/archive-migration";
import {appendAnnualInvalidationAudit} from "./validation-audit";

export type HolidayDate={date:string;name:string};
export type ManualAction="create"|"update"|"delete";
export type ManualError="invalid-input"|"country-not-found"|"country-archived"|
 "not-found"|"date-conflict"|"conflict";
export type ManualResult=
 |{ok:true;years:{year:number;revision:number;status:string;count:number}[]}
 |{ok:false;error:ManualError};
type CalendarSnapshot={country:string;year:number;holidays:HolidayDate[];revision:number;
 status:string|null;fingerprint:string;administrativeValidated:boolean};
type Request={
 action:ManualAction;
 originalDate?:string;date?:string;name?:string;
 reason:string;expectedYears:Record<string,string>;
};
export function isCivilHolidayDate(value:unknown):value is string{
 if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const [year,month,day]=value.split("-").map(Number);
 if(year<1900||year>2200||month<1||month>12||day<1||day>31)return false;
 const parsed=new Date(Date.UTC(year,month-1,day));
 return parsed.getUTCFullYear()===year&&parsed.getUTCMonth()===month-1&&parsed.getUTCDate()===day;
}
export function parseManualRequest(raw:unknown):Request|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(!["create","update","delete"].includes(String(v.action)))return null;
 const action=v.action as ManualAction;
 const allowed=action==="create"?["action","date","name","reason","expectedYears"]:
  action==="update"?["action","originalDate","date","name","reason","expectedYears"]:
   ["action","originalDate","reason","expectedYears"];
 if(Object.keys(v).some(k=>!allowed.includes(k)))return null;
 if((action!=="create"&&!isCivilHolidayDate(v.originalDate))||
   (action!=="delete"&&!isCivilHolidayDate(v.date)))return null;
 const name=typeof v.name==="string"?v.name.trim().replace(/\s+/gu," "):null;
 if(action!=="delete"&&(!name||name.length>120||
  /[\u0000-\u001f\u007f]/u.test(v.name as string)))return null;
 if(typeof v.reason!=="string"||v.reason.trim().length<1||v.reason.trim().length>500||
  /[\u0000-\u001f\u007f]/u.test(v.reason))return null;
 const years=new Set([
  ...(action!=="create"?[String(v.originalDate).slice(0,4)]:[]),
  ...(action!=="delete"?[String(v.date).slice(0,4)]:[])
 ]);
 if(!v.expectedYears||typeof v.expectedYears!=="object"||Array.isArray(v.expectedYears))return null;
 const fingerprints=v.expectedYears as Record<string,unknown>;
 if(Object.keys(fingerprints).length!==years.size||
  [...years].some(year=>typeof fingerprints[year]!=="string"||
   !/^[a-f0-9]{64}$/.test(fingerprints[year] as string)))return null;
 return {action,reason:v.reason.trim(),expectedYears:fingerprints as Record<string,string>,
  ...(action!=="create"?{originalDate:v.originalDate as string}:{}),
  ...(action!=="delete"?{date:v.date as string,name:name!}:{})};
}

/** A single SELECT yields dates, coverage state and a stable optimistic-lock fingerprint. */
export async function readAnnualHolidaySnapshot(db:Client,code:string,year:number):
 Promise<CalendarSnapshot|null>{
 if(!isValidCountry(code)||!Number.isInteger(year)||year<1900||year>2200)
  throw new Error("invalid-calendar-scope");
 const rows=await db.query<{
  code:string;date:string|null;name:string|null;revision:number|null;status:string|null;
  administrative_validated:boolean;
 }>(`SELECT c.code,to_char(h.holiday_date,'YYYY-MM-DD') AS date,h.name,
    v.revision,v.status,coalesce(v.administrative_validated_at IS NOT NULL
     AND v.validated_revision=v.revision,false) AS administrative_validated
    FROM public.smn_country c
    LEFT JOIN public.smn_national_holiday h
     ON h.country_code=c.code AND h.holiday_date>=make_date($2,1,1)
     AND h.holiday_date<make_date($2+1,1,1)
    LEFT JOIN public.smn_national_calendar_coverage v
     ON v.country_code=c.code AND v.calendar_year=$2
    WHERE c.code=$1 ORDER BY h.holiday_date`,[code,year]);
 if(rows.rows.length===0)return null;
 const holidays=rows.rows.flatMap(row=>row.date!==null&&row.name!==null?
  [{date:row.date,name:row.name}]:[]);
 const revision=Number(rows.rows[0].revision??0),status=rows.rows[0].status??null;
 const fingerprint=createHash("sha256").update(JSON.stringify({code,year,revision,status,holidays})).digest("hex");
 return {country:code,year,holidays,revision,status,fingerprint,
  administrativeValidated:rows.rows[0].administrative_validated===true};
}

/** Locks preloader/imports, protects both changed years, writes audit and coverage atomically. */
export async function changeManualHoliday(db:Client,code:string,actorId:string,raw:unknown):
 Promise<ManualResult>{
 const input=parseManualRequest(raw);
 if(!actorId||!isValidCountry(code)||!input)return {ok:false,error:"invalid-input"};
 await ensureAnnualValidationSchema(db);
 await db.query("BEGIN");
 const fail=async(error:ManualError):Promise<ManualResult>=>{
  await db.query("ROLLBACK");
  return {ok:false,error};
 };
 try{
  await db.query("SELECT pg_advisory_xact_lock(20261021,49)");
  await db.query("SELECT pg_advisory_xact_lock(20261021,50)");
  await db.query(COUNTRY_LIFECYCLE_LOCK);
  const country=await db.query<{archived_at:string|null}>(`SELECT archived_at
    FROM public.smn_country WHERE code=$1 FOR UPDATE`,[code]);
  if(country.rowCount!==1)return await fail("country-not-found");
  if(country.rows[0].archived_at!==null)return await fail("country-archived");
  const years=Object.keys(input.expectedYears).map(Number).sort((a,b)=>a-b);
  for(const year of years){
   const state=await readAnnualHolidaySnapshot(db,code,year);
   if(!state||state.fingerprint!==input.expectedYears[String(year)])
    return await fail("conflict");
  }
  const current=input.originalDate?
   await db.query<{name:string}>(`SELECT name FROM public.smn_national_holiday
    WHERE country_code=$1 AND holiday_date=$2::date FOR UPDATE`,
     [code,input.originalDate]):null;
  if(input.originalDate&&current?.rowCount!==1)return await fail("not-found");
  const previousName=current?.rows[0]?.name??null;
  if(input.action==="update"&&input.originalDate===input.date&&previousName===input.name){
   await db.query("COMMIT");
   return {ok:true,years:[]};
  }
  if(input.action!=="delete"&&input.date!==input.originalDate){
   const target=await db.query(`SELECT 1 FROM public.smn_national_holiday
    WHERE country_code=$1 AND holiday_date=$2::date`,[code,input.date]);
   if(target.rowCount) return await fail("date-conflict");
  }
  if(input.action==="create"){
   const inserted=await db.query(`INSERT INTO public.smn_national_holiday
    (country_code,holiday_date,name) VALUES($1,$2::date,$3)
    ON CONFLICT (country_code,holiday_date) DO NOTHING`,[code,input.date,input.name]);
   if(inserted.rowCount!==1)return await fail("date-conflict");
  }else if(input.action==="delete"){
   const deleted=await db.query(`DELETE FROM public.smn_national_holiday
    WHERE country_code=$1 AND holiday_date=$2::date AND name=$3`,
    [code,input.originalDate,previousName]);
   if(deleted.rowCount!==1)return await fail("conflict");
  }else if(input.originalDate===input.date){
   const update=await db.query(`UPDATE public.smn_national_holiday SET name=$3
    WHERE country_code=$1 AND holiday_date=$2::date AND name=$4`,
    [code,input.originalDate,input.name,previousName]);
   if(update.rowCount!==1)return await fail("conflict");
  }else{
   // UNIQUE(country_code,holiday_date) guards the move. Any failure rolls back.
   const update=await db.query(`UPDATE public.smn_national_holiday
    SET holiday_date=$3::date,name=$4
    WHERE country_code=$1 AND holiday_date=$2::date AND name=$5`,
    [code,input.originalDate,input.date,input.name,previousName]);
   if(update.rowCount!==1)return await fail("conflict");
  }
  const result:Extract<ManualResult,{ok:true}>["years"]=[];
  for(const year of years){
   const count=await db.query<{total:string}>(`SELECT count(*)::text AS total
    FROM public.smn_national_holiday
    WHERE country_code=$1 AND holiday_date>=make_date($2,1,1)
    AND holiday_date<make_date($2+1,1,1)`,[code,year]);
   const total=Number(count.rows[0]?.total??0);
   const old=await db.query<{status:string;revision:number;validated_revision:number|null;administrative_validated_at:string|null}>(`SELECT status,revision,validated_revision,administrative_validated_at
    FROM public.smn_national_calendar_coverage
    WHERE country_code=$1 AND calendar_year=$2`,[code,year]);
   const previous=old.rows[0]?.status??"not-configured";
   // Preserve technical coverage of historically complete years for capacity.
   const status=total===0?"not-configured":
    previous==="configured"?"configured":"partial";
   const changed=await db.query<{revision:number}>(`INSERT INTO public.smn_national_calendar_coverage
    (country_code,calendar_year,status,entries_count,diagnostic,source_file,revision,
     administrative_validated_at,validated_revision)
    VALUES($1,$2,$3,$4,$5,'manual',1,NULL,NULL)
    ON CONFLICT (country_code,calendar_year) DO UPDATE SET
     status=EXCLUDED.status,entries_count=EXCLUDED.entries_count,
     diagnostic=EXCLUDED.diagnostic,source_file='manual',
     revision=smn_national_calendar_coverage.revision+1,
     administrative_validated_at=NULL,validated_revision=NULL,
     validated_by=NULL,validation_source=NULL,checked_at=now()
    RETURNING revision`,
    [code,year,status,total,total===0?"manual-year-empty":
     status==="configured"?null:"manual-review"]);
   const newRevision=Number(changed.rows[0].revision);
   const wasValidated=old.rows[0]?.administrative_validated_at!==null&&
    old.rows[0]?.administrative_validated_at!==undefined&&
    old.rows[0]?.validated_revision===old.rows[0]?.revision;
   if(wasValidated)await appendAnnualInvalidationAudit(db,code,year,newRevision,actorId,"manual");
   result.push({year,revision:newRevision,status,count:total});
  }
  await db.query(`INSERT INTO public.smn_national_holiday_manual_audit
   (id,country_code,action,previous_date,new_date,previous_name,new_name,reason,actor_id)
   VALUES($1,$2,$3,$4::date,$5::date,$6,$7,$8,$9)`,
    [randomUUID(),code,input.action,input.originalDate??null,input.date??null,
     previousName,input.name??null,input.reason,actorId]);
  await db.query("COMMIT");
  return {ok:true,years:result};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  // A competing write may win a unique index race after the preflight check.
  if(error&&typeof error==="object"&&"code" in error&&error.code==="23505")
   return {ok:false,error:"date-conflict"};
  throw error;
 }
}
