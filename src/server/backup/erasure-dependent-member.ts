import type {Client} from "pg";
import {managedBinaryScopeEmpty} from "./erasure-restricted-member";
import {withAuditedErasureTransaction} from "./erasure-transaction";
import {inspectMemberForeignKeys} from "./erasure-fk-discovery";
const ID=/^[a-zA-Z0-9_-]{1,120}$/;
const TABLE=/^smn_[a-z][a-z0-9_]*$/;
const LIMIT=400;
type Verdict=Readonly<{eligible:boolean;reason:string;assignments:number;versions:number}>;
const deny=(reason:string):Verdict=>({eligible:false,reason,assignments:0,versions:0});
/**
 * Qualified dependency scope ONLY: provisional member with role assignments
 * and versions, but no Agile cycles, other dependent business rows, files,
 * unowned text references or uninspectable binary content. Not a generic
 * cascade; historical KPI/report reconciliation is not proven.
 */
export async function inspectDependentMemberErasure(
 db:Client,memberId:string,options:{lock?:boolean}={}
):Promise<Verdict>{
 if(!ID.test(memberId))return deny("invalid-member");
 const subject=await db.query<{
  id:string;display_name:string;email:string|null;is_provisional:boolean;revision:number
 }>("SELECT id,display_name,email,is_provisional,revision FROM public.smn_member "+
 "WHERE id=$1 AND installation_id='singleton'"+
 (options.lock===false?"":" FOR UPDATE"),[memberId]);
 if(subject.rows.length!==1)return deny("invalid-member");
 const row=subject.rows[0];
 if(!row.is_provisional||row.revision!==0||row.email!==null)
  return deny("historical-identity");
 const assignments=await db.query<{id:string;team_id:string}>(
  "SELECT id,team_id FROM public.smn_member_assignment WHERE member_id=$1 ORDER BY id"+
  (options.lock===false?"":" FOR UPDATE"),[memberId]);
 if(!assignments.rows.length||assignments.rows.length>16)
  return deny("assignment-count-unverifiable");
 if(assignments.rows.some(a=>!ID.test(a.id)||!ID.test(a.team_id)))
  return deny("assignment-id-invalid");
 const ids=assignments.rows.map(a=>a.id);
 const teams=[...new Set(assignments.rows.map(a=>a.team_id))];
 const cycles=await db.query<{n:string}>(
  "SELECT count(*)::text AS n FROM public.smn_sprint WHERE team_id=ANY($1::text[])",
  [teams]);
 if(Number(cycles.rows[0]?.n)!==0)return deny("team-has-sprints");
 const kanban=await db.query<{n:string}>(
  "SELECT count(*)::text AS n FROM public.smn_kanban_period WHERE team_id=ANY($1::text[])",
  [teams]);
 if(Number(kanban.rows[0]?.n)!==0)return deny("team-has-kanban-cycles");
 const edges=await inspectMemberForeignKeys(db,memberId);
 const allowed=new Set(["smn_member_assignment","smn_member_assignment_version"]);
 if(edges.some(e=>e.state!=="inspected"||e.count===null||
  (e.count>0&&!allowed.has(e.table))))return deny("unapproved-dependency");
 const versions=await db.query<{n:string}>(
  "SELECT count(*)::text AS n FROM public.smn_member_assignment_version "+
  "WHERE assignment_id=ANY($1::text[])",[ids]);
 const versionCount=Number(versions.rows[0]?.n);
 if(!Number.isSafeInteger(versionCount)||versionCount<0||versionCount>100)
  return deny("version-count-unverifiable");
 const aliases=[...new Set([memberId,row.display_name,...ids])];
 const tables=await db.query<{tablename:string}>(
  "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public' "+
  "AND tablename LIKE 'smn_%' ORDER BY tablename LIMIT $1",[LIMIT+1]);
 if(tables.rows.length>LIMIT||tables.rows.some(t=>!TABLE.test(t.tablename)))
  return deny("schema-scan-unverifiable");
 for(const {tablename} of tables.rows){
  if(tablename==="smn_member")continue;
  const exclude=tablename==="smn_member_assignment"?
   "NOT (t.id=ANY($2::text[])) AND ":
   tablename==="smn_member_assignment_version"?
   "NOT (t.assignment_id=ANY($2::text[])) AND ":"";
  try{
   const found=await db.query<{found:boolean}>(
    "SELECT EXISTS(SELECT 1 FROM public.\""+tablename+"\" t WHERE "+exclude+
    "EXISTS(SELECT 1 FROM unnest($1::text[]) a(value) "+
    "WHERE position(lower(a.value) IN lower(to_jsonb(t)::text))>0)) AS found",
    exclude?[aliases,ids]:[aliases]);
   if(found.rows[0]?.found!==false)return deny("unowned-text-reference");
  }catch{return deny("text-scan-unverifiable");}
 }
 const bin=await db.query<{table_name:string}>(
  "SELECT DISTINCT table_name FROM information_schema.columns "+
  "WHERE table_schema='public' AND data_type='bytea' "+
  "AND table_name LIKE 'smn_%' ORDER BY table_name LIMIT $1",[LIMIT+1]);
 if(bin.rows.length>LIMIT||bin.rows.some(t=>!TABLE.test(t.table_name)))
  return deny("binary-scan-unverifiable");
 for(const {table_name} of bin.rows){
  const q=await db.query<{present:boolean}>(
   "SELECT EXISTS(SELECT 1 FROM public.\""+table_name+"\") AS present");
  if(q.rows[0]?.present!==false)return deny("binary-present");
 }
 return {eligible:true,reason:"eligible",assignments:ids.length,versions:versionCount};
}
export async function eraseDependentMember(db:Client,input:{
 memberId:string;scopeRevision:string
}):Promise<{receiptId:string;affectedRows:number;recorded:true}>{
 if(!ID.test(input.memberId)||!/^[a-f0-9]{64}$/.test(input.scopeRevision))
  throw Error("dependent-erasure-invalid-input");
 if(!await managedBinaryScopeEmpty())throw Error("dependent-erasure-archives-unverifiable");
 const initial=await inspectDependentMemberErasure(db,input.memberId);
 if(!initial.eligible)throw Error("dependent-erasure-blocked-"+initial.reason);
 return withAuditedErasureTransaction(db,{
  operation:"erase",scopeRevision:input.scopeRevision,
  expectedRows:1+initial.assignments+initial.versions
 },async()=>{
  if(!await managedBinaryScopeEmpty())throw Error("dependent-erasure-archives-changed");
  const current=await inspectDependentMemberErasure(db,input.memberId);
  if(!current.eligible||current.assignments!==initial.assignments||
   current.versions!==initial.versions)
   throw Error("dependent-erasure-scope-changed");
  const result=await db.query<{id:string}>(
   "SELECT id FROM public.smn_member_assignment WHERE member_id=$1 ORDER BY id FOR UPDATE",
   [input.memberId]);
  const ids=result.rows.map(a=>a.id);
  const v=await db.query("DELETE FROM public.smn_member_assignment_version "+
   "WHERE assignment_id=ANY($1::text[])",[ids]);
  const a=await db.query("DELETE FROM public.smn_member_assignment WHERE member_id=$1",
   [input.memberId]);
  const m=await db.query("DELETE FROM public.smn_member WHERE id=$1 AND installation_id='singleton'",
   [input.memberId]);
  if(m.rowCount!==1||a.rowCount!==initial.assignments||
   v.rowCount!==initial.versions)throw Error("dependent-erasure-postcondition");
  const remaining=await db.query(
   "SELECT 1 FROM public.smn_member WHERE id=$1",[input.memberId]);
  if(remaining.rows.length)throw Error("dependent-erasure-postcondition");
  return 1+(a.rowCount??0)+(v.rowCount??0);
 });
}
