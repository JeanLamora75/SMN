import type {Client} from "pg";

export type AuditAction="account_created"|"account_updated"|"settings_updated"|
  "password_changed"|"recovery_prepared"|"recovery_used"|
  "backup_policy_changed"|"backup_package_deleted"|
  "sprint_changed"|"member_archived"|"member_reactivated"|"member_assignment_closed"|
  "team_context_changed"|"registry_item_changed"|"pdf_archive_recorded"|"member_removed";
export type AuditEntry=Readonly<{
 id:string;occurredAt:string;actorId:string|null;action:AuditAction;
 objectType:"account"|"settings"|"authentication"|"backup"|"sprint"|"member"|"team"|"registry"|"report";objectId:string;scope:"singleton";
 result:"success";changes:Readonly<{before:Record<string,string|boolean>;after:Record<string,string|boolean>}>;
}>;

type RawEvent={id:string;occurred_at:Date;actor_id:string|null;action:string;
 object_type:string;object_id:string;scope:string;result:string;
 old_values:unknown;new_values:unknown};
const actions=new Set<AuditAction>([
 "account_created","account_updated","settings_updated","password_changed","recovery_prepared","recovery_used",
 "backup_policy_changed","backup_package_deleted","sprint_changed","member_archived",
 "member_reactivated","member_assignment_closed","team_context_changed",
 "registry_item_changed","pdf_archive_recorded","member_removed"
]);
/** Whitelist de seules préférences et états non sensibles, y compris pour des JSONB malformés. */
export function sanitizeAuditValues(action:AuditAction,value:unknown):Record<string,string|boolean>{
 if(!value||typeof value!=="object"||Array.isArray(value))return {};
 const v=value as Record<string,unknown>;
 const result:Record<string,string|boolean>={};
 const fields=action.startsWith("account_")?["role","isActive"]:
   action==="settings_updated"?["locale","theme","palette","referenceCountry"]:[];
 for(const key of fields){
  const x=v[key];
  if(key==="role"&&(x==="admin"||x==="user"))result.role=x;
  else if(key==="isActive"&&typeof x==="boolean")result.isActive=x;
  else if(key==="locale"&&(x==="fr"||x==="en"))result.locale=x;
  else if(key==="theme"&&(x==="light"||x==="dark"))result.theme=x;
  else if(key==="palette"&&(x==="ocean"||x==="forest"||x==="violet"))result.palette=x;
  else if(key==="referenceCountry"&&typeof x==="string"&&/^[A-Z]{2}$/.test(x))result.referenceCountry=x;
 }
 return result;
}
export function projectAuditEvent(row:RawEvent):AuditEntry|null{
 if(!row||typeof row.id!=="string"||!row.id||!row.occurred_at||
  !(row.occurred_at instanceof Date)||Number.isNaN(row.occurred_at.getTime())||
  !actions.has(row.action as AuditAction)||
  !["account","settings","authentication","backup","sprint","member","team","registry","report"].includes(row.object_type)||
  row.scope!=="singleton"||row.result!=="success"||
  typeof row.object_id!=="string"||!row.object_id||
  !(row.actor_id===null||typeof row.actor_id==="string"))return null;
 const action=row.action as AuditAction;
 const expectedType:Record<AuditAction,AuditEntry["objectType"]>={
  account_created:"account",account_updated:"account",settings_updated:"settings",
  password_changed:"authentication",recovery_prepared:"authentication",recovery_used:"authentication",
  backup_policy_changed:"backup",backup_package_deleted:"backup",
  sprint_changed:"sprint",member_archived:"member",member_reactivated:"member",
  member_assignment_closed:"member",team_context_changed:"team",
  registry_item_changed:"registry",pdf_archive_recorded:"report",member_removed:"member"
 };
 if(expectedType[action]!==row.object_type)return null;
 return {
  id:row.id,occurredAt:row.occurred_at.toISOString(),actorId:row.actor_id,action,
  objectType:row.object_type as AuditEntry["objectType"],objectId:row.object_id,
  scope:"singleton",result:"success",
  changes:{before:sanitizeAuditValues(action,row.old_values),
    after:sanitizeAuditValues(action,row.new_values)}
 };
}
const auditSql=`
  SELECT id,occurred_at,actor_id,action,object_type,object_id,scope,result,old_values,new_values
  FROM (
    SELECT id,occurred_at,actor_id,action,'account'::text AS object_type,
      object_id,installation_id AS scope,outcome AS result,old_values,new_values
    FROM public.smn_account_audit WHERE installation_id='singleton'
    UNION ALL
    SELECT id,changed_at AS occurred_at,actor_id,'settings_updated'::text AS action,
      'settings'::text AS object_type,installation_id AS object_id,installation_id AS scope,
      'success'::text AS result,old_values,new_values
    FROM public.smn_general_settings_audit WHERE installation_id='singleton'
    UNION ALL
    SELECT id,created_at AS occurred_at,account_id AS actor_id,action,
      'authentication'::text AS object_type,account_id AS object_id,
      'singleton'::text AS scope,'success'::text AS result,
      '{}'::jsonb AS old_values,'{}'::jsonb AS new_values
    FROM public.smn_auth_audit
    UNION ALL
    SELECT id,occurred_at,actor_id,
      CASE action WHEN 'policy_changed' THEN 'backup_policy_changed'
       ELSE 'backup_package_deleted' END AS action,
      'backup'::text AS object_type,
      COALESCE(package_id,installation_id) AS object_id,
      installation_id AS scope,'success'::text AS result,
      '{}'::jsonb AS old_values,'{}'::jsonb AS new_values
    FROM public.smn_backup_retention_audit WHERE installation_id='singleton'
      AND action IN ('policy_changed','package_deleted')
    UNION ALL
    SELECT id,occurred_at,actor_id,'sprint_changed'::text AS action,
      'sprint'::text AS object_type,sprint_id AS object_id,
      'singleton'::text AS scope,'success'::text AS result,
      '{}'::jsonb AS old_values,'{}'::jsonb AS new_values
    FROM public.smn_sprint_audit
    UNION ALL
    SELECT id,occurred_at,performed_by AS actor_id,
      CASE action WHEN 'archive' THEN 'member_archived'
       WHEN 'reactivate' THEN 'member_reactivated'
       ELSE 'member_assignment_closed' END AS action,
      'member'::text AS object_type,member_id AS object_id,
      'singleton'::text AS scope,'success'::text AS result,
      '{}'::jsonb AS old_values,'{}'::jsonb AS new_values
    FROM public.smn_member_lifecycle_event
    WHERE action IN ('archive','reactivate','close')
    UNION ALL
    SELECT id,changed_at AS occurred_at,actor_id,'team_context_changed'::text AS action,
      'team'::text AS object_type,team_id AS object_id,
      'singleton'::text AS scope,'success'::text AS result,
      '{}'::jsonb AS old_values,'{}'::jsonb AS new_values
    FROM public.smn_team_context_audit
    UNION ALL
    SELECT id,changed_at AS occurred_at,actor_id,'registry_item_changed'::text AS action,
      'registry'::text AS object_type,item_id AS object_id,
      'singleton'::text AS scope,'success'::text AS result,
      '{}'::jsonb AS old_values,'{}'::jsonb AS new_values
    FROM public.smn_registry_item_audit
    UNION ALL
    SELECT id,created_at AS occurred_at,
      author_id AS actor_id,'pdf_archive_recorded'::text AS action,
      'report'::text AS object_type,id AS object_id,
      'singleton'::text AS scope,'success'::text AS result,
      '{}'::jsonb AS old_values,'{}'::jsonb AS new_values
    FROM public.smn_report_pdf_archive
  ) e ORDER BY occurred_at DESC,id DESC LIMIT $1`;
