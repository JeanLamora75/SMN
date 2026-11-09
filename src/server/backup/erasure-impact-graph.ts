import type {Client} from "pg";
import type {ImpactCategory} from "./exceptional-erasure-policy";

export type TableImpact=Readonly<{
 table:string;count:number|null;state:"inspected"|"unknown";
 category:ImpactCategory;scope:"direct"|"indirect"|"text-match"|"team-archive";
}>;

/** All SQL identifiers below are compile-time constants, never request parameters. */
type Relation=Readonly<{
 table:string;category:ImpactCategory;scope:"direct"|"indirect";
 columns:readonly string[];sql:string;
}>;
const RELATIONS:readonly Relation[]=[
 {table:"smn_member",category:"personal-records",scope:"direct",columns:["id","installation_id"],
  sql:"SELECT count(*)::text AS n FROM public.smn_member WHERE id=$1 AND installation_id='singleton'"},
 {table:"smn_member_assignment",category:"associations",scope:"direct",columns:["member_id"],
  sql:"SELECT count(*)::text AS n FROM public.smn_member_assignment WHERE member_id::text=$1"},
 {table:"smn_member_assignment_version",category:"history",scope:"indirect",
  columns:["assignment_id"],
  sql:"SELECT count(*)::text AS n FROM public.smn_member_assignment_version v JOIN public.smn_member_assignment a ON a.id::text=v.assignment_id::text WHERE a.member_id::text=$1"},
 {table:"smn_member_assignment_start_audit",category:"history",scope:"direct",
  columns:["member_id"],
  sql:"SELECT count(*)::text AS n FROM public.smn_member_assignment_start_audit WHERE member_id::text=$1"},
 {table:"smn_member_absence",category:"calendars",scope:"direct",columns:["member_id"],
  sql:"SELECT count(*)::text AS n FROM public.smn_member_absence WHERE member_id::text=$1"},
 {table:"smn_member_absence_history",category:"history",scope:"indirect",columns:["absence_id"],
  sql:"SELECT count(*)::text AS n FROM public.smn_member_absence_history h JOIN public.smn_member_absence a ON a.id::text=h.absence_id::text WHERE a.member_id::text=$1"},
 {table:"smn_member_calendar_week",category:"calendars",scope:"direct",columns:["member_id"],
  sql:"SELECT count(*)::text AS n FROM public.smn_member_calendar_week WHERE member_id::text=$1"},
 {table:"smn_member_calendar_exception",category:"calendars",scope:"direct",columns:["member_id"],
  sql:"SELECT count(*)::text AS n FROM public.smn_member_calendar_exception WHERE member_id::text=$1"},
 {table:"smn_member_location",category:"history",scope:"direct",columns:["member_id"],
  sql:"SELECT count(*)::text AS n FROM public.smn_member_location WHERE member_id::text=$1"},
 {table:"smn_member_identity_history",category:"history",scope:"direct",columns:["member_id"],
  sql:"SELECT count(*)::text AS n FROM public.smn_member_identity_history WHERE member_id::text=$1"},
 {table:"smn_member_lifecycle_event",category:"history",scope:"direct",columns:["member_id"],
  sql:"SELECT count(*)::text AS n FROM public.smn_member_lifecycle_event WHERE member_id::text=$1"}
];

/** Explicitly check exact schema shapes before querying; missing paths remain unknown. */
async function available(db:Client,table:string,columns:readonly string[]):Promise<boolean>{
 const r=await db.query<{present:boolean}>(`
  SELECT to_regclass($1::text) IS NOT NULL AND
   (SELECT count(*)::int FROM information_schema.columns
    WHERE table_schema='public' AND table_name=$2 AND column_name=ANY($3::text[]))
     = cardinality($3::text[]) AS present`,
  ["public."+table,table,[...columns]]);
 return r.rows[0]?.present===true;
}
function safeCount(value:string|undefined):number{
 const number=Number(value);
 if(!Number.isSafeInteger(number)||number<0)throw new Error("erasure-impact-count-invalid");
 return number;
}
export async function inspectMemberRelations(db:Client,memberId:string):Promise<TableImpact[]>{
 const result:TableImpact[]=[];
 for(const item of RELATIONS){
  // A joined path also requires its parent table and columns.
  const parents=item.scope!=="indirect"||(
   await available(db,item.table==="smn_member_absence_history"?
    "smn_member_absence":"smn_member_assignment",["id","member_id"]));
  if(!parents||!await available(db,item.table,item.columns)){
   result.push({table:item.table,category:item.category,scope:item.scope,count:null,state:"unknown"});
   continue;
  }
  const rows=await db.query<{n:string}>(item.sql,[memberId]);
  result.push({table:item.table,category:item.category,scope:item.scope,
   count:safeCount(rows.rows[0]?.n),state:"inspected"});
 }
 return result;
}

