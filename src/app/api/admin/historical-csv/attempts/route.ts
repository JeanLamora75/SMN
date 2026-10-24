import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {recordCsvAttempt,listCsvAttempts} from "@/server/historical-csv/attempts";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return Response.json({error:"forbidden"},{status:403});
 try{return Response.json({attempts:await withAuthDb(listCsvAttempts)},{headers:{"Cache-Control":"no-store"}});}
 catch{return Response.json({error:"service-unavailable"},{status:503});}
}
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return Response.json({error:"forbidden"},{status:403});
 try{
  const body=await req.json() as {attemptId?:unknown};
  if(typeof body.attemptId!=="string"||!/^[a-f0-9-]{36}$/i.test(body.attemptId))return Response.json({error:"invalid-input"},{status:400});
  const result=await withAuthDb(async db=>{
   const source=await db.query<{mode:string;scope:string;read_count:number;recognized_count:number;cycle_ids:string[]}>(`SELECT mode,scope,read_count,recognized_count,cycle_ids
    FROM public.smn_historical_csv_attempt WHERE id=$1 AND actor_id=$2 AND status='preview-valid'`,[body.attemptId,actor.id]);
   const prior=source.rows[0];if(!prior)return null;
   return recordCsvAttempt(db,{actorId:actor.id,status:"preview-cancelled",mode:prior.mode,scope:prior.scope,
    readCount:prior.read_count,recognizedCount:prior.recognized_count,appliedCount:0,preservedCount:0,rejectedCount:0,cycleIds:prior.cycle_ids});
  });
  return result?Response.json({ok:true,attemptId:result}):Response.json({error:"not-found"},{status:404});
 }catch{return Response.json({error:"service-unavailable"},{status:503});}
}
