import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {listHistoricalEvents} from "@/server/sprints/historical-events";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 try{const events=await withAuthDb(db=>listHistoricalEvents(db,(await params).id));
 return events===null?jsonResult({error:"not-found"},404):jsonResult({events});
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
