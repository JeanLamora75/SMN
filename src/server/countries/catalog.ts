import type {Client} from "pg";
import {randomUUID} from "node:crypto";
import {ensureCountryArchiveSchema} from "./archive-migration";
import {isValidCountry} from "../members/location";
export const COUNTRY_SEEDS=[
 {code:"FR",name:"France"},{code:"DE",name:"Allemagne"},
 {code:"GB",name:"Royaume-Uni"},{code:"ES",name:"Espagne"},
 {code:"PT",name:"Portugal"},{code:"IT",name:"Italie"},
 {code:"CA",name:"Canada"}
] as const;
type Row={code:string;name:string;revision?:number;origin:"initial"|"manual";created_at:string;archived_at:string|null};
type CoverageRow={country_code:string;calendar_year:number;status:"configured"|"partial"|"not-configured"|"invalid";
 entries_count:number;diagnostic:string|null;administrative_validated:boolean};
type HolidayRow={country_code:string;date:string;name:string};
export type NationalCalendar={status:"configured"|"partial"|"not-configured"|"invalid";
 holidays:{date:string;name:string}[]|null;
 years:{year:number;status:"configured"|"partial"|"not-configured"|"invalid";count:number;diagnostic:string|null;administrativeValidated:boolean}[]};
export type Country={code:string;name:string;revision:number;archived:boolean;archivedAt:string|null;origin:"initial"|"manual";createdAt:string;
 nationalCalendar:NationalCalendar};
const project=(r:Row):Country=>({code:r.code,name:r.name,revision:r.revision??0,origin:r.origin,
 createdAt:r.created_at,archived:r.archived_at!=null,archivedAt:r.archived_at??null,
 nationalCalendar:{status:"not-configured",holidays:null,years:[]}});
export function parseCountryInput(input:unknown):{code:string;name:string}|null{
 if(!input||Array.isArray(input)||typeof input!=="object")return null;
 const obj=input as Record<string,unknown>;
 if(Object.keys(obj).length!==2||typeof obj.code!=="string"||typeof obj.name!=="string")return null;
 const code=obj.code.trim().toUpperCase(),name=obj.name.trim().replace(/\s+/gu," ");
 if(!isValidCountry(code)||name.length<1||name.length>120||
  /[\u0000-\u001f\u007f]/u.test(obj.name))return null;
 return {code,name};
}
export async function listCountries(db:Client):Promise<Country[]>{
 await ensureCountryArchiveSchema(db);
 const r=await db.query<Row>(`SELECT code,name,revision,origin,created_at::text AS created_at,
 archived_at::text AS archived_at
 FROM public.smn_country ORDER BY code ASC LIMIT 251`);
 if(r.rows.length>250)throw new Error("country-catalog-limit");
 const countries=r.rows.map(project).sort((a,b)=>a.code.localeCompare(b.code));
 const coverage=await db.query<CoverageRow>(`SELECT c.country_code,c.calendar_year,c.status,
   c.entries_count,c.diagnostic,
   coalesce(c.administrative_validated_at IS NOT NULL AND
    c.validated_revision=c.revision,false) AS administrative_validated
   FROM public.smn_national_calendar_coverage c
   ORDER BY c.calendar_year ASC`);
 const holidays=await db.query<HolidayRow>(`SELECT h.country_code,
   to_char(h.holiday_date,'YYYY-MM-DD') AS date,h.name
   FROM public.smn_national_holiday h
   JOIN public.smn_installation i ON i.id='singleton'
   WHERE h.holiday_date >= make_date(EXTRACT(YEAR FROM i.created_at)::int-2,1,1)
     AND h.holiday_date < make_date(EXTRACT(YEAR FROM i.created_at)::int+2,1,1)
   ORDER BY h.holiday_date ASC`);
 for(const country of countries){
  const years=coverage.rows.filter(c=>c.country_code===country.code).map(c=>({
   year:c.calendar_year,status:c.status,count:c.entries_count,diagnostic:c.diagnostic,
   administrativeValidated:c.administrative_validated}));
  const status=years.some(y=>y.status==="invalid")?"invalid":
   years.some(y=>y.status==="partial")?"partial":
   years.length>=4&&years.every(y=>y.status==="configured")?"configured":"not-configured";
  const entries=holidays.rows.filter(h=>h.country_code===country.code).map(h=>({
   date:h.date,name:h.name}));
  country.nationalCalendar={status,years,holidays:status==="configured"?entries:null};
 }
 return countries;
}
export async function createCountry(db:Client,actorId:string,raw:unknown){
 const input=parseCountryInput(raw);
 if(!actorId||!input)return {ok:false,error:"invalid-input"} as const;
 await ensureCountryArchiveSchema(db);
 await db.query("BEGIN");
 try{
  const r=await db.query<Row>(`INSERT INTO public.smn_country(code,name,origin,created_by)
 VALUES($1,$2,'manual',$3) ON CONFLICT (code) DO NOTHING
 RETURNING code,name,origin,created_at::text AS created_at`,[input.code,input.name,actorId]);
  if(r.rows.length!==1){await db.query("ROLLBACK");return {ok:false,error:"duplicate-code"} as const;}
  await db.query("COMMIT");
  return {ok:true,country:project(r.rows[0])} as const;
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}

/** National dates for exactly one country and year, including years outside install range. */
export async function listNationalHolidays(db:Client,code:string,year:number):
 Promise<{date:string;name:string}[]|null>{
 if(!isValidCountry(code)||!Number.isInteger(year)||year<1900||year>2200)
  throw new Error("invalid-national-calendar-scope");
 const result=await db.query<{code:string;date:string|null;name:string|null}>(`
 SELECT c.code,to_char(h.holiday_date,'YYYY-MM-DD') AS date,h.name
 FROM public.smn_country c
 LEFT JOIN public.smn_national_holiday h
 ON h.country_code=c.code
 AND h.holiday_date>=make_date($2,1,1)
 AND h.holiday_date<make_date($2+1,1,1)
 WHERE c.code=$1 ORDER BY h.holiday_date ASC`,[code,year]);
 if(result.rows.length===0)return null;
 return result.rows.filter((row):row is {code:string;date:string;name:string}=>
  row.date!==null&&row.name!==null).map(({date,name})=>({date,name}));
}

export function parseRenameCountryInput(raw:unknown):{name:string;revision:number}|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const value=raw as Record<string,unknown>;
 if(Object.keys(value).length!==2||typeof value.name!=="string"||
  !Number.isInteger(value.revision)||Number(value.revision)<0||
  Number(value.revision)>2147483647)return null;
 const name=value.name.trim().replace(/\s+/gu," ");
 if(!name||name.length>120||/[\u0000-\u001f\u007f]/u.test(value.name))return null;
 return {name,revision:Number(value.revision)};
}

