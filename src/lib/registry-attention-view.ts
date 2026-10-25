import {registryStatuses} from "./registry-types";

export const registryAttentionReasons=["highRisk","obstacle","atRisk","upcoming","overdue"] as const;
export type RegistryAttentionReason=(typeof registryAttentionReasons)[number];
export type RegistryAttentionEntry={
 id:string;type:"risk"|"obstacle"|"dependency"|"action";
 title:string;status:string;reason:RegistryAttentionReason;dueOn:string|null;
};
export type RegistryAttentionPayload={alerts:RegistryAttentionEntry[];days:number};
const types=["risk","obstacle","dependency","action"] as const;
const isPlainObject=(value:unknown):value is Record<string,unknown>=>
 typeof value==="object"&&value!==null&&!Array.isArray(value);

/**
 * A missing or malformed SMN-104 payload never means zero alerts.
 * All linked records come from the server, not from generated samples.
 */
export function parseRegistryAttentionPayload(data:unknown):RegistryAttentionPayload|null{
 if(!isPlainObject(data)||!Array.isArray(data.alerts)||
  !Number.isInteger(data.days)||typeof data.days!=="number"||
  data.days<0||data.days>365)return null;
 const alerts:RegistryAttentionEntry[]=[];
 for(const raw of data.alerts as unknown[]){
  if(!isPlainObject(raw)||typeof raw.id!=="string"||raw.id.length===0||
   typeof raw.title!=="string"||raw.title.length===0||
   typeof raw.type!=="string"||!types.some(t=>t===raw.type)||
   typeof raw.status!=="string"||
   !(registryStatuses[raw.type as RegistryAttentionEntry["type"]] as readonly string[]).includes(raw.status)||
   typeof raw.reason!=="string"||
   !(registryAttentionReasons as readonly string[]).includes(raw.reason)||
   !(raw.dueOn===null||(typeof raw.dueOn==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(raw.dueOn))))return null;
  alerts.push({
   id:raw.id,type:raw.type as RegistryAttentionEntry["type"],
   title:raw.title,status:raw.status,reason:raw.reason as RegistryAttentionReason,
   dueOn:raw.dueOn as string|null
  });
 }
 return {alerts,days:data.days as number};
}