/** Relecture uniquement : aucun identifiant, e-mail ou secret arbitraire de colonnes non projetées. */
export async function readAuditJournal(client:Client,limit=100):Promise<readonly AuditEntry[]>{
 const safeLimit=Number.isSafeInteger(limit)&&limit>=1&&limit<=200?limit:100;
 const query=await client.query<RawEvent>(auditSql,[safeLimit]);
 const entries=query.rows.map(projectAuditEvent)
  .filter((value):value is AuditEntry=>value!==null);
 // The removal ledger is additive, outside the immutable v33 baseline.
 const extra=await client.query<{present:boolean}>(`
  SELECT to_regclass('public.smn_member_removal_audit') IS NOT NULL AS present`);
 if(extra.rows[0]?.present===true){
  const deleted=await client.query<RawEvent>(`
   SELECT id,removed_at AS occurred_at,actor_id,
    'member_removed'::text AS action,'member'::text AS object_type,
    member_id AS object_id,installation_id AS scope,
    'success'::text AS result,'{}'::jsonb AS old_values,
    '{}'::jsonb AS new_values
   FROM public.smn_member_removal_audit WHERE installation_id='singleton'
   ORDER BY removed_at DESC,id DESC LIMIT $1`,[safeLimit]);
  entries.push(...deleted.rows.map(projectAuditEvent)
   .filter((value):value is AuditEntry=>value!==null));
 }
 return entries.sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt)||
  b.id.localeCompare(a.id)).slice(0,safeLimit);
}
