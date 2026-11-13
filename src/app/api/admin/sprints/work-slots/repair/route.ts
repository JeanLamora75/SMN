import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {repairMissingWorkSlotsTable} from "@/server/sprints/work-slot-schema-repair";

export const dynamic="force-dynamic";
export const runtime="nodejs";

/** Never run implicitly: a deliberate administrator confirmation is required. */
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);
 if(!body||body.confirm!=="REPAIR_MISSING_WORK_SLOTS_TABLE"||
  Object.keys(body).some(key=>key!=="confirm"))
  return jsonResult({error:"confirmation-required"},400);
 try{
  const result=await withAuthDb(db=>repairMissingWorkSlotsTable(db));
  return jsonResult(result,result.ok?200:409);
 }catch(error){
  console.error("smn-work-slots-schema-repair-unavailable",
   error instanceof Error?error.message:"unknown");
  return jsonResult({error:"unavailable"},503);
 }
}
