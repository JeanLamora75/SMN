import type {Client} from "pg";
export type FactOrigin="manual"|"automatic";
export function selectableFact(hidden:boolean,invalidated:boolean){return !hidden&&!invalidated;}
export async function ensureFactSelection(db:Client){
 await db.query("SELECT to_regclass('public.smn_fact_selection') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
 await db.query("SELECT to_regclass('public.smn_fact_selection_audit') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("registry-schema-not-ready: apply-registry-extensions-v32")});
}
export async function scopeFact(db:Client,origin:FactOrigin,id:string){
 const sql=origin==="manual"?
 `SELECT r.id FROM public.smn_registry_item r JOIN public.smn_team t ON t.id=r.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id WHERE r.id=$1 AND r.type='highlight'
 AND i.id='singleton' AND i.state='initialized'`:
 `SELECT h.id FROM public.smn_automatic_highlight h WHERE h.id=$1 AND
 ((h.source_kind='registry' AND EXISTS(SELECT 1 FROM public.smn_registry_item r
 JOIN public.smn_team t ON t.id=r.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE r.id=h.source_id AND i.id='singleton' AND i.state='initialized'))
 OR (h.source_kind='goal' AND EXISTS(SELECT 1 FROM public.smn_sprint_goal g
 JOIN public.smn_sprint s ON s.id=g.sprint_id JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id WHERE g.id=h.source_id
 AND i.id='singleton' AND i.state='initialized')))`;
 return (await db.query(sql,[id])).rows.length===1;
}
export async function updateFactSelection(db:Client,actorId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {ok:false as const,error:"invalid-input" as const};
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="factId,hidden,origin,promoted,revision,selected"||
 (v.origin!=="manual"&&v.origin!=="automatic")||typeof v.factId!=="string"||
 !/^[0-9a-f-]{36}$/i.test(v.factId)||!Number.isSafeInteger(v.revision)||Number(v.revision)<0||
 typeof v.hidden!=="boolean"||typeof v.promoted!=="boolean"||typeof v.selected!=="boolean"||!actorId)
 return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  if(!await scopeFact(db,v.origin,v.factId)){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(v.origin==="automatic"){
   const cols=await db.query<{exists:boolean}>(`SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='smn_automatic_highlight' AND column_name='invalidated_at') AS exists`);
   if(cols.rows[0]?.exists){
    const state=await db.query<{invalidated:boolean}>(`SELECT invalidated_at IS NOT NULL AS invalidated FROM public.smn_automatic_highlight WHERE id=$1`,[v.factId]);
    if(state.rows[0]?.invalidated&&(v.selected||v.promoted)){await db.query("ROLLBACK");return {ok:false as const,error:"invalidated" as const};}
   }
  }
  await ensureFactSelection(db);
  const prior=await db.query<{hidden:boolean;promoted:boolean;selected:boolean;revision:number}>(`
   SELECT hidden,promoted,selected,revision FROM public.smn_fact_selection
   WHERE origin=$1 AND fact_id=$2 FOR UPDATE`,[v.origin,v.factId]);
  const old=prior.rows[0],revision=(old?.revision??0)+1;
  if((old?.revision??0)!==v.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};}
  const hidden=v.hidden as boolean,promoted=!hidden&&v.promoted===true,selected=!hidden&&v.selected===true;
  await db.query(`INSERT INTO public.smn_fact_selection(origin,fact_id,hidden,promoted,selected,revision,updated_by)
   VALUES($1,$2,$3,$4,$5,$6,$7)
   ON CONFLICT(origin,fact_id) DO UPDATE SET hidden=EXCLUDED.hidden,promoted=EXCLUDED.promoted,
   selected=EXCLUDED.selected,revision=EXCLUDED.revision,updated_by=EXCLUDED.updated_by,updated_at=now()`,
   [v.origin,v.factId,hidden,promoted,selected,revision,actorId]);
  const {randomUUID}=await import("node:crypto");
  await db.query(`INSERT INTO public.smn_fact_selection_audit(id,origin,fact_id,previous_values,next_values,actor_id)
   VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,[randomUUID(),v.origin,v.factId,
   old?JSON.stringify(old):null,JSON.stringify({hidden,promoted,selected,revision}),actorId]);
  await db.query("COMMIT");return {ok:true as const,revision};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export async function readSelectableFacts(db:Client){
 const present=await db.query<{manual:boolean;automatic:boolean;selection:boolean;invalidated:boolean}>(`
 SELECT to_regclass('public.smn_registry_item') IS NOT NULL AS manual,
 to_regclass('public.smn_automatic_highlight') IS NOT NULL AS automatic,
 to_regclass('public.smn_fact_selection') IS NOT NULL AS selection,
 EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='smn_automatic_highlight' AND column_name='invalidated_at') AS invalidated`);
 const t=present.rows[0];if(!t)return [];
 const manual=t.manual?`SELECT 'manual'::text AS origin,r.id,r.title,r.occurred_on::text AS "effectiveOn",r.created_at::text AS "recordedAt",false AS invalidated
 FROM public.smn_registry_item r JOIN public.smn_team x ON x.id=r.team_id
 JOIN public.smn_installation i ON i.id=x.installation_id WHERE r.type='highlight' AND i.id='singleton' AND i.state='initialized'`:"";
 const auto=t.automatic?`SELECT 'automatic'::text AS origin,h.id,h.title,h.created_at::date::text AS "effectiveOn",
 h.created_at::text AS "recordedAt",${t.invalidated?"h.invalidated_at IS NOT NULL":"false"} AS invalidated
 FROM public.smn_automatic_highlight h WHERE
 (h.source_kind='registry' AND EXISTS(SELECT 1 FROM public.smn_registry_item r
 JOIN public.smn_team x ON x.id=r.team_id JOIN public.smn_installation i ON i.id=x.installation_id
 WHERE r.id=h.source_id AND i.id='singleton' AND i.state='initialized'))
 OR (h.source_kind='goal' AND EXISTS(SELECT 1 FROM public.smn_sprint_goal g
 JOIN public.smn_sprint s ON s.id=g.sprint_id JOIN public.smn_team x ON x.id=s.team_id
 JOIN public.smn_installation i ON i.id=x.installation_id WHERE g.id=h.source_id AND i.id='singleton' AND i.state='initialized'))`:"";
 const union=[manual,auto].filter(Boolean).join(" UNION ALL ");if(!union)return [];
 const join=t.selection?"LEFT JOIN public.smn_fact_selection s ON s.origin=f.origin AND s.fact_id=f.id":"";
 const projection=t.selection?"COALESCE(s.hidden,false)":"false";
 const rows=await db.query(`SELECT f.*,${projection} AS hidden,${t.selection?"COALESCE(s.promoted,false)":"false"} AS promoted,
 ${t.selection?"COALESCE(s.selected,true)":"true"} AS selected,
 ${t.selection?"COALESCE(s.revision,0)":"0"} AS revision
 FROM (${union}) f ${join} ORDER BY f."recordedAt" DESC,f.id DESC LIMIT 500`);
 return rows.rows.map((x:Record<string,unknown>)=>({...x,eligible:selectableFact(x.hidden===true,x.invalidated===true),
 selectedByDefault:selectableFact(x.hidden===true,x.invalidated===true)&&x.selected!==false}));
}
