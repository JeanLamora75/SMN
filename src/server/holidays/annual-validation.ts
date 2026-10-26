import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {isValidCountry} from "../members/location";
import {isCivilHolidayDate,readAnnualHolidaySnapshot} from "./manual";
import {ensureAnnualValidationSchema} from "./validation-migration";

export type YearIssue={code:string;severity:"blocking"|"warning";details?:string};
type Snapshot=NonNullable<Awaited<ReturnType<typeof readAnnualHolidaySnapshot>>>;
type Coverage={status:string|null;entries_count:number|null;diagnostic:string|null;
 source_file:string|null;revision:number|null;validated_revision:number|null;administrative_validated_at:string|null};
export type AnnualDiagnostic={country:string;year:number;revision:number;fingerprint:string;
 count:number;status:string|null;source:string|null;blocking:YearIssue[];warnings:YearIssue[];
 administrativeValidated:boolean;archived:boolean};

export function diagnoseNationalYear(snapshot:Snapshot,coverage:Coverage|null,archived:boolean):AnnualDiagnostic{
 const issues:YearIssue[]=[];
 const problem=(code:string,severity:YearIssue["severity"],details?:string)=>
  issues.push({code,severity,...(details?{details}:{})});
 if(archived)problem("country-archived","blocking");
 if(snapshot.holidays.length===0)problem("empty-year","blocking");
 if(coverage?.status==="invalid")problem("invalid-coverage","blocking",coverage.diagnostic??undefined);
 const used=new Set<string>();
 for(const holiday of snapshot.holidays){
  if(!isCivilHolidayDate(holiday.date)||!holiday.date.startsWith(String(snapshot.year)+"-"))
   problem("invalid-date","blocking",holiday.date);
  if(!holiday.name.trim()||holiday.name.length>120||
   /[\u0000-\u001f\u007f]/u.test(holiday.name))problem("invalid-name","blocking",holiday.date);
  if(used.has(holiday.date))problem("duplicate-date","blocking",holiday.date);
  used.add(holiday.date);
 }
 if(coverage&&coverage.entries_count!==null&&
  Number(coverage.entries_count)!==snapshot.holidays.length)
  problem("count-mismatch","blocking",String(coverage.entries_count)+" / "+snapshot.holidays.length);
 if(!coverage)problem("coverage-missing","warning");
 if(!coverage?.source_file)problem("source-missing","warning");
 if(coverage?.diagnostic&&coverage.status!=="invalid")
  problem("coverage-note","warning",coverage.diagnostic);
 // Counts and apparently valid dates cannot establish completeness in a country.
 problem("national-completeness-unverified","warning");
 problem("national-only","warning");
 return {country:snapshot.country,year:snapshot.year,revision:snapshot.revision,
  fingerprint:snapshot.fingerprint,count:snapshot.holidays.length,status:snapshot.status,
  source:coverage?.source_file??null,
  blocking:issues.filter(i=>i.severity==="blocking"),warnings:issues.filter(i=>i.severity==="warning"),
  administrativeValidated:snapshot.administrativeValidated,archived};
}
export function parseAnnualValidationRequest(raw:unknown):{year:number;fingerprint:string}|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const o=raw as Record<string,unknown>;
 if(Object.keys(o).length!==4||!Number.isInteger(o.year)||Number(o.year)<1900||
  Number(o.year)>2200||o.confirmComplete!==true||o.source!=="manual-review"||
  typeof o.fingerprint!=="string"||!/^[0-9a-f]{64}$/.test(o.fingerprint))return null;
 return {year:Number(o.year),fingerprint:o.fingerprint};
}
async function readData(db:Client,code:string,year:number){
 const snapshot=await readAnnualHolidaySnapshot(db,code,year);
 if(!snapshot)return null;
 const country=await db.query<{archived_at:string|null}>(`SELECT archived_at
  FROM public.smn_country WHERE code=$1`,[code]);
 if(country.rowCount!==1)return null;
 const meta=await db.query<Coverage>(`SELECT status,entries_count,diagnostic,source_file,
  revision,validated_revision,administrative_validated_at
  FROM public.smn_national_calendar_coverage WHERE country_code=$1 AND calendar_year=$2`,
  [code,year]);
 return diagnoseNationalYear(snapshot,meta.rows[0]??null,country.rows[0].archived_at!==null);
}
export async function readAnnualValidationDiagnostic(db:Client,code:string,year:number){
 if(!isValidCountry(code)||!Number.isInteger(year)||year<1900||year>2200)
  throw Error("invalid-national-validation-scope");
 await ensureAnnualValidationSchema(db);
 return readData(db,code,year);
}

export async function certifyNationalYear(db:Client,code:string,actor:string,raw:unknown){
 const input=parseAnnualValidationRequest(raw);
 if(!input||!isValidCountry(code)||!actor)
  return {ok:false,error:"invalid-input"} as const;
 await ensureAnnualValidationSchema(db);
 await db.query("BEGIN");
 const reject=async(error:string,diagnostic?:AnnualDiagnostic)=>{
  await db.query("ROLLBACK");
  return {ok:false,error,...(diagnostic?{diagnostic}:{})};
 };
 try{
  // Shared lock order with imports and manual CRUD.
  await db.query("SELECT pg_advisory_xact_lock(20261021,49)");
  await db.query("SELECT pg_advisory_xact_lock(20261021,50)");
  const locked=await db.query(`SELECT code FROM public.smn_country
   WHERE code=$1 FOR UPDATE`,[code]);
  if(locked.rowCount!==1)return await reject("country-not-found");
  const current=await readData(db,code,input.year);
  if(!current)return await reject("country-not-found");
  if(current.fingerprint!==input.fingerprint)return await reject("conflict",current);
  if(current.blocking.length>0)return await reject("diagnostic-blocked",current);
  if(current.administrativeValidated){
   await db.query("COMMIT");
   return {ok:true,unchanged:true,diagnostic:current} as const;
  }
  const updated=await db.query(`INSERT INTO public.smn_national_calendar_coverage
   (country_code,calendar_year,status,entries_count,diagnostic,source_file,revision,
    administrative_validated_at,validated_revision,validated_by,validation_source)
   VALUES($1,$2,'configured',$3,NULL,'manual-review',0,now(),0,$4,'manual-review')
   ON CONFLICT(country_code,calendar_year) DO UPDATE SET
    status='configured',entries_count=EXCLUDED.entries_count,
    administrative_validated_at=now(),
    validated_revision=smn_national_calendar_coverage.revision,
    validated_by=EXCLUDED.validated_by,validation_source='manual-review',checked_at=now()
   RETURNING revision`,[code,input.year,current.count,actor]);
  const revision=Number(updated.rows[0]?.revision);
  await db.query(`INSERT INTO public.smn_national_calendar_validation_audit
   (id,country_code,calendar_year,action,revision,fingerprint,actor_id,source)
   VALUES($1,$2,$3,'validate',$4,$5,$6,'manual-review')`,
   [randomUUID(),code,input.year,revision,input.fingerprint,actor]);
  // Return the new revision/fingerprint, never the pre-validation inspection token.
  const certified=await readData(db,code,input.year);
  if(!certified)throw Error("certification-result-unavailable");
  await db.query("COMMIT");
  return {ok:true,unchanged:false,diagnostic:certified} as const;
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}

