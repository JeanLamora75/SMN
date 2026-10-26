import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {isValidCountry} from "../members/location";
import {ensureCountryArchiveSchema,COUNTRY_LIFECYCLE_LOCK} from "./archive-migration";

type Action="archive"|"reactivate";
export type CountryLifecycleImpact={
 country:{code:string;name:string;revision:number;archived:boolean;archivedAt:string|null};
 referenceCountry:boolean;activeMemberCount:number;
 linkedMembers:{id:string;name:string}[];membersTruncated:boolean;
 canArchive:boolean;canReactivate:boolean;
};
export function parseCountryLifecycleAction(raw:unknown):
 {action:Action;revision:number;confirmed:true}|null{
 if(!raw||Array.isArray(raw)||typeof raw!=="object")return null;
 const r=raw as Record<string,unknown>;
 if(Object.keys(r).length!==3||!["archive","reactivate"].includes(String(r.action))||
  r.confirmed!==true||!Number.isSafeInteger(r.revision)||Number(r.revision)<0||
  Number(r.revision)>2147483646)return null;
 return {action:r.action as Action,revision:r.revision as number,confirmed:true};
}
async function inspect(db:Client,code:string,lock:boolean):Promise<CountryLifecycleImpact|null>{
 const c=await db.query<{code:string;name:string;revision:number;archived_at:string|null}>(`
  SELECT code,name,revision,archived_at::text AS archived_at
  FROM public.smn_country WHERE code=$1 ${lock?"FOR UPDATE":""}`,[code]);
 if(c.rowCount!==1)return null;
 const row=c.rows[0];
 const reference=await db.query<{reference_country:string|null}>(`
  SELECT reference_country FROM public.smn_general_settings
  WHERE installation_id='singleton'`);
 const referenceCountry=reference.rows[0]?.reference_country===code;
 // Effective current location plus future planned versions. Historical-only locations
 // do not block. Member is active when not archived; archive cannot orphan a future move.
 const linked=await db.query<{id:string;name:string;total:string}>(`
  WITH candidate AS (
   SELECT m.id,m.display_name,
    (SELECT ml.country_iso2 FROM public.smn_member_location ml
     WHERE ml.member_id=m.id AND ml.effective_from<=CURRENT_DATE
     ORDER BY ml.effective_from DESC,ml.revision DESC LIMIT 1) AS current_country
   FROM public.smn_member m
   WHERE m.installation_id='singleton' AND m.archived_at IS NULL
  ), blocked AS (
   SELECT c.id,c.display_name FROM candidate c
   WHERE c.current_country=$1 OR EXISTS(
    SELECT 1 FROM public.smn_member_location future
    WHERE future.member_id=c.id AND future.effective_from>CURRENT_DATE
      AND future.country_iso2=$1)
  )
  SELECT id,display_name AS name,count(*) OVER()::text AS total
  FROM blocked ORDER BY display_name,id LIMIT 21`,[code]);
 const count=Number(linked.rows[0]?.total??0),archived=row.archived_at!==null;
 return {country:{code:row.code,name:row.name,revision:row.revision,archived,
   archivedAt:row.archived_at},
  referenceCountry,activeMemberCount:count,
  linkedMembers:linked.rows.slice(0,20).map(r=>({id:r.id,name:r.name})),
  membersTruncated:count>20,canArchive:!archived&&!referenceCountry&&count===0,
  canReactivate:archived};
}
export async function inspectCountryLifecycle(db:Client,code:string){
 if(!isValidCountry(code))throw Error("invalid-country-scope");
 await ensureCountryArchiveSchema(db);
 return inspect(db,code,false);
}
export async function changeCountryLifecycle(db:Client,code:string,actor:string,raw:unknown){
 const input=parseCountryLifecycleAction(raw);
 if(!isValidCountry(code)||!actor||!input)return {ok:false,error:"invalid-input"} as const;
 await ensureCountryArchiveSchema(db);
 await db.query("BEGIN");
 const fail=async(error:string,impact?:CountryLifecycleImpact)=>{
  await db.query("ROLLBACK");return {ok:false,error,...(impact?{impact}:{})} as const;
 };
 try{
  // Must be taken before member location, member reactivation, and settings updates.
  await db.query(COUNTRY_LIFECYCLE_LOCK);
  const impact=await inspect(db,code,true);
  if(!impact)return await fail("not-found");
  if(impact.country.revision!==input.revision)return await fail("conflict",impact);
  if(input.action==="archive"){
   if(impact.country.archived)return await fail("already-archived",impact);
   if(impact.referenceCountry)return await fail("reference-country",impact);
   if(impact.activeMemberCount>0)return await fail("active-members",impact);
  }else if(!impact.country.archived)return await fail("not-archived",impact);
  const update=await db.query<{revision:number;archived_at:string|null}>(`
   UPDATE public.smn_country
   SET archived_at=CASE WHEN $2='archive' THEN now() ELSE NULL END,
    revision=revision+1
   WHERE code=$1 AND revision=$3
   RETURNING revision,archived_at::text AS archived_at`,
   [code,input.action,input.revision]);
  if(update.rowCount!==1)return await fail("conflict");
  await db.query(`INSERT INTO public.smn_country_lifecycle_audit
   (id,country_code,action,old_archived_at,new_archived_at,old_revision,new_revision,actor_id)
   VALUES($1,$2,$3,$4::timestamptz,$5::timestamptz,$6,$7,$8)`,
   [randomUUID(),code,input.action,impact.country.archivedAt,
    update.rows[0].archived_at,input.revision,update.rows[0].revision,actor]);
  await db.query("COMMIT");
  return {ok:true,action:input.action,code,
   revision:update.rows[0].revision,archived:input.action==="archive"} as const;
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