/** Rename only the display label. ISO references and national dates remain untouched. */
export async function renameCountry(db:Client,code:string,actorId:string,raw:unknown){
 const input=parseRenameCountryInput(raw);
 if(!actorId||!isValidCountry(code)||!input)
  return {ok:false,error:"invalid-input"} as const;
 await ensureCountryArchiveSchema(db);
 await db.query("BEGIN");
 try{
  const row=await db.query<{name:string;revision:number;archived_at:string|null}>(`SELECT name,revision,archived_at
   FROM public.smn_country WHERE code=$1 FOR UPDATE`,[code]);
  if(row.rowCount!==1){
   await db.query("ROLLBACK");
   return {ok:false,error:"not-found"} as const;
  }
  const old=row.rows[0];
  if(old.archived_at!=null){await db.query("ROLLBACK");return {ok:false,error:"archived"} as const;}
  if(old.revision!==input.revision){
   await db.query("ROLLBACK");
   return {ok:false,error:"conflict"} as const;
  }
  if(old.name===input.name){
   await db.query("COMMIT");
   return {ok:true,unchanged:true,code,name:old.name,revision:old.revision} as const;
  }
  const changed=await db.query<{name:string;revision:number}>(`UPDATE public.smn_country
    SET name=$2,revision=revision+1
    WHERE code=$1 AND revision=$3 RETURNING name,revision`,
   [code,input.name,input.revision]);
  if(changed.rowCount!==1){
   await db.query("ROLLBACK");
   return {ok:false,error:"conflict"} as const;
  }
  await db.query(`INSERT INTO public.smn_country_name_audit
   (id,country_code,revision,previous_name,new_name,actor_id)
   VALUES($1,$2,$3,$4,$5,$6)`,
   [randomUUID(),code,changed.rows[0].revision,old.name,input.name,actorId]);
  await db.query("COMMIT");
  return {ok:true,unchanged:false,code,name:input.name,revision:changed.rows[0].revision} as const;
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
