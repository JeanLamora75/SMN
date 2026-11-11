import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {reconcileScopedSprintStates} from "@/server/sprints/scoped-state-reconciliation";

export const dynamic="force-dynamic";

/** State reconciliation is a deliberate admin-only mutation, never part of GET. */
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input||Object.keys(input).some(key=>key!=="teamId")||
  (input.teamId!==undefined&&(typeof input.teamId!=="string"||
   !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(input.teamId))))
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>reconcileScopedSprintStates(db,
   {accountId:actor.id,role:"admin"},typeof input.teamId==="string"?input.teamId:null));
  return jsonResult(result);
 }catch(error){
  console.error("sprint-state-reconciliation-failed",
   error instanceof Error?error.message:String(error));
  return jsonResult({error:"reconciliation-unavailable"},503);
 }
}
