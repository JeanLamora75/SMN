import type {Client} from "pg";
import type {AuditEvent,AuditPage} from "@/lib/registry-audit-timeline";

const validId=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const size=25;
type Flags={record:boolean;assessment:boolean;roam:boolean;parties:boolean;vigilance:boolean;
 decision:boolean;comments:boolean;relations:boolean;cycles:boolean;actions:boolean;
 goals?:boolean;sprints?:boolean};

/** Every UNION arm reads an existing audit table, never a current-state guess.
 * All arms have identical columns so pagination follows one global ordering.
 */
function auditStatements(f:Flags):string[]{
 const arms:string[]=[];
 if(f.record)arms.push(`SELECT a.id,'record'::text AS kind,a.revision,
  a.changed_at AS event_at,u.username AS "actorName",
  CASE WHEN a.before_values IS NULL THEN 'created' ELSE 'updated' END::text AS action,
  a.before_values AS "before",a.after_values AS "after"
  FROM public.smn_registry_item_audit a
  LEFT JOIN public.smn_account u ON u.id=a.actor_id
  WHERE a.item_id=$1`);
 const business:[
  {installed:f.assessment,table:"smn_risk_assessment_audit",kind:"assessment",
   old:"a.old_values",next:"a.new_values"},
  {installed:f.roam,table:"smn_risk_roam_audit",kind:"roam",
   old:"CASE WHEN a.previous_classification IS NULL THEN NULL::jsonb ELSE jsonb_build_object('classification',a.previous_classification) END",
   next:"jsonb_build_object('classification',a.next_classification)"},
  {installed:f.parties,table:"smn_dependency_parties_audit",kind:"parties",
   old:"a.before_values",next:"a.after_values"},
  {installed:f.vigilance,table:"smn_dependency_vigilance_audit",kind:"vigilance",
   old:"a.before_values",next:"a.after_values"},
  {installed:f.decision,table:"smn_decision_detail_audit",kind:"decision",
   old:"a.before_values",next:"a.after_values"}
 ];
 for(const item of business){
  if(!item.installed)continue;
  arms.push(`SELECT a.id,'${item.kind}'::text AS kind,a.revision,
   a.changed_at AS event_at,u.username AS "actorName",
   CASE WHEN (${item.old}) IS NULL THEN 'created' ELSE 'updated' END::text AS action,
   ${item.old} AS "before",${item.next} AS "after"
   FROM public.${item.table} a LEFT JOIN public.smn_account u ON u.id=a.actor_id
   WHERE a.item_id=$1`);
 }
 if(f.comments)arms.push(`SELECT v.id,'comment'::text AS kind,v.revision,
  v.changed_at AS event_at,v.actor_name AS "actorName",v.action,
  CASE WHEN v.before_text IS NULL THEN NULL::jsonb
   ELSE jsonb_build_object('text',v.before_text) END AS "before",
  jsonb_build_object('text',v.after_text) AS "after"
  FROM public.smn_registry_comment_revision v
  JOIN public.smn_registry_comment c ON c.id=v.comment_id
  WHERE c.item_id=$1`);
 if(f.relations){
  const goalJoin=f.goals?
   `LEFT JOIN public.smn_sprint_goal g ON a.target_kind='goal' AND g.id=a.target_id`:
   `LEFT JOIN LATERAL (SELECT NULL::text AS title) g ON true`;
  const target=`CASE WHEN a.target_kind='record' THEN
   CASE WHEN a.source_id=$1 THEN linked.title ELSE src.title END ELSE g.title END`;
  arms.push(`SELECT a.id,'relation'::text AS kind,NULL::integer AS revision,
   a.changed_at AS event_at,u.username AS "actorName",a.action,
   CASE WHEN a.action='unlinked' THEN jsonb_build_object('target',${target})
    ELSE NULL::jsonb END AS "before",
   CASE WHEN a.action='linked' THEN jsonb_build_object('target',${target})
    ELSE NULL::jsonb END AS "after"
   FROM public.smn_registry_relation_audit a
   JOIN public.smn_registry_item src ON src.id=a.source_id
   LEFT JOIN public.smn_registry_item linked ON a.target_kind='record'
    AND linked.id=a.target_id AND linked.team_id=src.team_id
   ${goalJoin}
   LEFT JOIN public.smn_account u ON u.id=a.actor_id
   WHERE (a.source_id=$1 OR (a.target_kind='record' AND a.target_id=$1))
    AND src.team_id=(SELECT team_id FROM public.smn_registry_item WHERE id=$1)`);
 }
 if(f.cycles){
  const sprintJoin=f.sprints?
   `LEFT JOIN public.smn_sprint cycle ON cycle.id=a.sprint_id
     AND cycle.team_id=(SELECT team_id FROM public.smn_registry_item WHERE id=$1)`:
   `LEFT JOIN LATERAL (SELECT NULL::text AS name) cycle ON true`;
  arms.push(`SELECT a.id,'cycle'::text AS kind,NULL::integer AS revision,
   a.changed_at AS event_at,u.username AS "actorName",a.action,
   CASE WHEN a.action='unlinked' THEN jsonb_build_object('cycle',cycle.name)
    ELSE NULL::jsonb END AS "before",
   CASE WHEN a.action='linked' THEN jsonb_build_object('cycle',cycle.name)
    ELSE NULL::jsonb END AS "after"
   FROM public.smn_registry_cycle_link_audit a
   ${sprintJoin}
   LEFT JOIN public.smn_account u ON u.id=a.actor_id
   WHERE a.item_id=$1`);
 }
 if(f.actions)arms.push(`SELECT a.id,'actionLink'::text AS kind,NULL::integer AS revision,
  a.changed_at AS event_at,u.username AS "actorName",a.action,
  CASE WHEN a.action='unlinked' THEN
   jsonb_build_object('target',CASE WHEN a.action_id=$1 THEN related.title ELSE origin.title END)
   ELSE NULL::jsonb END AS "before",
  CASE WHEN a.action='linked' THEN
   jsonb_build_object('target',CASE WHEN a.action_id=$1 THEN related.title ELSE origin.title END)
   ELSE NULL::jsonb END AS "after"
  FROM public.smn_action_link_audit a
  JOIN public.smn_registry_item origin ON origin.id=a.action_id
  LEFT JOIN public.smn_registry_item related ON related.id=a.related_id
   AND related.team_id=origin.team_id
  LEFT JOIN public.smn_account u ON u.id=a.actor_id
  WHERE (a.action_id=$1 OR a.related_id=$1)
   AND origin.team_id=(SELECT team_id FROM public.smn_registry_item WHERE id=$1)`);
 return arms;
}

