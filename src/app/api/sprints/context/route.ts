import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {readSprintContext} from "@/server/sprints/context";

export const dynamic="force-dynamic";
export const runtime="nodejs";

export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",{type:"collective",exists:true,inScope:true}))
  return jsonResult({error:"forbidden"},403);
 try{
  // Le périmètre d'équipe est fixé par l'installation, pas par la requête HTTP.
  const result=await withSprintIndexDb(async db=>{
   const rows=await db.query<{id:string}>(`
    SELECT t.id FROM public.smn_team t
    JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
   if(rows.rows.length!==1)throw Error("scrum-team-unavailable");
   return readSprintContext(db,rows.rows[0].id);
  });
  return jsonResult(result);
 }catch{
  console.error("sprint-context-read-failed");
  return jsonResult({error:"service-unavailable"},503);
 }
}
