import {registryTypes,registryStatuses,type RegistryType} from "./registry-types";

const idRx=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
const isType=(v:unknown):v is RegistryType=>
 typeof v==="string"&&registryTypes.some(type=>type===v);
const isStatus=(type:RegistryType,status:unknown):status is string=>
 typeof status==="string"&&(registryStatuses[type] as readonly string[]).includes(status);
export type RegistryRelation={
 id:string;sourceId:string;sourceTitle:string;sourceType:RegistryType;sourceStatus:string;
 targetKind:"record"|"goal";targetId:string;targetTitle:string;
 targetType:RegistryType|"goal";targetStatus:string|null;targetCycleStatus?:string|null
};
export type RelationView={
 relation:RegistryRelation;linkedId:string;linkedTitle:string;
 linkedType:RegistryType|"goal";linkedStatus:string|null;
 direction:"incoming"|"outgoing"
};
export type RelationGroup={type:RegistryType|"goal";items:RelationView[]};

export function parseRelationPayload(raw:unknown,id:string):RegistryRelation[]|null{
 if(!idRx.test(id)||!object(raw)||!Array.isArray(raw.relations))return null;
 const results:RegistryRelation[]=[];
 for(const entry of raw.relations as unknown[]){
  if(!object(entry)||typeof entry.id!=="string"||!idRx.test(entry.id)||
   typeof entry.sourceId!=="string"||!idRx.test(entry.sourceId)||
   typeof entry.targetId!=="string"||!idRx.test(entry.targetId)||
   (entry.sourceId!==id&&entry.targetId!==id)||
   entry.targetKind!=="record"&&entry.targetKind!=="goal"||
   typeof entry.sourceTitle!=="string"||!entry.sourceTitle.trim()||
   typeof entry.targetTitle!=="string"||!entry.targetTitle.trim()||
   (entry.targetCycleStatus!==undefined&&entry.targetCycleStatus!==null&&
    typeof entry.targetCycleStatus!=="string")||
   !isType(entry.sourceType)||!isStatus(entry.sourceType,entry.sourceStatus)||
   (entry.targetKind==="record"?
    !isType(entry.targetType)||!isStatus(entry.targetType,entry.targetStatus):
    entry.targetType!=="goal"||entry.targetStatus!==null||entry.sourceId!==id)
  )return null;
  results.push(entry as RegistryRelation);
 }
 return results;
}

export function groupRegistryRelations(rows:readonly RegistryRelation[],id:string):RelationGroup[]{
 const groups=new Map<RegistryType|"goal",RelationView[]>();
 for(const entry of rows){
  const incoming=entry.targetKind==="record"&&entry.targetId===id;
  const linkedType=incoming?entry.sourceType:entry.targetType;
  const view:RelationView={
   relation:entry,direction:incoming?"incoming":"outgoing",
   linkedId:incoming?entry.sourceId:entry.targetId,
   linkedTitle:incoming?entry.sourceTitle:entry.targetTitle,
   linkedType,linkedStatus:incoming?entry.sourceStatus:entry.targetStatus
  };
  groups.set(linkedType,[...(groups.get(linkedType)??[]),view]);
 }
 return [...registryTypes,"goal" as const].filter(type=>groups.has(type))
  .map(type=>({type,items:groups.get(type)!}));
}
