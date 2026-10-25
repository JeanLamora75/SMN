import {validRegistryActivityTime} from "./registry-summary-context";

export type JournalFilter="all"|"comments"|"action"|"decision"|"highlight";
export const journalFilters:readonly JournalFilter[]=[
 "all","comments","action","decision","highlight"
];
const recordTypes=["action","decision","highlight"] as const;
const idRx=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const object=(value:unknown):value is Record<string,unknown>=>
 value!==null&&typeof value==="object"&&!Array.isArray(value);
const nullable=(value:unknown):value is string|null=>value===null||typeof value==="string";
const time=(value:unknown):value is string=>
 typeof value==="string"&&validRegistryActivityTime(value)!==null;
const dateOrNull=(value:unknown):value is string|null=>value===null||time(value);

export type JournalComment={
 id:string;text:string|null;revision:number;
 createdAt:string;editedAt:string|null;withdrawnAt:string|null;
 edited:boolean;withdrawn:boolean;
 authorName:string|null;editorName:string|null;withdrawnByName:string|null;
};
export type JournalLink={
 id:string;recordId:string;title:string;type:"action"|"decision"|"highlight";
 recordedAt:string;authorName:string|null;
};
export type JournalLegacy={
 text:string;author:null;recordedAt:null;origin:"legacy";
};
export type JournalPayload={
 comments:JournalComment[];events:JournalLink[];legacy:JournalLegacy|null;
};
export type JournalEntry=
 |{id:string;kind:"comment";at:string;comment:JournalComment}
 |{id:string;kind:"link";at:string;recordId:string;title:string;
  type:JournalLink["type"];authorName:string|null};

export function parseJournalPayload(raw:unknown):JournalPayload|null{
 if(!object(raw)||!Array.isArray(raw.comments)||!Array.isArray(raw.events))return null;
 let legacy:JournalLegacy|null=null;
 if(raw.legacy!==null){
  if(!object(raw.legacy)||typeof raw.legacy.text!=="string"||
   raw.legacy.origin!=="legacy"||raw.legacy.author!==null||
   raw.legacy.recordedAt!==null)return null;
  legacy={text:raw.legacy.text,origin:"legacy",author:null,recordedAt:null};
 }
 const comments:JournalComment[]=[];
 for(const c of raw.comments as unknown[]){
  if(!object(c)||typeof c.id!=="string"||!idRx.test(c.id)||
   !Number.isSafeInteger(c.revision)||typeof c.revision!=="number"||c.revision<1||
   !time(c.createdAt)||!dateOrNull(c.editedAt)||!dateOrNull(c.withdrawnAt)||
   typeof c.edited!=="boolean"||typeof c.withdrawn!=="boolean"||
   c.withdrawn!==(c.withdrawnAt!==null)||
   (c.withdrawn?c.text!==null:typeof c.text!=="string"||!c.text.trim())||
   !nullable(c.authorName)||!nullable(c.editorName)||!nullable(c.withdrawnByName))return null;
  comments.push(c as JournalComment);
 }
 const events:JournalLink[]=[];
 for(const e of raw.events as unknown[]){
  if(!object(e)||typeof e.id!=="string"||!idRx.test(e.id)||
   typeof e.recordId!=="string"||!idRx.test(e.recordId)||
   typeof e.title!=="string"||!e.title.trim()||
   !recordTypes.some(type=>type===e.type)||!time(e.recordedAt)||
   !nullable(e.authorName))return null;
  events.push(e as JournalLink);
 }
 return {comments,events,legacy};
}

export function buildJournalEntries(p:JournalPayload):JournalEntry[]{
 const entries:JournalEntry[]=[
  ...p.comments.map((comment):JournalEntry=>({
   id:"comment:"+comment.id,kind:"comment",
   at:comment.withdrawnAt??comment.editedAt??comment.createdAt,comment
  })),
  ...p.events.map((event):JournalEntry=>({
   id:"link:"+event.id,kind:"link",at:event.recordedAt,
   recordId:event.recordId,title:event.title,type:event.type,authorName:event.authorName
  }))
 ];
 return entries.sort((a,b)=>{
  const difference=Date.parse(b.at)-Date.parse(a.at);
  return difference||a.id.localeCompare(b.id);
 });
}
export function filterJournalEntries(entries:readonly JournalEntry[],filter:JournalFilter):JournalEntry[]{
 return filter==="all"?[...entries]:entries.filter(entry=>
  filter==="comments"?entry.kind==="comment":
   entry.kind==="link"&&entry.type===filter
 );
}
