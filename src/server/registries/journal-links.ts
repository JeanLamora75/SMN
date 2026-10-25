import type {Client} from "pg";

const idRx=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type RegistryJournalLink={
 id:string;recordId:string;title:string;type:"action"|"decision"|"highlight";
 recordedAt:string;authorName:string|null;eventKind:"created"|"linked";
};

/** A journal event is sourced from an audited, currently linked relation.
 * Never synthesize a creation event from a record's present-day status.
 */
export async function readRegistryJournalLinks(
 db:Client,itemId:string,canReadNames:boolean
):Promise<RegistryJournalLink[]>{
 if(!idRx.test(itemId))return [];
 const ready=await db.query<{ready:boolean}>(`SELECT to_regclass('public.smn_registry_relation') IS NOT NULL AND
  to_regclass('public.smn_registry_relation_audit') IS NOT NULL AS ready`);
 if(!ready.rows[0]?.ready)return [];
 const marker=await db.query<{ready:boolean}>(`SELECT
  to_regclass('public.smn_registry_linked_request') IS NOT NULL AS ready`);
 const createdJoin=marker.rows[0]?.ready?
  `LEFT JOIN public.smn_registry_linked_request journal_origin
   ON journal_origin.source_id=base.id AND journal_origin.new_item_id=r.id`:
  `LEFT JOIN LATERAL (SELECT NULL::text AS new_item_id) journal_origin ON true`;
 const result=await db.query<RegistryJournalLink>(`SELECT
   a.id,r.id AS "recordId",r.title,r.type,
   a.changed_at::text AS "recordedAt",
   ${canReadNames?"author.username":"NULL::text"} AS "authorName",
   CASE WHEN journal_origin.new_item_id IS NOT NULL THEN 'created'
    ELSE 'linked' END AS "eventKind"
  FROM public.smn_registry_item base
  JOIN public.smn_team t ON t.id=base.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  JOIN public.smn_registry_relation l
   ON l.target_kind='record'
   AND (l.source_id=base.id OR l.target_id=base.id)
  JOIN public.smn_registry_item r
   ON r.id=CASE WHEN l.source_id=base.id THEN l.target_id ELSE l.source_id END
   AND r.team_id=base.team_id
  ${createdJoin}
  JOIN LATERAL (
   SELECT audit.id,audit.changed_at,audit.actor_id
   FROM public.smn_registry_relation_audit audit
   WHERE audit.source_id=l.source_id AND audit.target_kind=l.target_kind
    AND audit.target_id=l.target_id AND audit.action='linked'
    AND l.created_at<=audit.changed_at
   ORDER BY audit.changed_at DESC,audit.id DESC LIMIT 1
  ) a ON true
  LEFT JOIN public.smn_account author ON author.id=a.actor_id
  WHERE base.id=$1 AND i.id='singleton' AND i.state='initialized'
   AND lower(i.mode) IN ('scrum','kanban')
   AND r.type IN ('action','decision','highlight')
  ORDER BY a.changed_at DESC,a.id DESC`,[itemId]);
 return result.rows;
}
