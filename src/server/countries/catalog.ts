import type {Client} from "pg";
import {isValidCountry} from "../members/location";
export const COUNTRY_SEEDS=[
 {code:"FR",name:"France"},{code:"DE",name:"Allemagne"},
 {code:"GB",name:"Royaume-Uni"},{code:"ES",name:"Espagne"},
 {code:"PT",name:"Portugal"},{code:"IT",name:"Italie"},
 {code:"CA",name:"Canada"}
] as const;
type Row={code:string;name:string;origin:"initial"|"manual";created_at:string};
type CoverageRow={country_code:string;calendar_year:number;status:"configured"|"not-configured"|"invalid";
 entries_count:number;diagnostic:string|null};
type HolidayRow={country_code:string;date:string;name:string};
export type NationalCalendar={status:"configured"|"not-configured"|"invalid";
 holidays:{date:string;name:string}[]|null;
 years:{year:number;status:"configured"|"not-configured"|"invalid";count:number;diagnostic:string|null}[]};
export type Country={code:string;name:string;origin:"initial"|"manual";createdAt:string;
 nationalCalendar:NationalCalendar};
const project=(r:Row):Country=>({code:r.code,name:r.name,origin:r.origin,
 createdAt:r.created_at,nationalCalendar:{status:"not-configured",holidays:null,years:[]}});
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
 const r=await db.query<Row>(`SELECT code,name,origin,created_at::text AS created_at
 FROM public.smn_country ORDER BY code ASC LIMIT 251`);
 if(r.rows.length>250)throw new Error("country-catalog-limit");
 const countries=r.rows.map(project).sort((a,b)=>a.code.localeCompare(b.code));
 const coverage=await db.query<CoverageRow>(`SELECT c.country_code,c.calendar_year,c.status,
   c.entries_count,c.diagnostic FROM public.smn_national_calendar_coverage c
   JOIN public.smn_installation i ON i.id='singleton'
   WHERE c.calendar_year BETWEEN EXTRACT(YEAR FROM i.created_at)::int-2
     AND EXTRACT(YEAR FROM i.created_at)::int+1
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
   year:c.calendar_year,status:c.status,count:c.entries_count,diagnostic:c.diagnostic}));
  const status=years.some(y=>y.status==="invalid")?"invalid":
   years.length===4&&years.every(y=>y.status==="configured")?"configured":"not-configured";
  const entries=holidays.rows.filter(h=>h.country_code===country.code).map(h=>({
   date:h.date,name:h.name}));
  country.nationalCalendar={status,years,holidays:status==="configured"?entries:null};
 }
 return countries;
}
export async function createCountry(db:Client,actorId:string,raw:unknown){
 const input=parseCountryInput(raw);
 if(!actorId||!input)return {ok:false,error:"invalid-input"} as const;
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
