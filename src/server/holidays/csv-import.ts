import {createHash,randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureAnnualValidationSchema} from "./validation-migration";
import {COUNTRY_LIFECYCLE_LOCK,ensureCountryArchiveSchema} from "../countries/archive-migration";
import {appendAnnualInvalidationAudit} from "./validation-audit";

export type ConflictPolicy="skip"|"replace";
export type CsvRow={
 line:number;date:string;name:string;country:string;
 action:"create"|"replace"|"reject";
 reason:string|null;previousName:string|null;
};
export type CsvPreview={
 country:string;policy:ConflictPolicy;rows:CsvRow[];
 proposed:number;rejected:number;fingerprint:string;
};
export type CsvImportResult=
 |{ok:true;preview:CsvPreview;created?:number;replaced?:number;changedYears?:number[]}
 |{ok:false;error:"invalid-input"|"invalid-csv"|"csv-too-large"|"country-not-found"|"preview-expired";preview?:CsvPreview};
const MAX_BYTES=1024*1024;
const MAX_ROWS=5000;
type CsvLine={line:number;cells:string[]};
type Raw={country:string;policy:ConflictPolicy;csv:string;stage:"preview"|"commit";fingerprint?:string};

export function parseCsvRequest(value:unknown):Raw|null{
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 const v=value as Record<string,unknown>;
 if(v.stage!=="preview"&&v.stage!=="commit")return null;
 if(typeof v.country!=="string"||!/^[A-Z]{2}$/.test(v.country)||
  (v.policy!=="skip"&&v.policy!=="replace")||typeof v.csv!=="string"||
  (v.stage==="commit"&&(typeof v.fingerprint!=="string"||!/^[a-f0-9]{64}$/.test(v.fingerprint)))||
  Object.keys(v).some(k=>!["country","policy","csv","stage","fingerprint"].includes(k)))return null;
 return {country:v.country,policy:v.policy,csv:v.csv,stage:v.stage,
  ...(typeof v.fingerprint==="string"?{fingerprint:v.fingerprint}:{})};
}

