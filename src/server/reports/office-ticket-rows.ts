import {createHash} from "node:crypto";
import {readZip} from "../../../scripts/smn-397-office-poc.mjs";
import {browseTicketCsv} from "@/lib/ticket-csv-browse";
import {compareTicketSnapshots,type TicketComparison} from "@/lib/ticket-csv-compare";
import {readTicketSnapshot,type TicketScope,type TicketSnapshotMetadata} from "@/server/tickets/snapshot-storage";

export const officeTicketSources=[
 "TICKETS","TICKET_SUMMARY","TICKET_CHANGES","TICKET_COMPARE_SUMMARY",
] as const;
export type OfficeTicketSource=typeof officeTicketSources[number];
type Row=Record<string,string|null>;
type Reference={businessDate:string;snapshotId:string;sha256:string};
export type OfficeTicketRequest={current:Reference;previous?:Reference};
export class OfficeTicketSourceError extends Error{
 constructor(public readonly code:string){super(code);this.name="OfficeTicketSourceError";}
}
const date=/^\d{4}-\d{2}-\d{2}$/;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hash=/^[0-9a-f]{64}$/;
const comparisonNames=new Set<OfficeTicketSource>(["TICKET_CHANGES","TICKET_COMPARE_SUMMARY"]);
export function validateOfficeTicketRequest(raw:unknown):OfficeTicketRequest|null{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const item=raw as Record<string,unknown>;
 if(Object.keys(item).some(k=>!["current","previous"].includes(k)))return null;
 function parse(v:unknown):Reference|null{
  if(!v||typeof v!=="object"||Array.isArray(v))return null;
  const a=v as Record<string,unknown>;
  if(Object.keys(a).some(k=>!["businessDate","snapshotId","sha256"].includes(k)))return null;
  if(typeof a.businessDate!=="string"||!date.test(a.businessDate)||
    !Number.isFinite(Date.parse(a.businessDate+"T00:00:00Z"))||
    new Date(a.businessDate+"T00:00:00Z").toISOString().slice(0,10)!==a.businessDate||
    typeof a.snapshotId!=="string"||!uuid.test(a.snapshotId)||
    typeof a.sha256!=="string"||!hash.test(a.sha256))return null;
  return {businessDate:a.businessDate,snapshotId:a.snapshotId,sha256:a.sha256};
 }
 const current=parse(item.current),previous=item.previous===undefined?undefined:parse(item.previous);
 if(!current||item.previous!==undefined&&!previous)return null;
 if(previous&&(previous.businessDate===current.businessDate||previous.snapshotId===current.snapshotId))return null;
 return {current,...(previous?{previous}:{})};
}
/** Template discovery never loads tickets when the model doesn't use them. */
export function discoverOfficeTicketSources(bytes:Buffer):OfficeTicketSource[]{
 const sources=new Set<OfficeTicketSource>();
 for(const part of readZip(bytes)){
  if(!/^word\/(?:document|header\d+|footer\d+)\.xml$/.test(part.name)&&
   !/^ppt\/slides\/slide\d+\.xml$/.test(part.name))continue;
  const normalized=part.data.toString("utf8")
   .replace(/<\/(?:w:t|a:t)>[\s\S]*?<(?:w:t|a:t)(?:\s[^>]*)?>/g,"");
  for(const source of officeTicketSources)
   if(normalized.includes("{{ROW:"+source+"}}"))sources.add(source);
 }
 return [...sources];
}
function checkMetadata(metadata:TicketSnapshotMetadata,ref:Reference):void{
 if(metadata.businessDate!==ref.businessDate||metadata.snapshotId!==ref.snapshotId||
 metadata.sha256!==ref.sha256)throw new OfficeTicketSourceError("stale-snapshot");
}
function toRows(summary:ReturnType<typeof browseTicketCsv>["summary"]["all"]):Row[]{
 const sp=summary.storyPoints;
 return [{
  TICKET_COUNT:String(summary.ticketCount),
  TICKET_COMPLETED:String(summary.completedCount),
  TICKET_SP_SUM:sp.sum,
  TICKET_SP_NUMERIC:String(sp.numericCount),
  TICKET_SP_MISSING:String(sp.missingCount),
  TICKET_SP_INVALID:String(sp.invalidCount),
 }];
}
function compareRows(result:TicketComparison):Row[]{
 return result.changes.map(change=>({
  TICKET_ID:change.jiraId,
  TICKET_CHANGE_TYPES:change.kinds.join(", "),
  TICKET_OLD_TITLE:change.before?.title??null,
  TICKET_NEW_TITLE:change.after?.title??null,
  TICKET_OLD_STATUS:change.before?.status??null,
  TICKET_NEW_STATUS:change.after?.status??null,
  TICKET_OLD_SP:change.before?.storyPoints??null,
  TICKET_NEW_SP:change.after?.storyPoints??null,
  TICKET_FIELDS_CHANGED:change.fields.map(field=>field.field).join(", "),
 }));
}
function compareSummary(result:TicketComparison):Row[]{
 const x=result.counts;
 return [{
  TICKET_OLD_COUNT:String(x.oldTickets),TICKET_NEW_COUNT:String(x.newTickets),
  TICKET_ADDED:String(x.added),TICKET_REMOVED:String(x.removed),
  TICKET_COMPLETED:String(x.completed),TICKET_REOPENED:String(x.reopened),
  TICKET_SP_CHANGED:String(x.storyPointsChanged),TICKET_OTHER_CHANGED:String(x.otherChanged),
  TICKET_CHANGED_DISTINCT:String(x.changedTickets),TICKET_UNCHANGED:String(x.unchangedTickets),
 }];
}
export type OfficeTicketProjection={
 rows:Partial<Record<OfficeTicketSource,Row[]>>;
 provenance:{
  current:TicketSnapshotMetadata;
  previous:TicketSnapshotMetadata|null;
 };
};
export async function readOfficeTicketProjection(scope:TicketScope,
 request:OfficeTicketRequest,required:readonly OfficeTicketSource[]):Promise<OfficeTicketProjection>{
 for(const source of required)if(!officeTicketSources.includes(source))
  throw new OfficeTicketSourceError("invalid-source");
 const needComparison=required.some(x=>comparisonNames.has(x));
 if(needComparison&&!request.previous)throw new OfficeTicketSourceError("previous-required");
 // Authentication and team/cycle ownership must be verified by the calling Office endpoint.
 const options={authorize:async()=>{}};
 const current=await readTicketSnapshot(scope,request.current.businessDate,options);
 if(!current)throw new OfficeTicketSourceError("snapshot-missing");
 checkMetadata(current.metadata,request.current);
 const previous=needComparison&&request.previous?
  await readTicketSnapshot(scope,request.previous.businessDate,options):null;
 if(needComparison&&!previous)throw new OfficeTicketSourceError("snapshot-missing");
 if(previous&&request.previous)checkMetadata(previous.metadata,request.previous);
 const rows:OfficeTicketProjection["rows"]={};
 if(required.includes("TICKETS")||required.includes("TICKET_SUMMARY")){
  const parsed=browseTicketCsv(current.csv);
  if(required.includes("TICKETS"))rows.TICKETS=parsed.rows.map(row=>({
   TICKET_ID:row.jiraId,TICKET_TYPE:row.issueType,TICKET_TITLE:row.title,
   TICKET_PRIORITY:row.priority,TICKET_STATUS:row.status,TICKET_SP:row.storyPoints,
  }));
  if(required.includes("TICKET_SUMMARY"))rows.TICKET_SUMMARY=toRows(parsed.summary.all);
 }
 if(previous&&request.previous){
  const comparison=compareTicketSnapshots(
   {reference:{...scope,businessDate:request.previous.businessDate,snapshotId:previous.metadata.snapshotId},csv:previous.csv},
   {reference:{...scope,businessDate:request.current.businessDate,snapshotId:current.metadata.snapshotId},csv:current.csv},
  );
  if(required.includes("TICKET_CHANGES"))rows.TICKET_CHANGES=compareRows(comparison);
  if(required.includes("TICKET_COMPARE_SUMMARY"))
   rows.TICKET_COMPARE_SUMMARY=compareSummary(comparison);
 }
 return {rows,provenance:{current:current.metadata,previous:previous?.metadata??null}};
}
