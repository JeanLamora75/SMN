import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {isValidDate} from "./assignment";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DISALLOWED=new Set(["EU","UN","UK","QO","ZZ","XK","AC","CP","DG","EA","IC","TA"]);
const countries=new Intl.DisplayNames(["en"],{type:"region",fallback:"none"});
export function isValidCountry(country:unknown):country is string{
 return typeof country==="string"&&/^[A-Z]{2}$/.test(country)&&
  !DISALLOWED.has(country)&&countries.of(country)!==undefined;
}
export function isValidIanaZone(value:unknown):value is string{
 if(typeof value!=="string"||value.length>128||
  !/^(?:[A-Za-z_+-][A-Za-z0-9_+.-]*(?:\/[A-Za-z0-9_+.-]+){1,3}|UTC)$/.test(value))
  return false;
 try{new Intl.DateTimeFormat("en",{timeZone:value});return true;}
 catch{return false;}
}
const cleanOptional=(value:unknown,max:number):string|null|undefined=>{
 if(value===null)return null;
 if(typeof value!=="string")return undefined;
 if(/[\u0000-\u001f\u007f]/u.test(value))return undefined;
 const result=value.trim().replace(/\s+/gu," ");
 return result.length>max?undefined:result||null;
};
export type LocationChange={countryIso2:string|null;region:string|null;city:string|null;
 timeZone:string|null;effectiveFrom:string;revision:number};
export type LocationRow={revision:number;effective_from:string;country_iso2:string|null;
 region:string|null;city:string|null;time_zone:string|null;
 source:"manual"|"installation-default";created_at:string};
export type EffectiveLocation={revision:number;effectiveFrom:string;countryIso2:string|null;
 region:string|null;city:string|null;timeZone:string|null;
 source:"manual"|"installation-default"};
export type MemberEventDisplay={utc:string;timeZone:string;label:string;
 parts:{year:string;month:string;day:string;hour:string;minute:string}};
export type LocationState={memberId:string;teamId:string;archived:boolean;today:string;
 suggestedCountryIso2:string|null;configured:boolean;current:EffectiveLocation|null;
 effective:EffectiveLocation|null;versions:LocationRow[];
 requestedOn:string;display:MemberEventDisplay|null;
 holidayCalendarScope:"national-only";regionalHolidayAuto:false;holidayDataAvailable:false};
export type LocationResult={ok:true;revision:number}|
 {ok:false;error:"invalid-input"|"not-found"|"archived"|"conflict"|"date-in-past"|"date-before-latest"};
