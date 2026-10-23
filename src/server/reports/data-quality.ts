import type {Client} from "pg";
export type ReportDataQuality={
 state:"historical"|"provisional"|"history-missing";
 snapshotVersion:number|null;capturedAt:string|null;
 capacity:{initial:{quality:string;source:string|null};actual:{quality:string;source:string|null}};
};
const object=(v:unknown):Record<string,unknown>|null=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:null;
const quality=(value:unknown,source:string|null)=>{
 if(value===null||value===undefined)return {quality:"unavailable",source};
 return {quality:"recorded",source};
};
export function qualityFromSnapshot(snapshot:unknown,version:number,closedAt:string):ReportDataQuality{
 const s=object(snapshot),capacity=object(s?.capacity);
 const provenance=object(capacity?.provenance);
 return {state:"historical",snapshotVersion:version,capturedAt:closedAt,capacity:{
  initial:quality(capacity?.initial_jh,typeof provenance?.initial==="string"?provenance.initial:"closure-snapshot"),
  actual:quality(capacity?.actual_jh,typeof provenance?.actual==="string"?provenance.actual:"closure-snapshot")
 }};
}
export async function readReportDataQuality(db:Client,id:string,status:string):Promise<ReportDataQuality>{
 if(status!=="closed")return {state:"provisional",snapshotVersion:null,capturedAt:null,
 capacity:{initial:quality(null,null),actual:quality(null,null)}};
 const table=await db.query<{exists:boolean}>(`SELECT to_regclass('public.smn_sprint_closure_snapshot') IS NOT NULL AS exists`);
 if(!table.rows[0]?.exists)return {state:"history-missing",snapshotVersion:null,capturedAt:null,
 capacity:{initial:quality(null,null),actual:quality(null,null)}};
 const result=await db.query<{version:number;closedAt:string;snapshot:unknown}>(`
 SELECT version,closed_at::text AS "closedAt",snapshot
 FROM public.smn_sprint_closure_snapshot WHERE sprint_id=$1 ORDER BY version DESC LIMIT 1`,[id]);
 const row=result.rows[0];
 if(!row)return {state:"history-missing",snapshotVersion:null,capturedAt:null,
 capacity:{initial:quality(null,null),actual:quality(null,null)}};
 return qualityFromSnapshot(row.snapshot,row.version,row.closedAt);
}
