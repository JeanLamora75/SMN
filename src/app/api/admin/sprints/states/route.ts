import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {readSprintStates} from "@/server/sprints/transitions";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",{type:"settings",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 try{return jsonResult({sprints:await withAuthDb(readSprintStates)});}
 catch{return jsonResult({error:"reconciliation-unavailable"},503);}
}
