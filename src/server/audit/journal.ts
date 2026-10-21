import type {Client} from "pg";

export type AuditAction="account_created"|"account_updated"|"settings_updated"|
  "password_changed"|"recovery_prepared"|"recovery_used";
export type AuditEntry=Readonly<{
 id:string;occurredAt:string;actorId:string|null;action:AuditAction;
 objectType:"account"|"settings"|"authentication";objectId:string;scope:"singleton";
 result:"success";changes:Readonly<{before:Record<string,string|boolean>;after:Record<string,string|boolean>}>;
}>;

type RawEvent={id:string;occurred_at:Date;actor_id:string|null;action:string;
 object_type:string;object_id:string;scope:string;result:string;
 old_values:unknown;new_values:unknown};
const actions=new Set<AuditAction>([
 "account_created","account_updated","settings_updated","password_changed","recovery_prepared","recovery_used"
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
  !["account","settings","authentication"].includes(row.object_type)||
  row.scope!=="singleton"||row.result!=="success"||
  typeof row.object_id!=="string"||!row.object_id||
  !(row.actor_id===null||typeof row.actor_id==="string"))return null;
 const action=row.action as AuditAction;
 if ((action.startsWith("account_")&&row.object_type!=="account")||
  (action==="settings_updated"&&row.object_type!=="settings")||
  (action!=="settings_updated"&&!action.startsWith("account_")&&row.object_type!=="authentication"))return null;
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
  ) e ORDER BY occurred_at DESC,id DESC LIMIT $1`;
/** Relecture uniquement : aucun identifiant, e-mail ou secret arbitraire de colonnes non projetées. */
export async function readAuditJournal(client:Client,limit=100):Promise<readonly AuditEntry[]>{
 const safeLimit=Number.isSafeInteger(limit)&&limit>=1&&limit<=200?limit:100;
 const query=await client.query<RawEvent>(auditSql,[safeLimit]);
 return query.rows.map(projectAuditEvent).filter((value):value is AuditEntry=>value!==null);
}
