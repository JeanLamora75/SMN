import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {listHistoricalMetricRevisions} from "@/server/historical-csv/revisions";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return Response.json({error:"forbidden"},{status:403});
 const cycleId=req.nextUrl.searchParams.get("cycleId");
 if(cycleId&&!/^[a-f0-9-]{36}$/i.test(cycleId))return Response.json({error:"invalid-cycle"},{status:400});
 try{return Response.json({revisions:await withAuthDb(db=>listHistoricalMetricRevisions(db,cycleId??undefined))},{headers:{"Cache-Control":"no-store"}});}
 catch{return Response.json({error:"service-unavailable"},{status:503});}
}
