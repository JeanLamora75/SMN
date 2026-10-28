import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {ensureSprintSchema} from "./creation";
type Sprint={id:string;team_id:string;name:string;status:string;start_at:string;end_at:string};
const selected=(raw:unknown):string[]|null=>{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const o=raw as Record<string,unknown>;
 if(Object.keys(o).length!==1||!Array.isArray(o.ids)||o.ids.length<1||o.ids.length>50||
 o.ids.some(v=>typeof v!=="string"||!/^[0-9a-f-]{36}$/i.test(v))||new Set(o.ids).size!==o.ids.length)return null;
 return o.ids as string[];
};
async function ensureDeletion(db:Client){
 await ensureSprintSchema(db);
 await db.query("ALTER TABLE public.smn_sprint ADD COLUMN IF NOT EXISTS deleted_at timestamptz");
 await db.query("ALTER TABLE public.smn_sprint ADD COLUMN IF NOT EXISTS deleted_by text REFERENCES public.smn_account(id) ON DELETE SET NULL");
}
async function lookup(db:Client,ids:string[],lock:boolean){
 const result=await db.query<Sprint>(`SELECT s.id,s.team_id,s.name,s.status,s.start_at::text,s.end_at::text
 FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=ANY($1::text[]) AND s.deleted_at IS NULL AND i.id='singleton'
 AND i.state='initialized' AND i.schema_version<=27 AND lower(i.mode)='scrum'`+(lock?" FOR UPDATE OF s":""),[ids]);
 return result.rows;
}
async function eligible(db:Client,rows:Sprint[],ids:string[]){
 const invalid=rows.length!==ids.length||rows.some(x=>x.status!=="planned"||new Date(x.start_at).valueOf()<=Date.now());
 return !invalid;
}
export async function previewDeletion(db:Client,raw:unknown){
 const ids=selected(raw);
 if(!ids)return {ok:false as const,error:"invalid-input" as const};
 await ensureDeletion(db);
 const rows=await lookup(db,ids,false);
 if(!await eligible(db,rows,ids))return {ok:false as const,error:"not-eligible" as const};
 return {ok:true as const,sprints:rows.map(x=>({id:x.id,name:x.name,startAt:x.start_at,endAt:x.end_at,status:x.status})),
 consequences:["Les cycles sélectionnés disparaîtront de la planification.","Les audits existants seront conservés.","Les événements et autres références associés ne seront pas effacés automatiquement."]};
}
export async function confirmDeletion(db:Client,actorId:string,raw:unknown){
 const ids=selected(raw);
 if(!ids)return {ok:false as const,error:"invalid-input" as const};
 await ensureDeletion(db);
 await db.query("BEGIN");
 try{
  const rows=await lookup(db,ids,true);
  if(!await eligible(db,rows,ids)){
   await db.query("ROLLBACK");return {ok:false as const,error:"not-eligible" as const};
  }
  const teams=[...new Set(rows.map(s=>s.team_id))].sort();
  for(const teamId of teams)await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[teamId]);
  const fresh=await lookup(db,ids,true);
  if(!await eligible(db,fresh,ids)){await db.query("ROLLBACK");return {ok:false as const,error:"not-eligible" as const};}
  for(const s of fresh){
   const updated=await db.query(`UPDATE public.smn_sprint SET deleted_at=now(),deleted_by=$2
    WHERE id=$1 AND deleted_at IS NULL AND status='planned' AND start_at>now()
    RETURNING id`,[s.id,actorId]);
   if(updated.rowCount!==1)throw Error("deletion-race");
   await db.query(`INSERT INTO public.smn_sprint_audit(id,sprint_id,action,actor_id,details)
    VALUES($1,$2,'removed_from_planning',$3,$4::jsonb)`,
    [randomUUID(),s.id,actorId,JSON.stringify({name:s.name,status:s.status,startAt:s.start_at,endAt:s.end_at,method:"soft-delete"})]);
  }
  await db.query("COMMIT");
  return {ok:true as const,deleted:ids.length};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
