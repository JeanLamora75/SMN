import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {readJsonObject} from "@/server/auth/request";
import {assertTeamReportCycle} from "@/server/reports/team-cycle";
import {readReportLinks,saveReportLinks} from "@/server/reports/link-selection";
import {mapLinkError} from "@/server/links/validation";
export const runtime="nodejs";
async function run(req:NextRequest,id:string,write:boolean){
 const actor=await authorizeApi(req,write?"write":"read",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return Response.json({error:"forbidden"},{status:403});
 if(!/^[a-f0-9-]{36}$/i.test(id))return Response.json({error:"invalid-input"},{status:400});
 const body=write?await readJsonObject(req,8192):null;
 if(write&&!body)return Response.json({error:"invalid-input"},{status:400});
 try{return await withAuthDb(async db=>{
  const row=await db.query<{team_id:string}>(`SELECT team_id FROM public.smn_sprint WHERE id=$1 AND deleted_at IS NULL`,[id]);
  if(row.rowCount!==1)return Response.json({error:"not-found"},{status:404});
  const teamId=row.rows[0].team_id;
  if(!await assertTeamReportCycle(db,{accountId:actor.id,role:actor.role},teamId,id))
   return Response.json({error:"not-found"},{status:404});
  return Response.json(write?await saveReportLinks(db,actor,id,teamId,body?.ids,body?.revision):await readReportLinks(db,id));
 });}catch(e){const x=mapLinkError(e);return Response.json({error:x.error},{status:x.status});}
}
type Context={params:Promise<{id:string}>};
export async function GET(req:NextRequest,{params}:Context){return run(req,(await params).id,false);}
export async function PATCH(req:NextRequest,{params}:Context){return run(req,(await params).id,true);}