type TextSource=Readonly<{table:string;columns:readonly string[];teamColumn:string|null}>;
const TEXT_SOURCES:readonly TextSource[]=[
 {table:"smn_registry_item",columns:["title","description","owner_name","comment"],teamColumn:"team_id"},
 {table:"smn_registry_comment",columns:["body","author_name","editor_name","withdrawn_by_name"],teamColumn:null},
 {table:"smn_dashboard_note",columns:["body"],teamColumn:"team_id"},
 {table:"smn_report_document",columns:["title","content"],teamColumn:"team_id"},
 {table:"smn_report_studio_archive_snapshot",columns:["snapshot"],teamColumn:null},
 {table:"smn_sprint_review_analysis",columns:["body"],teamColumn:null},
 {table:"smn_sprint_goal",columns:["title","comment"],teamColumn:null}
];
/**
 * Heuristic positive matches; a zero means "no match in this inspected source",
 * never absence of personal data. Uses exact literal substring, not regex.
 */
export async function inspectTextCandidates(db:Client,memberId:string,
 terms:readonly string[]):Promise<TableImpact[]>{
 const meaningful=[...new Set(terms.map(s=>s.trim().toLocaleLowerCase("fr"))
  .filter(s=>s.length>=3&&s.length<=254))];
 const result:TableImpact[]=[];
 for(const source of TEXT_SOURCES){
  const columns=[...source.columns,...source.teamColumn?[source.teamColumn]:[]];
  if(!await available(db,source.table,columns)){
   result.push({table:source.table,category:"free-text",scope:"text-match",count:null,state:"unknown"});
   continue;
  }
  if(meaningful.length===0){
   result.push({table:source.table,category:"free-text",scope:"text-match",count:null,state:"unknown"});
   continue;
  }
  const expressions=source.columns.map(c=>`coalesce(t."${c}"::text,'')`).join(" || ' ' || ");
  const scoped=source.teamColumn
   ? ` AND t."${source.teamColumn}" IN (SELECT team_id FROM public.smn_member_assignment WHERE member_id::text=$1)`
   : "";
  // Do not claim scoping for tables without a reliable team path.
  const sql=`SELECT count(*)::text AS n FROM public."${source.table}" t
   WHERE EXISTS(SELECT 1 FROM unnest($2::text[]) term
    WHERE position(term IN lower(${expressions}))>0)${scoped}`;
  const rows=await db.query<{n:string}>(sql,[memberId,meaningful]);
  result.push({table:source.table,category:"free-text",scope:"text-match",
   count:safeCount(rows.rows[0]?.n),state:"inspected"});
 }
 return result;
}

/** Team-wide archives are potentially affected, not proven to contain a person. */
export async function inspectArchiveCandidates(db:Client,memberId:string):Promise<TableImpact[]>{
 const tables=[
  {table:"smn_report_pdf_archive",teamColumn:"team_id"},
  {table:"smn_ai_brief_archive",teamColumn:"team_id"},
  {table:"smn_report_document",teamColumn:"team_id"}
 ] as const;
 const result:TableImpact[]=[];
 for(const item of tables){
  if(!await available(db,item.table,[item.teamColumn])){
   result.push({table:item.table,category:"archived-pdf-txt",scope:"team-archive",
    count:null,state:"unknown"});continue;
  }
  const rows=await db.query<{n:string}>(`
   SELECT count(*)::text AS n FROM public."${item.table}" t
   WHERE t."${item.teamColumn}" IN
    (SELECT team_id FROM public.smn_member_assignment WHERE member_id::text=$1)`,[memberId]);
  result.push({table:item.table,category:"archived-pdf-txt",scope:"team-archive",
   count:safeCount(rows.rows[0]?.n),state:"inspected"});
 }
 return result;
}