function scanCsv(csv:string):{ok:true;lines:CsvLine[]}|{ok:false;error:"invalid-csv"|"csv-too-large"}{
 if(Buffer.byteLength(csv,"utf8")>MAX_BYTES)return {ok:false,error:"csv-too-large"};
 const text=csv.replace(/^\uFEFF/,"");
 if(!text.trim()||text.includes("\uFFFD")||text.includes("\u0000"))return {ok:false,error:"invalid-csv"};
 const delimiter=text.split(/\r?\n/u,1)[0].includes(";")?";":",";
 let quote=false,closed=false,field="",cells:string[]=[],line=1,begin=1;
 const lines:CsvLine[]=[];
 function append(){
  cells.push(field.trim());field="";closed=false;
  if(lines.length>MAX_ROWS)return false;
  lines.push({line:begin,cells});
  cells=[];begin=line;
  return true;
 }
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(quote){
   if(ch==='"'){
    if(text[i+1]==='"'){field+='"';i++;}else{quote=false;closed=true;}
   }else{field+=ch;if(ch==="\n")line++;}
   continue;
  }
  if(ch==='"'){if(closed||field.trim())return {ok:false,error:"invalid-csv"};quote=true;continue;}
  if(ch===delimiter){cells.push(field.trim());field="";closed=false;continue;}
  if(ch==="\n"||ch==="\r"){
   if(ch==="\r"&&text[i+1]!=="\n")return {ok:false,error:"invalid-csv"};
   if(ch==="\r")i++;
   line++;
   if(!append())return {ok:false,error:"csv-too-large"};
   continue;
  }
  if(closed&&!/\s/u.test(ch))return {ok:false,error:"invalid-csv"};
  field+=ch;
  if(field.length>MAX_BYTES)return {ok:false,error:"csv-too-large"};
 }
 if(quote)return {ok:false,error:"invalid-csv"};
 if(field||cells.length){if(!append())return {ok:false,error:"csv-too-large"};}
 if(lines.length<2||lines.length>MAX_ROWS+1)return {ok:false,error:"invalid-csv"};
 const header=lines.shift()!;
 if(header.cells.length!==3||
  !["date","name","country"].every((v,i)=>{
   const cell=header.cells[i]?.toLowerCase();
   return cell===(i===1?"nom":i===2?"pays":"date")||cell===v;
  }))return {ok:false,error:"invalid-csv"};
 return {ok:true,lines};
}
function validDate(value:string):boolean{
 if(!/^\d{4}-\d{2}-\d{2}$/u.test(value))return false;
 const [y,m,d]=value.split("-").map(Number);
 if(y<1900||y>2200)return false;
 const date=new Date(Date.UTC(y,m-1,d));
 return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d;
}
function parseRows(lines:CsvLine[],country:string):CsvRow[]{
 const used=new Set<string>();
 return lines.map(({line,cells})=>{
  const [date="",name="",rowCountry=""]=cells;
  let reason:string|null=null;
  if(cells.length!==3)reason="column-count";
  else if(!validDate(date))reason="invalid-date";
  else if(!name||name.length>120||/[\u0000-\u001f\u007f]/u.test(name))reason="invalid-name";
  else if(rowCountry.toUpperCase()!==country)reason="country-mismatch";
  else if(used.has(date))reason="duplicate-in-file";
  if(!reason)used.add(date);
  return {line,date,name,country:rowCountry,action:"reject" as const,
   reason,previousName:null};
 });
}
async function loadRows(db:Client,country:string,dates:string[]):Promise<Map<string,string>>{
 if(dates.length===0)return new Map();
 const rows=await db.query<{date:string;name:string}>(`
  SELECT to_char(holiday_date,'YYYY-MM-DD') AS date,name
  FROM public.smn_national_holiday
  WHERE country_code=$1 AND holiday_date=ANY($2::date[])
 `,[country,dates]);
 return new Map(rows.rows.map(r=>[r.date,r.name]));
}
function buildPreview(country:string,policy:ConflictPolicy,csv:string,rows:CsvRow[],
 existing:Map<string,string>):CsvPreview{
 const enriched=rows.map(row=>{
  if(row.reason)return row;
  const original=existing.get(row.date);
  if(original===undefined)return {...row,action:"create" as const};
  if(original===row.name||policy==="skip")return {...row,action:"reject" as const,
   reason:original===row.name?"already-identical":"existing-date",previousName:original};
  return {...row,action:"replace" as const,previousName:original};
 });
 const snapshot=enriched.map(r=>[r.date,r.action,r.reason,r.previousName]);
 const fingerprint=createHash("sha256").update(JSON.stringify({country,policy,csv,snapshot})).digest("hex");
 return {country,policy,rows:enriched,
  proposed:enriched.filter(r=>r.action!=="reject").length,
  rejected:enriched.filter(r=>r.action==="reject").length,fingerprint};
}
async function previewInDb(db:Client,input:Raw,rows:CsvRow[]):Promise<CsvPreview>{
 const existing=await loadRows(db,input.country,rows.filter(r=>!r.reason).map(r=>r.date));
 return buildPreview(input.country,input.policy,input.csv,rows,existing);
}

