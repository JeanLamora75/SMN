import type {Client} from "pg";
import FR from "./data/FR.json";
import DE from "./data/DE.json";
import GB from "./data/GB.json";

type Holiday = {date:string;name:string};
type LocalBundle = {country:string;years:Record<string,unknown>};
type YearResult = {year:number;status:"configured"|"not-configured"|"invalid";count:number;diagnostic:string|null};
const BUNDLES:Record<string,unknown>={FR,DE,GB};
const ISO_DATE=/^\d{4}-\d{2}-\d{2}$/;

export function validateNationalYear(raw:unknown,code:string,year:number):
 {ok:true;holidays:Holiday[]}|{ok:false;diagnostic:string}{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false,diagnostic:"invalid-file"};
 const bundle=raw as Partial<LocalBundle>;
 if(bundle.country!==code||!bundle.years||typeof bundle.years!=="object"||
  Array.isArray(bundle.years))return {ok:false,diagnostic:"invalid-country-or-years"};
 const entries=(bundle.years as Record<string,unknown>)[String(year)];
 if(entries===undefined)return {ok:false,diagnostic:"missing-year"};
 if(!Array.isArray(entries)||entries.length<1||entries.length>100)
  return {ok:false,diagnostic:"invalid-year-list"};
 const dates=new Set<string>(),holidays:Holiday[]=[];
 for(let i=0;i<entries.length;i++){
  const item=entries[i];
  if(!item||typeof item!=="object"||Array.isArray(item))return {ok:false,diagnostic:`invalid-entry:${i+1}`};
  const v=item as Record<string,unknown>;
  if(Object.keys(v).length!==2||typeof v.date!=="string"||!ISO_DATE.test(v.date)||
   Number(v.date.slice(0,4))!==year||typeof v.name!=="string"||
   v.name.trim().length<1||v.name.length>120||/[\u0000-\u001f\u007f]/u.test(v.name))
    return {ok:false,diagnostic:`invalid-entry:${i+1}`};
  const [y,m,d]=v.date.split("-").map(Number);
  const resolved=new Date(Date.UTC(y,m-1,d));
  if(resolved.getUTCFullYear()!==y||resolved.getUTCMonth()!==m-1||
   resolved.getUTCDate()!==d||dates.has(v.date))
    return {ok:false,diagnostic:`invalid-date-or-duplicate:${i+1}`};
  dates.add(v.date);holidays.push({date:v.date,name:v.name.trim()});
 }
 return {ok:true,holidays};
}

