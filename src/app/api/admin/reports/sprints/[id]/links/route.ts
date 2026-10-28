import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {assertTeamReportCycle} from "@/server/reports/team-cycle";
import {listLinks,mapLinkError} from "@/server/links/catalog";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** Resolve team from the requested sprint, never from the current header selection. */
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"read",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return Response.json({error:"forbidden"},{status:403});
 const {id}=await params;
 if(!/^[a-f0-9-]{36}$/i.test(id))return Response.json({error:"invalid-input"},{status:400});
 try{
  return await withAuthDb(async db=>{
   const found=await db.query<{team_id:string}>(`SELECT s.team_id FROM public.smn_sprint s
     JOIN public.smn_team t ON t.id=s.team_id
     WHERE s.id=$1 AND s.deleted_at IS NULL AND t.installation_id='singleton'`,[id]);
   if(found.rowCount!==1)return Response.json({error:"not-found"},{status:404});
   const teamId=found.rows[0].team_id;
   if(!await assertTeamReportCycle(db,{accountId:actor.id,role:actor.role},teamId,id))
    return Response.json({error:"not-found"},{status:404});
   const items=await listLinks(db,actor,teamId);
   return Response.json({items,teamId});
  });
 }catch(error){const mapped=mapLinkError(error);return Response.json({error:mapped.error},{status:mapped.status});}
}
