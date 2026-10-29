import type {Client} from "pg";
export async function invalidateHighlight(db:Client,actorId:string,id:string,reason:string){
 if(!actorId||!/^[a-f0-9-]{36}$/i.test(id)||!reason.trim()||reason.length>2000)return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const installed=await db.query<{exists:boolean}>(`SELECT to_regclass('public.smn_automatic_highlight') IS NOT NULL AS exists`);
  if(!installed.rows[0]?.exists){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  await db.query("SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='smn_automatic_highlight' AND column_name='invalidated_at'").then(r=>{if(!r.rows.length)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
  await db.query("SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='smn_automatic_highlight' AND column_name='invalidated_by'").then(r=>{if(!r.rows.length)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
  await db.query("SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='smn_automatic_highlight' AND column_name='invalidation_reason'").then(r=>{if(!r.rows.length)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
  const scoped=await db.query<{id:string;invalidated_at:string|null}>(`SELECT h.id,h.invalidated_at FROM public.smn_automatic_highlight h
   WHERE h.id=$1 AND ((h.source_kind='registry' AND EXISTS(SELECT 1 FROM public.smn_registry_item r
   JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE r.id=h.source_id AND i.id='singleton' AND i.state='initialized'))
   OR (h.source_kind='goal' AND EXISTS(SELECT 1 FROM public.smn_sprint_goal g
   JOIN public.smn_sprint s ON s.id=g.sprint_id JOIN public.smn_team t ON t.id=s.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id WHERE g.id=h.source_id
   AND i.id='singleton' AND i.state='initialized'))) FOR UPDATE OF h`,[id]);
  if(scoped.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(scoped.rows[0].invalidated_at){await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};}
  await db.query(`UPDATE public.smn_automatic_highlight SET invalidated_at=now(),invalidated_by=$2,invalidation_reason=$3 WHERE id=$1`,[id,actorId,reason.trim()]);
  await db.query("COMMIT");return {ok:true as const};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
