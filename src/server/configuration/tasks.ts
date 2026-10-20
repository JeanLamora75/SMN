import type { Client } from "pg";

export const configurationTaskKeys = ["reference-country","recovery-phrase","display-preferences"] as const;
export type ConfigurationTaskKey = typeof configurationTaskKeys[number];
export type ConfigurationStatus = "todo" | "done" | "ignored";
export type ConfigurationTask = Readonly<{ key: ConfigurationTaskKey; status: ConfigurationStatus }>;
export type ConfigurationChecklist = Readonly<{
  locale: "fr" | "en"; tasks: readonly ConfigurationTask[];
}>;
const statuses = ["todo","done","ignored"] as const;

export function parseConfigurationChange(body: unknown): {key:ConfigurationTaskKey;status:ConfigurationStatus}|null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const input=body as Record<string,unknown>;
  if (Object.keys(input).length!==2 || !Object.hasOwn(input,"key") || !Object.hasOwn(input,"status") ||
    !configurationTaskKeys.includes(input.key as ConfigurationTaskKey) ||
    !statuses.includes(input.status as ConfigurationStatus)) return null;
  return {key:input.key as ConfigurationTaskKey,status:input.status as ConfigurationStatus};
}

/** Pure read: never mutate through GET or synthesize auto-completion. */
export async function readConfigurationChecklist(client:Client):Promise<ConfigurationChecklist> {
  const general=await client.query<{locale:string}>(`
    SELECT locale FROM public.smn_general_settings WHERE installation_id='singleton'`);
  if (general.rows.length!==1 || !["fr","en"].includes(general.rows[0].locale))
    throw new Error("configuration-locale-unavailable");
  const result=await client.query<{task_key:string;status:string}>(`
    SELECT task_key,status FROM public.smn_configuration_task
    WHERE installation_id='singleton'
    ORDER BY CASE task_key WHEN 'reference-country' THEN 1
      WHEN 'recovery-phrase' THEN 2 WHEN 'display-preferences' THEN 3 ELSE 4 END
  `);
  if (result.rows.length!==configurationTaskKeys.length ||
      configurationTaskKeys.some((key,index)=>result.rows[index]?.task_key!==key ||
        !statuses.includes(result.rows[index]?.status as ConfigurationStatus)))
    throw new Error("configuration-tasks-unavailable");
  return {
    locale:general.rows[0].locale as "fr"|"en",
    tasks:result.rows.map(row=>({key:row.task_key as ConfigurationTaskKey,
      status:row.status as ConfigurationStatus})),
  };
}

/** Explicit administrator changes, isolated from Sprint, risks and reporting. */
export async function updateConfigurationTask(client:Client,actorId:string,body:unknown) {
  const change=parseConfigurationChange(body);
  if (!change || !actorId) return {ok:false as const,error:"invalid-input" as const};
  const result=await client.query(`
    UPDATE public.smn_configuration_task
    SET status=$2,updated_by=$3,updated_at=now()
    WHERE installation_id='singleton' AND task_key=$1 AND status IS DISTINCT FROM $2
  `,[change.key,change.status,actorId]);
  if (result.rowCount!==1 && result.rowCount!==0) throw new Error("configuration-update-failed");
  return {ok:true as const,checklist:await readConfigurationChecklist(client)};
}

/** Called after a verified configuration write, before its COMMIT. Ignored is immutable automatically. */
export async function completeConfigurationTask(client:Client,key:"reference-country"|"recovery-phrase"):Promise<void> {
  await client.query(`
    UPDATE public.smn_configuration_task SET status='done',updated_by=NULL,updated_at=now()
    WHERE installation_id='singleton' AND task_key=$1 AND status='todo'
  `,[key]);
}
