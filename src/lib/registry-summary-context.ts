/** Validation of existing collective read APIs; never turn a failed producer into an empty panel. */
const idRx=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const obj=(x:unknown):x is Record<string,unknown>=>x!==null&&typeof x==="object"&&!Array.isArray(x);
export type SummaryRelation={id:string;sourceId:string;targetId:string;
 targetKind:"record"|"goal";sourceTitle:string;targetTitle:string};
export type SummaryCycle={id:string;name:string;status:string};
export type SummaryContext<T>={state:"loading"}|{state:"unavailable"}|{state:"ready";items:T[]};

export function parseSummaryRelations(payload:unknown,recordId:string):SummaryRelation[]|null{
 if(!obj(payload)||!Array.isArray(payload.relations)||!idRx.test(recordId))return null;
 const result:SummaryRelation[]=[];
 for(const raw of payload.relations as unknown[]){
  if(!obj(raw)||typeof raw.id!=="string"||!idRx.test(raw.id)||
   typeof raw.sourceId!=="string"||!idRx.test(raw.sourceId)||
   typeof raw.targetId!=="string"||!idRx.test(raw.targetId)||
   (raw.targetKind!=="record"&&raw.targetKind!=="goal")||
   typeof raw.sourceTitle!=="string"||!raw.sourceTitle.trim()||
   typeof raw.targetTitle!=="string"||!raw.targetTitle.trim()||
   (raw.sourceId!==recordId&&!(raw.targetKind==="record"&&raw.targetId===recordId)))return null;
  result.push(raw as SummaryRelation);
 }
 return result;
}

/** The legacy Sprint-cycle endpoint returns ALL offered cycles plus only linked IDs.
 * Never label all offered cycles as associated cycles. */
export function parseSummaryCycles(payload:unknown):SummaryCycle[]|null{
 if(!obj(payload)||!Array.isArray(payload.cycles)||!Array.isArray(payload.linkedIds))return null;
 const cycles:SummaryCycle[]=[];
 const ids=new Set<string>();
 for(const raw of payload.cycles as unknown[]){
  if(!obj(raw)||typeof raw.id!=="string"||!idRx.test(raw.id)||
   typeof raw.name!=="string"||!raw.name.trim()||
   typeof raw.status!=="string")return null;
  cycles.push(raw as SummaryCycle);
  ids.add(raw.id);
 }
 const linked=new Set<string>();
 for(const id of payload.linkedIds as unknown[]){
  if(typeof id!=="string"||!idRx.test(id)||!ids.has(id))return null;
  linked.add(id);
 }
 return cycles.filter(c=>linked.has(c.id));
}

export function validRegistryActivityTime(raw:unknown):string|null{
 if(typeof raw!=="string"||!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(raw)||
  !Number.isFinite(Date.parse(raw)))return null;
 return raw;
}
