import "server-only";
import type {Client} from "pg";
import {withSessionReadDb} from "../auth/database";
import type {ImpactCategory,ImpactFinding,ErasureMode} from "./exceptional-erasure-policy";

/** Whitelist of direct member relationships. Never use table identifiers supplied by a user. */
const TABLES=[
 {name:"smn_member",column:"id",category:"personal-records"},
 {name:"smn_member_assignment",column:"member_id",category:"associations"},
 {name:"smn_member_assignment_version",column:null,category:"history"},
 {name:"smn_member_calendar_week",column:"member_id",category:"calendars"},
 {name:"smn_member_calendar_exception",column:"member_id",category:"calendars"},
 {name:"smn_member_location",column:"member_id",category:"history"},
 {name:"smn_member_absence",column:"member_id",category:"calendars"},
 {name:"smn_member_absence_history",column:null,category:"history"},
 {name:"smn_member_identity_history",column:"member_id",category:"history"}
] as const;
const ID=/^[a-zA-Z0-9_-]{1,120}$/;
export const IMPACT_CLASSES=[
 "personal-records","associations","calendars","history","free-text",
 "private-files","archived-pdf-txt","collective-indicators","managed-backups"
] as const satisfies readonly ImpactCategory[];

export type ErasurePreview=Readonly<{
 memberId:string;memberLabel:string;mode:ErasureMode;
 capturedAt:string;complete:false;canExecute:false;
 findings:readonly ImpactFinding[];
 observedTables:readonly {table:string;count:number;state:"inspected"|"unknown"}[];
 warnings:readonly ("indirect-links-unchecked"|"free-text-unchecked"|
 "archived-files-unchecked"|"indicators-unchecked"|"managed-backups-may-contain-data"|
 "external-copies-not-controlled"|"no-erasure-ledger")[];
}>;

export async function listErasureTargets():Promise<readonly {id:string;label:string}[]>{
 return withSessionReadDb(async db=>{
  const rows=await db.query<{id:string;display_name:string}>(`
   SELECT id,display_name FROM public.smn_member
   WHERE installation_id='singleton' ORDER BY display_name,id LIMIT 500`);
  return rows.rows.map(x=>({id:x.id,label:x.display_name}));
 });
}

async function previewOnClient(db:Client,memberId:string,mode:ErasureMode):Promise<ErasurePreview>{
 const member=await db.query<{id:string;display_name:string}>(`
  SELECT id,display_name FROM public.smn_member
  WHERE id=$1 AND installation_id='singleton'`,[memberId]);
 if(member.rowCount!==1)throw new Error("target-unavailable");
 const observed:ErasurePreview["observedTables"][number][]=[];
 const counts=new Map<ImpactCategory,number>();
 const unknown=new Set<ImpactCategory>();
 for(const t of TABLES){
  // A table may be absent in legacy installations, or may use indirect references.
  const known=await db.query<{exists:boolean}>(`
   SELECT EXISTS(SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=$1 AND column_name=$2) AS exists`,
   [t.name,t.column??"member_id"]);
  if(!t.column||known.rows[0]?.exists!==true){
   unknown.add(t.category);observed.push({table:t.name,count:0,state:"unknown"});continue;
  }
  // Table and column identifiers are compile-time whitelist literals.
  const result=await db.query<{count:string}>(`
   SELECT count(*)::text AS count FROM public."${t.name}" WHERE "${t.column}"=$1`,[memberId]);
  const number=Number(result.rows[0]?.count);
  if(!Number.isSafeInteger(number))throw new Error("impact-count-invalid");
  counts.set(t.category,(counts.get(t.category)??0)+number);
  observed.push({table:t.name,count:number,state:"inspected"});
 }
 const findings:ImpactFinding[]=IMPACT_CLASSES.map(category=>{
  const total=counts.get(category);
  const fullyInspected=!unknown.has(category)&&
   (category==="personal-records"||category==="associations"||category==="calendars");
  // Other domain modules, indirect references and personal data in free text cannot
  // be proven absent by enumerating foreign-key columns.
  return {category,state:fullyInspected?"inspected":"unknown",
   affectedCount:fullyInspected?(total??0):null,action:"review",
   justificationRecorded:false,reidentificationRisk:"unknown"};
 });
 return {memberId,memberLabel:member.rows[0].display_name,mode,
  capturedAt:new Date().toISOString(),complete:false,canExecute:false,
  findings,observedTables:observed,
  warnings:["indirect-links-unchecked","free-text-unchecked","archived-files-unchecked",
   "indicators-unchecked","managed-backups-may-contain-data",
   "external-copies-not-controlled","no-erasure-ledger"]};
}

export async function previewMemberErasure(memberId:string,mode:ErasureMode):Promise<ErasurePreview>{
 if(!ID.test(memberId)||!["erase","anonymize"].includes(mode))
  throw new Error("invalid-input");
 return withSessionReadDb(db=>previewOnClient(db,memberId,mode));
}