export function parseLocationChange(raw:unknown):LocationChange|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).length!==6||typeof v.revision!=="number"||
  !Number.isSafeInteger(v.revision)||v.revision<0||!isValidDate(v.effectiveFrom))return null;
 const country=typeof v.countryIso2==="string"?v.countryIso2.trim().toUpperCase():v.countryIso2;
 if(country!==null&&!isValidCountry(country))return null;
 const region=cleanOptional(v.region,120),city=cleanOptional(v.city,120);
 if(region===undefined||city===undefined)return null;
 let zone=cleanOptional(v.timeZone,128);
 if(zone===undefined)return null;
 if(zone!==null&&!isValidIanaZone(zone))return null;
 if(zone!==null)zone=new Intl.DateTimeFormat("en",{timeZone:zone}).resolvedOptions().timeZone;
 return {countryIso2:country as string|null,region,city,timeZone:zone,
  effectiveFrom:v.effectiveFrom as string,revision:v.revision};
}
function mapRow(row:LocationRow):EffectiveLocation{
 if(!isValidDate(row.effective_from)||
  (row.country_iso2!==null&&!isValidCountry(row.country_iso2))||
  (row.time_zone!==null&&!isValidIanaZone(row.time_zone))||
  !Number.isSafeInteger(row.revision)||row.revision<1)
  throw new Error("member-location-invalid-row");
 return {revision:row.revision,effectiveFrom:row.effective_from,
  countryIso2:row.country_iso2,region:row.region,city:row.city,
  timeZone:row.time_zone,source:row.source};
}
export function resolveMemberLocation(versions:readonly LocationRow[],onDate:string):EffectiveLocation|null{
 if(!isValidDate(onDate))throw new Error("member-location-invalid-date");
 const latest=versions.filter(r=>r.effective_from<=onDate).sort(
  (a,b)=>a.effective_from.localeCompare(b.effective_from)||a.revision-b.revision).at(-1);
 return latest?mapRow(latest):null;
}
export function formatMemberEvent(instant:string,zone:string):MemberEventDisplay{
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(instant)||
  !isValidIanaZone(zone))throw new Error("member-event-invalid-input");
 const date=new Date(instant);
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,19)!==instant.slice(0,19))
  throw new Error("member-event-invalid-input");
 const fmt=new Intl.DateTimeFormat("fr-FR",{
  timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZoneName:"shortOffset"});
 const localized=fmt.formatToParts(date);
 const value=(type:string)=>localized.find(p=>p.type===type)?.value??"";
 const parts={year:value("year"),month:value("month"),day:value("day"),
  hour:value("hour"),minute:value("minute")};
 return {utc:date.toISOString(),timeZone:zone,label:fmt.format(date),parts};
}
async function member(client:Client,id:string,lock:boolean){
 const q=await client.query<{id:string;archived_at:string|null;team_id:string}>(
  `SELECT m.id,m.archived_at::text AS archived_at,b.team_id
   FROM public.smn_member m JOIN public.smn_member_batch b
    ON b.id=m.batch_id AND b.installation_id=m.installation_id
   JOIN public.smn_team t ON t.id=b.team_id AND t.installation_id=m.installation_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE m.id=$1 AND m.installation_id='singleton'
    AND i.state='initialized' AND i.mode IN ('scrum','kanban')`+(lock?" FOR UPDATE OF m":""),
  [id]);
 return q.rows.length===1?q.rows[0]:null;
}
async function versions(client:Client,id:string){
 const r=await client.query<LocationRow>(`SELECT revision,effective_from::text AS effective_from,
   country_iso2,region,city,time_zone,source,created_at::text AS created_at
   FROM public.smn_member_location WHERE member_id=$1
   ORDER BY revision ASC LIMIT 201`,[id]);
 if(r.rows.length>200)throw new Error("member-location-history-limit");
 r.rows.forEach(mapRow);
 return r.rows;
}
async function today(client:Client){
 const r=await client.query<{today:string}>("SELECT CURRENT_DATE::text AS today");
 if(!isValidDate(r.rows[0]?.today))throw new Error("member-location-clock-invalid");
 return r.rows[0].today;
}
export async function readMemberLocation(client:Client,id:string,onDate?:string,
 instant?:string):Promise<LocationState>{
 if(!UUID.test(id)||(onDate!==undefined&&!isValidDate(onDate)))
  throw new Error("member-location-invalid-input");
 const m=await member(client,id,false);
 if(!m)throw new Error("member-not-found");
 const currentDay=await today(client);
 const rows=await versions(client,id);
 const setting=await client.query<{reference_country:string|null}>(
  "SELECT reference_country FROM public.smn_general_settings WHERE installation_id='singleton'");
 const proposed=setting.rows[0]?.reference_country??null;
 const requested=instant?formatInstantDate(instant):onDate??currentDay;
 const effective=resolveMemberLocation(rows,requested);
 const current=resolveMemberLocation(rows,currentDay);
 let holidayDataAvailable=false;
 if(effective?.countryIso2){
  const checked=await client.query<{configured:boolean}>(`SELECT EXISTS(
    SELECT 1 FROM public.smn_national_calendar_coverage
    WHERE country_code=$1 AND calendar_year=$2 AND status='configured'
   ) AS configured`,[effective.countryIso2,Number(requested.slice(0,4))]);
  holidayDataAvailable=checked.rows[0]?.configured===true;
 }
 return {memberId:id,teamId:m.team_id,archived:m.archived_at!==null,today:currentDay,
  suggestedCountryIso2:isValidCountry(proposed)?proposed:null,
  configured:current!==null,current,effective,versions:rows,requestedOn:requested,
  display:instant&&effective?.timeZone?formatMemberEvent(instant,effective.timeZone):null,
  holidayCalendarScope:"national-only",regionalHolidayAuto:false,holidayDataAvailable};
}
function formatInstantDate(instant:string){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(instant))
  throw new Error("member-location-invalid-input");
 const date=new Date(instant);
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,19)!==instant.slice(0,19))
  throw new Error("member-location-invalid-input");
 return date.toISOString().slice(0,10);
}
export async function saveMemberLocation(client:Client,id:string,actorId:string,
 raw:unknown):Promise<LocationResult>{
 const input=parseLocationChange(raw);
 if(!UUID.test(id)||!actorId||!input)return {ok:false,error:"invalid-input"};
 await client.query("BEGIN");
 try{
  const stop=async(error:Exclude<LocationResult,{ok:true}>["error"]):Promise<LocationResult>=>{
   await client.query("ROLLBACK");return {ok:false,error};
  };
  const m=await member(client,id,true);
  if(!m)return stop("not-found");
  if(m.archived_at!==null)return stop("archived");
  const current=await today(client);
  if(input.effectiveFrom<current)return stop("date-in-past");
  const old=await versions(client,id);
  const latest=old.at(-1);
  if((latest?.revision??0)!==input.revision)return stop("conflict");
  if(latest&&input.effectiveFrom<latest.effective_from)return stop("date-before-latest");
  await client.query(`INSERT INTO public.smn_member_location
   (id,member_id,revision,country_iso2,region,city,time_zone,effective_from,source,created_by)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8::date,'manual',$9)`,
   [randomUUID(),id,input.revision+1,input.countryIso2,input.region,input.city,
    input.timeZone,input.effectiveFrom,actorId]);
  await client.query("COMMIT");
  return {ok:true,revision:input.revision+1};
 }catch(error){
  await client.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
