import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {confirmHistoricalCsv} from "@/server/historical-csv/confirm";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return Response.json({error:"forbidden"},{status:403});
 try{
  const body=await req.json() as {csv?:unknown;choices?:unknown};
  if(typeof body?.csv!=="string"||!Array.isArray(body.choices))
   return Response.json({error:"invalid-input"},{status:400});
  const result=await withAuthDb(db=>confirmHistoricalCsv(db,actor.id,body.csv as string,body.choices as {line:number;decision:"keep"|"insert"|"replace";expectedValue:number|null}[]));
  return Response.json(result,{status:result.ok?200:409,headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"service-unavailable"},{status:503});}
}
