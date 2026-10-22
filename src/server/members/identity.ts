import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseMemberProfileChange} from "./profile";
import {parseLocationChange,type LocationChange} from "./location";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Input={displayName:string;email:string|null;revision:number;professionalFunction:string|null;location:LocationChange};
type Failure={ok:false;error:"invalid-input"|"not-found"|"archived"|"conflict"|"date-in-past"|"date-before-latest"};
const clean=(value:unknown):string|null|undefined=>{
 if(value===null)return null;
 if(typeof value!=="string"||/[\u0000-\u001f\u007f]/u.test(value))return undefined;
 const s=value.trim().replace(/\s+/gu," ");
 return s.length>120?undefined:s||null;
};
export function parseIdentityInput(raw:unknown):Input|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const obj=raw as Record<string,unknown>;
 if(Object.keys(obj).sort().join(",")!=="displayName,email,location,professionalFunction,revision")return null;
 const profile=parseMemberProfileChange({displayName:obj.displayName,email:obj.email,revision:obj.revision});
 const func=clean(obj.professionalFunction);
 const location=parseLocationChange(obj.location);
 return profile&&func!==undefined&&location?{...profile,professionalFunction:func,location}:null;
}
export async function saveMemberIdentity(db:Client,id:string,actorId:string,raw:unknown):
 Promise<{ok:true;revision:number;locationRevision:number}|Failure>{
 const input=parseIdentityInput(raw);
 if(!UUID.test(id)||!actorId||!input)return {ok:false,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const stop=async(error:Failure["error"]):Promise<Failure>=>{
   await db.query("ROLLBACK");return {ok:false,error};
  };
  const member=await db.query<{display_name:string;email:string|null;professional_function:string|null;revision:number;is_provisional:boolean;archived_at:string|null}>(
   `SELECT display_name,email,professional_function,revision,is_provisional,archived_at::text AS archived_at
    FROM public.smn_member WHERE id=$1 AND installation_id='singleton' FOR UPDATE`,[id]);
  if(member.rows.length!==1)return stop("not-found");
  const previous=member.rows[0];
  if(previous.archived_at!==null)return stop("archived");
  if(previous.revision!==input.revision)return stop("conflict");
  const dates=await db.query<{today:string}>("SELECT CURRENT_DATE::text AS today");
  const today=dates.rows[0]?.today;
  if(!today||input.location.effectiveFrom<today)return stop("date-in-past");
  const past=await db.query<{revision:number;effective_from:string;country_iso2:string|null;region:string|null;city:string|null;time_zone:string|null}>(
   `SELECT revision,effective_from::text AS effective_from,country_iso2,region,city,time_zone
    FROM public.smn_member_location WHERE member_id=$1 ORDER BY revision DESC LIMIT 1 FOR UPDATE`,[id]);
  const latest=past.rows[0];
  if((latest?.revision??0)!==input.location.revision)return stop("conflict");
  if(latest&&input.location.effectiveFrom<latest.effective_from)return stop("date-before-latest");
  const changed=previous.display_name!==input.displayName||previous.email!==input.email||
   previous.professional_function!==input.professionalFunction;
  const locationChanged=(!latest&&input.location.countryIso2!==null)||
   Boolean(latest&&(latest.country_iso2!==input.location.countryIso2||
    latest.region!==input.location.region||latest.city!==input.location.city||
    latest.time_zone!==input.location.timeZone));
  if(changed){
   await db.query(`UPDATE public.smn_member SET display_name=$1,email=$2,professional_function=$3,
    is_provisional=$4,revision=revision+1,updated_at=now() WHERE id=$5`,
    [input.displayName,input.email,input.professionalFunction,
     previous.is_provisional&&previous.display_name===input.displayName,id]);
  }
  if(locationChanged){
   await db.query(`INSERT INTO public.smn_member_location
    (id,member_id,revision,country_iso2,region,city,time_zone,effective_from,source,created_by)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8::date,'manual',$9)`,
    [randomUUID(),id,(latest?.revision??0)+1,input.location.countryIso2,
     input.location.region,input.location.city,input.location.timeZone,input.location.effectiveFrom,actorId]);
  }
  if(changed||locationChanged){
   await db.query(`INSERT INTO public.smn_member_identity_history
    (id,member_id,previous_values,next_values,changed_by)
    VALUES($1,$2,$3::jsonb,$4::jsonb,$5)`,[
    randomUUID(),id,JSON.stringify({displayName:previous.display_name,
     email:previous.email,professionalFunction:previous.professional_function,
     location:latest?{countryIso2:latest.country_iso2,region:latest.region,
      city:latest.city,timeZone:latest.time_zone}:null}),
    JSON.stringify({displayName:input.displayName,email:input.email,
     professionalFunction:input.professionalFunction,location:{
      countryIso2:input.location.countryIso2,region:input.location.region,
      city:input.location.city,timeZone:input.location.timeZone}}),actorId]);
  }
  await db.query("COMMIT");
  return {ok:true,revision:input.revision+(changed?1:0),
   locationRevision:(latest?.revision??0)+(locationChanged?1:0)};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
