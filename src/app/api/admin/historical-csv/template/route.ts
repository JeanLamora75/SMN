import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {historicalCsvTemplate,historicalCsvCodes} from "@/lib/historical-csv-contract";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return Response.json({error:"forbidden"},{status:403});
 try{
  const data=await withAuthDb(async db=>{
   const installation=await db.query<{mode:string}>(`SELECT lower(mode) AS mode
    FROM public.smn_installation WHERE id='singleton' AND state='initialized'`);
   const mode=installation.rows[0]?.mode;
   if(mode!=="scrum"&&mode!=="kanban")return null;
   const table=mode==="scrum"?"smn_sprint":"smn_kanban_period";
   const cycles=await db.query<{id:string;name:string}>(`SELECT c.id,c.name FROM public.${table} c
    JOIN public.smn_team t ON t.id=c.team_id JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE i.id='singleton' AND i.state='initialized' AND c.deleted_at IS NULL
    ORDER BY c.${mode==="scrum"?"start_at":"start_on"} DESC,c.id LIMIT 200`);
   return {mode,cycles:cycles.rows,catalog:historicalCsvCodes(mode)};
  });
  if(!data)return Response.json({error:"unsupported-mode"},{status:409});
  if(req.nextUrl.searchParams.get("download")==="1")return new Response(historicalCsvTemplate(),{
   headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="smn-historique-modele.csv"',"Cache-Control":"no-store"}});
  return Response.json(data,{headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"service-unavailable"},{status:503});}
}
