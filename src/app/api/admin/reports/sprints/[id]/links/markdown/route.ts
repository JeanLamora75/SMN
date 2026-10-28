import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {assertTeamReportCycle} from "@/server/reports/team-cycle";
import {selectedReportExportLinks} from "@/server/reports/link-export";
import {reportLinksMarkdown} from "@/lib/report-links-export";
export const runtime="nodejs";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"read",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return Response.json({error:"forbidden"},{status:403});
 const {id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))return Response.json({error:"invalid-input"},{status:400});
 try{
  const output=await withAuthDb(async db=>{
   const sprint=await db.query<{team_id:string}>(`SELECT s.team_id FROM public.smn_sprint s
     JOIN public.smn_team t ON t.id=s.team_id
     WHERE s.id=$1 AND s.deleted_at IS NULL AND t.installation_id='singleton'`,[id]);
   if(sprint.rowCount!==1)return null;
   const teamId=sprint.rows[0].team_id;
   if(!await assertTeamReportCycle(db,{accountId:actor.id,role:actor.role},teamId,id))return null;
   return reportLinksMarkdown(await selectedReportExportLinks(db,actor,id,teamId));
  });
  if(output===null)return Response.json({error:"not-found"},{status:404});
  return new Response(output,{headers:{"Content-Type":"text/markdown; charset=utf-8","Content-Disposition":'attachment; filename="SMN-references.md"',"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch{return Response.json({error:"unavailable"},{status:503});}
}
