import {
 isCompletedTicketStatus,validateTicketCsv,type TicketCsvRow,
} from "./ticket-csv-contract";

/** Domain comparison: no database access, no writes, no indicator-v33 dependency. */
export type TicketSnapshotRef=Readonly<{
 teamId:string;
 cycleId:string;
 mode:"scrum"|"kanban";
 snapshotId:string;
 businessDate:string; // YYYY-MM-DD, local business date without time zone
}>;
export type TicketChangeField="issueType"|"title"|"priority"|"status"|"storyPoints";
export type TicketFieldChange=Readonly<{field:TicketChangeField;before:string;after:string}>;
export type TicketChangeKind="added"|"removed"|"completed"|"reopened"|"storyPointsChanged"|"otherChanged";
export type TicketChange=Readonly<{
 jiraId:string;
 kinds:TicketChangeKind[];
 before:TicketCsvRow|null;
 after:TicketCsvRow|null;
 fields:TicketFieldChange[];
}>;
export type TicketComparisonCounts=Readonly<{
 oldTickets:number;
 newTickets:number;
 sharedTickets:number;
 added:number;
 removed:number;
 completed:number;
 reopened:number;
 storyPointsChanged:number;
 otherChanged:number;
 changedTickets:number;
 unchangedTickets:number;
}>;
export type TicketComparison=Readonly<{
 older:TicketSnapshotRef;
 newer:TicketSnapshotRef;
 counts:TicketComparisonCounts;
 changes:TicketChange[];
}>;

export class TicketComparisonError extends Error{
 constructor(public readonly code:string){super(code);this.name="TicketComparisonError";}
}
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
const compareKeys=(a:string,b:string)=>a.localeCompare(b,"fr",{numeric:true,sensitivity:"base"});
function validateRef(ref:TicketSnapshotRef):void{
 if(!ref||typeof ref!=="object"||!ref.teamId||!ref.cycleId||!ref.snapshotId||
  !["scrum","kanban"].includes(ref.mode)||!datePattern.test(ref.businessDate)||
  !Number.isFinite(Date.parse(ref.businessDate+"T00:00:00Z"))||
  new Date(ref.businessDate+"T00:00:00Z").toISOString().slice(0,10)!==ref.businessDate)
  throw new TicketComparisonError("invalid-snapshot-reference");
}
function idKey(id:string):string{return id.trim().toUpperCase();}

/** Ignore purely representational differences, never treat invalid SP as numeric zero. */
function storyPointEqual(a:string,b:string):boolean{
 const re=/^([+-]?)(?:(\d+)(?:[.,](\d+))?|[.,](\d+))$/;
 const left=re.exec(a.trim()),right=re.exec(b.trim());
 if(!left||!right)return a===b;
 const decimal=(match:RegExpExecArray)=>{
  const fractional=match[3]??match[4]??"";
  const base=BigInt((match[2]??"0")+fractional)*(match[1]==="-"?-1n:1n);
  return {base,scale:fractional.length};
 };
 const l=decimal(left),r=decimal(right);
 const scale=Math.max(l.scale,r.scale);
 return l.base*10n**BigInt(scale-l.scale)===r.base*10n**BigInt(scale-r.scale);
}
const fields:readonly TicketChangeField[]=["issueType","title","priority","status","storyPoints"];
function fieldChanges(before:TicketCsvRow,after:TicketCsvRow):TicketFieldChange[]{
 const result:TicketFieldChange[]=[];
 for(const field of fields){
  const equal=field==="storyPoints"?
   storyPointEqual(before.storyPoints,after.storyPoints):before[field]===after[field];
  if(!equal)result.push({field,before:before[field],after:after[field]});
 }
 return result;
}
function indexRows(csv:string):Map<string,TicketCsvRow>{
 const parsed=validateTicketCsv(csv);
 if(!parsed.valid)throw new TicketComparisonError("invalid-csv");
 const indexed=new Map<string,TicketCsvRow>();
 for(const row of parsed.rows){
  const id=idKey(row.jiraId);
  // Preserve the parser's identity policy even if a future parser changes.
  if(indexed.has(id))throw new TicketComparisonError("duplicate-jira-id");
  indexed.set(id,row);
 }
 return indexed;
}

/** Dates must be distinct because SMN retains one snapshot per team/cycle/date. */
export function compareTicketSnapshots(
 first:Readonly<{reference:TicketSnapshotRef;csv:string}>,
 second:Readonly<{reference:TicketSnapshotRef;csv:string}>,
):TicketComparison{
 validateRef(first.reference);validateRef(second.reference);
 const a=first.reference,b=second.reference;
 if(a.teamId!==b.teamId||a.cycleId!==b.cycleId||a.mode!==b.mode)
  throw new TicketComparisonError("different-cycle");
 if(a.snapshotId===b.snapshotId)
  throw new TicketComparisonError("same-snapshot");
 if(a.businessDate===b.businessDate)
  throw new TicketComparisonError("same-business-date");
 const older=a.businessDate<b.businessDate?first:second;
 const newer=older===first?second:first;
 const oldRows=indexRows(older.csv),newRows=indexRows(newer.csv);
 const changes:TicketChange[]=[];
 const counts={
  oldTickets:oldRows.size,newTickets:newRows.size,sharedTickets:0,
  added:0,removed:0,completed:0,reopened:0,
  storyPointsChanged:0,otherChanged:0,changedTickets:0,unchangedTickets:0,
 };
 const ids=[...new Set([...oldRows.keys(),...newRows.keys()])].sort(compareKeys);
 for(const id of ids){
  const before=oldRows.get(id)??null,after=newRows.get(id)??null;
  if(!before&&after){
   counts.added++;counts.changedTickets++;
   changes.push({jiraId:after.jiraId,kinds:["added"],before:null,after,fields:[]});
   continue;
  }
  if(before&&!after){
   counts.removed++;counts.changedTickets++;
   changes.push({jiraId:before.jiraId,kinds:["removed"],before,after:null,fields:[]});
   continue;
  }
  if(!before||!after)continue;
  counts.sharedTickets++;
  const fieldsChanged=fieldChanges(before,after);
  const kinds:TicketChangeKind[]=[];
  const wasCompleted=isCompletedTicketStatus(before.status);
  const nowCompleted=isCompletedTicketStatus(after.status);
  if(!wasCompleted&&nowCompleted){counts.completed++;kinds.push("completed");}
  if(wasCompleted&&!nowCompleted){counts.reopened++;kinds.push("reopened");}
  if(fieldsChanged.some(x=>x.field==="storyPoints")){
   counts.storyPointsChanged++;kinds.push("storyPointsChanged");
  }
  if(fieldsChanged.some(x=>x.field!=="storyPoints")){
   counts.otherChanged++;kinds.push("otherChanged");
  }
  if(fieldsChanged.length){
   counts.changedTickets++;
   changes.push({jiraId:after.jiraId,kinds,before,after,fields:fieldsChanged});
  }else counts.unchangedTickets++;
 }
 return {older:older.reference,newer:newer.reference,counts,changes};
}