export async function executeHolidayCsv(db:Client,raw:unknown,actorId:string,
 origin:"csv"|"ics"="csv"):Promise<CsvImportResult>{
 const input=parseCsvRequest(raw);
 if(!input||!actorId)return {ok:false,error:"invalid-input"};
 const parsed=scanCsv(input.csv);
 if(!parsed.ok)return {ok:false,error:parsed.error};
 const rows=parseRows(parsed.lines,input.country);
 if(input.stage==="preview"){
  await ensureCountryArchiveSchema(db);
  const country=await db.query("SELECT code FROM public.smn_country WHERE code=$1 AND archived_at IS NULL",[input.country]);
  if(country.rowCount!==1)return {ok:false,error:"country-not-found"};
  return {ok:true,preview:await previewInDb(db,input,rows)};
 }
 await ensureAnnualValidationSchema(db);
 await db.query("BEGIN");
 try{
  // Same lock as the national preload prevents a concurrent automatic import.
  await db.query("SELECT pg_advisory_xact_lock(20261021,49)");
  await db.query("SELECT pg_advisory_xact_lock(20261021,50)");
  await db.query(COUNTRY_LIFECYCLE_LOCK);
  const found=await db.query("SELECT code FROM public.smn_country WHERE code=$1",[input.country]);
  if(found.rowCount!==1){await db.query("ROLLBACK");return {ok:false,error:"country-not-found"};}
  const preview=await previewInDb(db,input,rows);
  if(preview.fingerprint!==input.fingerprint){
   await db.query("ROLLBACK");
   return {ok:false,error:"preview-expired",preview};
  }
  let created=0,replaced=0;
  const years=new Set<number>();
  for(const row of preview.rows){
   if(row.action==="reject")continue;
   if(row.action==="create"){
    const inserted=await db.query(`INSERT INTO public.smn_national_holiday(country_code,holiday_date,name)
      VALUES($1,$2::date,$3) ON CONFLICT (country_code,holiday_date) DO NOTHING`,
      [input.country,row.date,row.name]);
    if(inserted.rowCount!==1)throw new Error("csv-insert-conflict");
    created++;
   }else{
    const changed=await db.query(`UPDATE public.smn_national_holiday SET name=$3
      WHERE country_code=$1 AND holiday_date=$2::date AND name=$4`,
      [input.country,row.date,row.name,row.previousName]);
    if(changed.rowCount!==1)throw new Error("csv-update-conflict");
    replaced++;
   }
   years.add(Number(row.date.slice(0,4)));
   await db.query(`INSERT INTO public.smn_national_holiday_audit
      (id,country_code,holiday_date,previous_name,new_name,action,origin,actor_id)
      VALUES($1,$2,$3::date,$4,$5,$6,$7,$8)`,
      [randomUUID(),input.country,row.date,row.previousName,row.name,row.action,origin,actorId]);
  }
  for(const year of years){
   const prior=await db.query<{
    revision:number;validated_revision:number|null;administrative_validated_at:string|null;
   }>(`SELECT revision,validated_revision,administrative_validated_at
    FROM public.smn_national_calendar_coverage WHERE country_code=$1 AND calendar_year=$2`,
    [input.country,year]);
   const wasValidated=prior.rows[0]?.administrative_validated_at!=null&&
    prior.rows[0]?.validated_revision===prior.rows[0]?.revision;
   const n=await db.query<{total:string}>(`SELECT count(*)::text AS total
     FROM public.smn_national_holiday WHERE country_code=$1
     AND holiday_date>=make_date($2,1,1) AND holiday_date<make_date($2+1,1,1)`,
     [input.country,year]);
   await db.query(`INSERT INTO public.smn_national_calendar_coverage
     (country_code,calendar_year,status,entries_count,diagnostic,source_file,
      revision,administrative_validated_at,validated_revision,validated_by,validation_source)
     VALUES($1,$2,'partial',$3,$4,$5,1,NULL,NULL,NULL,NULL)
     ON CONFLICT (country_code,calendar_year) DO UPDATE SET
      status=CASE WHEN smn_national_calendar_coverage.status='configured'
       THEN 'configured' ELSE 'partial' END,
      entries_count=EXCLUDED.entries_count,
      diagnostic=CASE WHEN smn_national_calendar_coverage.status='configured'
       THEN NULL ELSE EXCLUDED.diagnostic END,
      revision=smn_national_calendar_coverage.revision+1,
      administrative_validated_at=NULL,validated_revision=NULL,
      validated_by=NULL,validation_source=NULL,checked_at=now()
     RETURNING revision`,
     [input.country,year,Number(n.rows[0]?.total),origin+'-partial',origin]);
   if(wasValidated){
    const latest=await db.query<{revision:number}>(`SELECT revision
     FROM public.smn_national_calendar_coverage
     WHERE country_code=$1 AND calendar_year=$2`,[input.country,year]);
    await appendAnnualInvalidationAudit(db,input.country,year,
     Number(latest.rows[0].revision),actorId,origin);
   }
  }
  await db.query("COMMIT");
  return {ok:true,preview,created,replaced,changedYears:[...years].sort((a,b)=>b-a)};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
