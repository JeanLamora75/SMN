import type {Client} from "pg";

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Permanently removes a live registry item and its owned data in one transaction.
 * A future, unqualified foreign key must reject deletion rather than cause data loss.
 * Immutable exported archives and backup files are intentionally out of scope.
 */
export async function deleteRegistryItem(
 db:Client, id:string, teamId:string, revision:number
):Promise<{ok:true}|{ok:false;error:"invalid-input"|"not-found"|"conflict"|"linked-data"}>{
 if(!uuid.test(id)||!uuid.test(teamId)||!Number.isSafeInteger(revision)||revision<1)
  return {ok:false,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const r=await db.query<{revision:number}>(`SELECT r.revision
   FROM public.smn_registry_item r
   JOIN public.smn_team t ON t.id=r.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE r.id=$1 AND r.team_id=$2 AND i.id='singleton' AND i.state='initialized'
   AND COALESCE((to_jsonb(t)->>'is_archived')::boolean,false)=false
   FOR UPDATE OF r`,[id,teamId]);
  if(r.rows.length!==1){await db.query("ROLLBACK");return {ok:false,error:"not-found"};}
  if(r.rows[0].revision!==revision){await db.query("ROLLBACK");return {ok:false,error:"conflict"};}

  // Comments own immutable revision rows, which must be purged first.
  await db.query(`DELETE FROM public.smn_registry_comment_revision
   WHERE comment_id IN (SELECT id FROM public.smn_registry_comment WHERE item_id=$1)`,[id]);
  await db.query("DELETE FROM public.smn_registry_comment WHERE item_id=$1",[id]);

  // An incoming record relation is not protected by an FK on target_id.
  for(const table of ["smn_registry_relation_audit","smn_registry_relation"]){
   await db.query(`DELETE FROM public.${table} WHERE source_id=$1 OR (target_kind='record' AND target_id=$1)`,[id]);
  }
  for(const table of ["smn_action_link_audit","smn_action_link"]){
   await db.query(`DELETE FROM public.${table} WHERE action_id=$1 OR related_id=$1`,[id]);
  }

  // Preserve other decision records, but clear their reference to the removed decision.
  await db.query("UPDATE public.smn_decision_detail SET replaces_id=NULL WHERE replaces_id=$1",[id]);
  await db.query("DELETE FROM public.smn_registry_linked_request WHERE source_id=$1 OR new_item_id=$1",[id]);
  await db.query("DELETE FROM public.smn_calendar_meeting_outcome_link WHERE registry_item_id=$1",[id]);
  await db.query("DELETE FROM public.smn_automatic_highlight WHERE source_kind='registry' AND source_id=$1",[id]);

  const optional=await db.query<{name:string}>(`SELECT table_name AS name FROM information_schema.tables
    WHERE table_schema='public' AND table_name=ANY($1::text[])`,[[
    "smn_kanban_registry_link_audit","smn_kanban_registry_link"
   ]]);
  const available=new Set(optional.rows.map(row=>row.name));
  for(const table of ["smn_kanban_registry_link_audit","smn_kanban_registry_link"]){
   if(available.has(table))await db.query(`DELETE FROM public.${table} WHERE item_id=$1`,[id]);
  }

  // All owned revision and aggregate tables are scoped strictly by item_id.
  const owned=[
   "smn_decision_detail_audit","smn_dependency_parties_audit",
   "smn_dependency_vigilance_audit","smn_risk_assessment_audit","smn_risk_roam_audit",
   "smn_registry_cycle_link_audit","smn_registry_item_audit",
   "smn_decision_detail","smn_dependency_parties","smn_dependency_vigilance",
   "smn_risk_assessment","smn_risk_roam","smn_registry_cycle_link"
  ] as const;
  for(const table of owned)await db.query(`DELETE FROM public.${table} WHERE item_id=$1`,[id]);
  const removed=await db.query("DELETE FROM public.smn_registry_item WHERE id=$1 AND team_id=$2 RETURNING id",[id,teamId]);
  if(removed.rowCount!==1)throw Error("registry-delete-lost-lock");
  await db.query("COMMIT");
  return {ok:true};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  if(error&&typeof error==="object"&&"code" in error&&error.code==="23503")
   return {ok:false,error:"linked-data"};
  throw error;
 }
}
