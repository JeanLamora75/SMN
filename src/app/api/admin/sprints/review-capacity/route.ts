import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {readSprintCapacityReview} from "@/server/sprints/review-capacity";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",{type:"settings",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const id=req.nextUrl.searchParams.get("sprintId");
 if(!id||!/^[a-f0-9-]{36}$/i.test(id))return jsonResult({error:"invalid-input"},400);
 try{const result=await withLegacyTeamApi(db=>readSprintCapacityReview(db,id));return jsonResult(result??{error:"not-found"},result?200:404);}
 catch{return jsonResult({error:"unavailable"},503);}
}
