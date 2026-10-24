import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {validateHistoricalCsv} from "@/lib/historical-csv-validator";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return Response.json({error:"forbidden"},{status:403});
 try{
  const body=await req.json() as {csv?:unknown};
  if(typeof body?.csv!=="string")return Response.json({error:"invalid-input"},{status:400});
  const mode=await withAuthDb(async db=>{
   const r=await db.query<{mode:string}>(`SELECT lower(mode) AS mode FROM public.smn_installation
   WHERE id='singleton' AND state='initialized'`);
   return r.rows[0]?.mode;
  });
  if(mode!=="scrum"&&mode!=="kanban")return Response.json({error:"unsupported-mode"},{status:409});
  const result=validateHistoricalCsv(body.csv,mode);
  return Response.json({valid:result.valid,rowCount:result.rows.length,errors:result.errors,
   message:result.valid?"Syntaxe valide. Aucune écriture en base.":"Fichier refusé. Aucune écriture en base."},
   {status:result.valid?200:422,headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"invalid-request"},{status:400});}
}
