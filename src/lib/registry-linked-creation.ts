import type {RegistryType} from "./registry-types";

/** A journal can produce only autonomous follow-up records, never risks or obstacles. */
export const linkedJournalTypes=["action","decision","highlight"] as const;
export type LinkedJournalType=(typeof linkedJournalTypes)[number];
const uuidRx=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const allowedKeys=new Set(["requestId","teamId","type","title","occurredOn","status",
 "description","owner","dueOn","comment","details"]);
export function isLinkedJournalType(value:RegistryType):value is LinkedJournalType{
 return linkedJournalTypes.some(type=>type===value);
}
export function parseLinkedJournalCreation(raw:unknown):
 (Record<string,unknown>&{type:LinkedJournalType;requestId:string})|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const value=raw as Record<string,unknown>;
 if(Object.keys(value).some(key=>!allowedKeys.has(key))||
  typeof value.type!=="string"||
  !linkedJournalTypes.some(type=>type===value.type)||
  typeof value.requestId!=="string"||!uuidRx.test(value.requestId))return null;
 return value as Record<string,unknown>&{type:LinkedJournalType;requestId:string};
}
