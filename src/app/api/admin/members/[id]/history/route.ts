import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyMemberApi} from "@/server/members/team-scope";
import {jsonResult} from "@/server/auth/request";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const target={type:"members",exists:true,inScope:true} as const;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(request,"read",target))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 if(!UUID.test(id))return jsonResult({error:"invalid-input"},400);
 try{
  return jsonResult(await withLegacyMemberApi(async db=>{
   const exists=await db.query("SELECT 1 FROM public.smn_member WHERE id=$1 AND installation_id='singleton'",[id]);
   if(exists.rows.length!==1)return {events:[],found:false};
   const records=await db.query<{changed_at:string;previous_values:unknown;next_values:unknown}>(
    `SELECT changed_at::text AS changed_at,previous_values,next_values
    FROM public.smn_member_identity_history WHERE member_id=$1
    ORDER BY changed_at DESC,id DESC LIMIT 200`,[id]);
   const absences=await db.query<{changed_at:string;operation:string}>(
    `SELECT h.changed_at::text AS changed_at,
     CASE WHEN h.after_values->>'deleted'='true' THEN 'delete'
      ELSE h.operation END AS operation
     FROM public.smn_member_absence_history h
     JOIN public.smn_member_absence a ON a.id=h.absence_id
     WHERE a.member_id=$1 ORDER BY h.changed_at DESC LIMIT 200`,[id]);
   const lifecycle=await db.query<{occurred_at:string;action:string}>(
    `SELECT occurred_at::text AS occurred_at,action
     FROM public.smn_member_lifecycle_event WHERE member_id=$1
     ORDER BY occurred_at DESC LIMIT 200`,[id]);
   const assignmentVersions=await db.query<{created_at:string;revision:number}>(
    `SELECT v.created_at::text AS created_at,v.revision
     FROM public.smn_member_assignment_version v
     JOIN public.smn_member_assignment a ON a.id=v.assignment_id
     WHERE a.member_id=$1 ORDER BY v.created_at DESC LIMIT 200`,[id]);
   return {found:true,
    events:records.rows.map(r=>({changedAt:r.changed_at,kind:"identity",
     previous:r.previous_values,next:r.next_values})),
    absenceChanges:absences.rows.map(r=>({changedAt:r.changed_at,operation:r.operation})),
    lifecycleChanges:lifecycle.rows.map(r=>({changedAt:r.occurred_at,action:r.action})),
    assignmentChanges:assignmentVersions.rows.map(r=>({changedAt:r.created_at,revision:r.revision}))};
  }));
 }catch{
  console.error("member-identity-history-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