/** Le catalogue est embarqué dans le serveur. Aucune requête HTTP ni accès réseau. */
export async function preloadNationalCalendar(client:Client,country:string,installationYear:number):
 Promise<YearResult[]>{
 if(!/^[A-Z]{2}$/.test(country)||!Number.isInteger(installationYear)||
  installationYear<1902||installationYear>2199)throw new Error("national-calendar-invalid-scope");
 const years=[installationYear-2,installationYear-1,installationYear,installationYear+1];
 const bundle=BUNDLES[country];
 const validated=years.map(year=>{
  if(!bundle)return {year,status:"not-configured" as const,count:0,diagnostic:"missing-country-file",holidays:[]};
  const result=validateNationalYear(bundle,country,year);
  return result.ok
   ? {year,status:"configured" as const,count:result.holidays.length,diagnostic:null,holidays:result.holidays}
   : {year,status:(result.diagnostic==="missing-year"?"not-configured":"invalid") as YearResult["status"],
     count:0,diagnostic:result.diagnostic,holidays:[]};
 });
 await client.query("BEGIN");
 try{
  await client.query("SELECT pg_advisory_xact_lock(20261021,49)");
  await client.query("SELECT pg_advisory_xact_lock(20261021,50)");
  await client.query("SELECT pg_advisory_xact_lock(20261026,279)");
  const found=await client.query<{code:string;archived_at:string|null}>(
   "SELECT code,archived_at::text AS archived_at FROM public.smn_country WHERE code=$1 FOR UPDATE",[country]);
  if(found.rowCount!==1){await client.query("ROLLBACK");return years.map(year=>({
   year,status:"not-configured",count:0,diagnostic:"country-not-in-catalog"}));}
  if(found.rows[0].archived_at!==null){await client.query("ROLLBACK");throw new Error("country-archived");}
  const results:YearResult[]=[];
  for(const value of validated){
   let status=value.status,diagnostic=value.diagnostic,count=value.count;
   if(status==="configured"){
    for(const holiday of value.holidays){
     await client.query(`INSERT INTO public.smn_national_holiday(country_code,holiday_date,name)
       VALUES($1,$2::date,$3) ON CONFLICT (country_code,holiday_date) DO NOTHING`,
       [country,holiday.date,holiday.name]);
    }
    const total=await client.query<{total:string}>(`SELECT count(*)::text AS total
      FROM public.smn_national_holiday WHERE country_code=$1
      AND holiday_date >= make_date($2,1,1) AND holiday_date < make_date($2+1,1,1)`,
     [country,value.year]);
    const actual=Number(total.rows[0]?.total);
    if(actual<value.count){
     status="invalid";diagnostic="unexpected-year-count";
    }else count=actual;
   }
   await client.query(`INSERT INTO public.smn_national_calendar_coverage
      (country_code,calendar_year,status,entries_count,diagnostic,source_file)
      VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT (country_code,calendar_year) DO UPDATE SET
      status=EXCLUDED.status,entries_count=EXCLUDED.entries_count,
      diagnostic=EXCLUDED.diagnostic,source_file=EXCLUDED.source_file,checked_at=now(),
      revision=CASE WHEN smn_national_calendar_coverage.status IS DISTINCT FROM EXCLUDED.status
        OR smn_national_calendar_coverage.entries_count IS DISTINCT FROM EXCLUDED.entries_count
        OR smn_national_calendar_coverage.diagnostic IS DISTINCT FROM EXCLUDED.diagnostic
        THEN smn_national_calendar_coverage.revision+1 ELSE smn_national_calendar_coverage.revision END,
      administrative_validated_at=CASE WHEN smn_national_calendar_coverage.status IS DISTINCT FROM EXCLUDED.status
        OR smn_national_calendar_coverage.entries_count IS DISTINCT FROM EXCLUDED.entries_count
        OR smn_national_calendar_coverage.diagnostic IS DISTINCT FROM EXCLUDED.diagnostic
        THEN NULL ELSE smn_national_calendar_coverage.administrative_validated_at END,
      validated_revision=CASE WHEN smn_national_calendar_coverage.status IS DISTINCT FROM EXCLUDED.status
        OR smn_national_calendar_coverage.entries_count IS DISTINCT FROM EXCLUDED.entries_count
        OR smn_national_calendar_coverage.diagnostic IS DISTINCT FROM EXCLUDED.diagnostic
        THEN NULL ELSE smn_national_calendar_coverage.validated_revision END`,
     [country,value.year,status,status==="configured"?count:0,diagnostic,
      bundle?`${country}.json`:null]);
   results.push({year:value.year,status,count:status==="configured"?count:0,diagnostic});
  }
  await client.query("COMMIT");
  return results;
 }catch(error){await client.query("ROLLBACK").catch(()=>undefined);throw error;}
}

/** Reprise après migration ou changement de pays de référence, sans écriture récurrente. */
export async function ensureReferenceNationalCalendar(client:Client):Promise<void>{
 const setting=await client.query<{country:string|null;year:number}>(`SELECT
   s.reference_country AS country,EXTRACT(YEAR FROM i.created_at)::integer AS year
   FROM public.smn_general_settings s JOIN public.smn_installation i
     ON i.id=s.installation_id WHERE s.installation_id='singleton'`);
 const row=setting.rows[0];
 if(!row?.country)return;
 const coverage=await client.query<{year:number}>(`SELECT calendar_year AS year
   FROM public.smn_national_calendar_coverage WHERE country_code=$1
   AND calendar_year BETWEEN $2 AND $3`,[row.country,row.year-2,row.year+1]);
 const covered=new Set(coverage.rows.map(r=>r.year));
 if([row.year-2,row.year-1,row.year,row.year+1].every(y=>covered.has(y)))return;
 await preloadNationalCalendar(client,row.country,row.year);
}