export async function readRegistryAuditTimeline(
 db:Client,id:string,page:number
):Promise<AuditPage|null>{
 if(!validId.test(id)||!Number.isSafeInteger(page)||page<1||page>200)return null;
 const item=await db.query<{id:string}>(`SELECT r.id FROM public.smn_registry_item r
  JOIN public.smn_team t ON t.id=r.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE r.id=$1 AND i.id='singleton' AND i.state='initialized'
   AND lower(i.mode) IN ('scrum','kanban')`,[id]);
 if(item.rows.length!==1)return null;
 const installed=await db.query<Flags>(`SELECT
  to_regclass('public.smn_registry_item_audit') IS NOT NULL AS record,
  to_regclass('public.smn_risk_assessment_audit') IS NOT NULL AS assessment,
  to_regclass('public.smn_risk_roam_audit') IS NOT NULL AS roam,
  to_regclass('public.smn_dependency_parties_audit') IS NOT NULL AS parties,
  to_regclass('public.smn_dependency_vigilance_audit') IS NOT NULL AS vigilance,
  to_regclass('public.smn_decision_detail_audit') IS NOT NULL AS decision,
  (to_regclass('public.smn_registry_comment_revision') IS NOT NULL
   AND to_regclass('public.smn_registry_comment') IS NOT NULL) AS comments,
  to_regclass('public.smn_registry_relation_audit') IS NOT NULL AS relations,
  to_regclass('public.smn_registry_cycle_link_audit') IS NOT NULL AS cycles,
  to_regclass('public.smn_action_link_audit') IS NOT NULL AS actions,
  to_regclass('public.smn_sprint_goal') IS NOT NULL AS goals,
  to_regclass('public.smn_sprint') IS NOT NULL AS sprints`);
 const f=installed.rows[0];
 if(!f||!f.record)throw Error("record-audit-not-installed");
 const arms=auditStatements(f);
 if(arms.length===0)throw Error("audit-source-unavailable");
 const query=`SELECT id,kind,revision,event_at::text AS "at","actorName",action,
    "before","after" FROM (${arms.join("\n UNION ALL \n")}) events
   ORDER BY event_at DESC,id DESC LIMIT $2 OFFSET $3`;
 const response=await db.query<AuditEvent>(query,[id,size+1,(page-1)*size]);
 return {events:response.rows.slice(0,size),page,hasMore:response.rows.length>size};
}
