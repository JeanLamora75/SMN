import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {validateHistoricalCsv} from "@/lib/historical-csv-validator";
import {validateHistoricalCsvBusiness} from "@/server/historical-csv/business-validation";
import {previewHistoricalCsv} from "@/server/historical-csv/preview";
import {recordCsvAttempt} from "@/server/historical-csv/attempts";
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
  const businessErrors=result.valid?await withAuthDb(db=>validateHistoricalCsvBusiness(db,result.rows,mode)):[];
  const errors=[...result.errors,...businessErrors],valid=errors.length===0;
  const preview=valid?await withAuthDb(db=>previewHistoricalCsv(db,result.rows,mode)):[];
  const attemptId=await withAuthDb(db=>recordCsvAttempt(db,{actorId:actor.id,status:valid?"preview-valid":"preview-refused",mode,scope:"historical-csv",readCount:result.rows.length+errors.filter(e=>e.column==="structure").length,recognizedCount:result.rows.length,appliedCount:0,preservedCount:0,rejectedCount:valid?0:Math.max(1,errors.length),cycleIds:result.rows.map(r=>r.cycle_id),errors}));
  return Response.json({valid,attemptId,rowCount:valid?result.rows.length:0,errors,preview,confirmable:false,
   message:valid?"Prévisualisation uniquement : les valeurs existantes sont conservées. Aucune écriture en base.":"Fichier refusé. Aucune écriture en base."},
   {status:valid?200:422,headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"invalid-request"},{status:400});}
}
