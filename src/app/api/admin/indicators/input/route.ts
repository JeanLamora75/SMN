import {NextRequest} from "next/server";
import {sessionAccount} from "@/server/auth/session";
import {SESSION_COOKIE,validLocalHost,validMutationOrigin} from "@/server/auth/guards";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {requireIndicatorTeam} from "@/server/indicators/team-access";
import {previewIndicatorInput} from "@/server/indicators/input-preview";
import {writeManualValues,readManualCycleValues,type ManualWrite} from "@/server/indicators/manual-values";
export const runtime="nodejs";export const dynamic="force-dynamic";
async function actor(req:NextRequest,mutation:boolean){
 if(!validLocalHost(req.headers.get("host"))||(mutation&&!validMutationOrigin(req.headers.get("host"),req.headers.get("origin"))))return null;
 const a=await sessionAccount(req.cookies.get(SESSION_COOKIE)?.value);
 return a?.is_active&&!a.must_change_password?a:null;
}
export async function GET(req:NextRequest){
 const a=await actor(req,false);if(!a)return jsonResult({error:"forbidden"},403);
 const p=req.nextUrl.searchParams,teamId=p.get("teamId")??"",cycleId=p.get("cycleId")??"",cycleType=p.get("cycleType");
 if(!teamId||!cycleId||(cycleType!=="scrum"&&cycleType!=="kanban"))return jsonResult({error:"invalid-input"},400);
 try{return jsonResult(await withAuthDb(async db=>{
  await requireIndicatorTeam(db,{accountId:a.id,role:a.role},teamId);
  const table=cycleType==="scrum"?"smn_sprint":"smn_kanban_period";
  const check=await db.query("SELECT id FROM public."+table+" WHERE id=$1 AND team_id=$2 AND deleted_at IS NULL",[cycleId,teamId]);
  if(check.rows.length!==1)throw Error("not-found");
  const values=await readManualCycleValues(db,teamId,cycleType,cycleId);
  const definitions=await db.query<{id:string;tag:string;name:string;indicator_type:string;formula:string|null}>("SELECT d.id,d.tag,d.name,d.indicator_type,d.formula FROM public.smn_indicator_definition d JOIN public.smn_indicator_team_selection s ON s.indicator_id=d.id AND s.team_id=$1 AND s.is_active=true WHERE d.archived_at IS NULL ORDER BY d.tag",[teamId]);
  return {...values,definitions:definitions.rows};
 }),200);}catch(e){return jsonResult({error:e instanceof Error&&e.message==="not-found"?"not-found":"forbidden"},e instanceof Error&&e.message==="not-found"?404:403);}
}
export async function POST(req:NextRequest){
 const a=await actor(req,true);if(!a)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req,16000);
 if(!body||!["preview","save"].includes(String(body.action)))return jsonResult({error:"invalid-input"},400);
 const input=body as unknown as ManualWrite&{action:string};
 try{
  if(input.action==="preview")return jsonResult(await withAuthDb(db=>previewIndicatorInput(db,{accountId:a.id,role:a.role},input)),200);
  if(typeof input.expectedSystemRevision!=="number"||!Number.isSafeInteger(input.expectedSystemRevision)||input.expectedSystemRevision<0)return jsonResult({error:"invalid-input"},400);
  const result=await withAuthDb(db=>writeManualValues(db,a.id,input,async(actorId,teamId,client)=>{
   await requireIndicatorTeam(client,{accountId:actorId,role:a.role},teamId);
   return true;
  }));
  return jsonResult(result,result.ok?200:result.error==="conflict"?409:result.error==="forbidden"?403:400);
 }catch(e){const code=e instanceof Error?e.message:"unavailable";return jsonResult({error:code},code==="conflict"?409:code==="invalid-input"?400:code==="not-found"?404:code==="indicator-unavailable"?422:code==="team-access-forbidden"?403:503);}
}
