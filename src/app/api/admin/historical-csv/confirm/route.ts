import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {confirmHistoricalCsv} from "@/server/historical-csv/confirm";
import {recordCsvAttempt} from "@/server/historical-csv/attempts";
import {validateHistoricalCsv} from "@/lib/historical-csv-validator";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return Response.json({error:"forbidden"},{status:403});
 try{
  const body=await req.json() as {csv?:unknown;choices?:unknown};
  if(typeof body?.csv!=="string"||!Array.isArray(body.choices))
   return Response.json({error:"invalid-input"},{status:400});
  const result=await withAuthDb(db=>confirmHistoricalCsv(db,actor.id,body.csv as string,body.choices as {line:number;decision:"keep"|"insert"|"replace";expectedValue:number|null}[]));
  if(!result.ok){
   await withAuthDb(async db=>{
    const modeRow=await db.query<{mode:string}>("SELECT lower(mode) AS mode FROM public.smn_installation WHERE id='singleton'");
    const mode=modeRow.rows[0]?.mode??"unknown";
    const parsed=mode==="scrum"||mode==="kanban"?validateHistoricalCsv(body.csv as string,mode):null;
    await recordCsvAttempt(db,{actorId:actor.id,status:"import-refused",mode,scope:"historical-csv",readCount:parsed?.rows.length??0,recognizedCount:parsed?.rows.length??0,appliedCount:0,preservedCount:0,rejectedCount:1,cycleIds:parsed?.rows.map(r=>r.cycle_id)??[],errors:[{line:0,column:"lot",message:result.error}]});
   });
  }
  return Response.json(result,{status:result.ok?200:409,headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"service-unavailable"},{status:503});}
}
