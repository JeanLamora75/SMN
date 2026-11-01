import {NextRequest} from "next/server";
import {sessionAccount} from "@/server/auth/session";
import {SESSION_COOKIE,validLocalHost,validMutationOrigin} from "@/server/auth/guards";
import {withAuthDb} from "@/server/auth/database";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {updateIndicatorGrant,indicatorTeams} from "@/server/indicators/team-access";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function admin(req:NextRequest,mutate:boolean){
 if(!validLocalHost(req.headers.get("host"))||(mutate&&!validMutationOrigin(req.headers.get("host"),req.headers.get("origin"))))return null;
 const a=await sessionAccount(req.cookies.get(SESSION_COOKIE)?.value);
 return a?.role==="admin"&&a.is_active&&!a.must_change_password?a:null;
}
export async function GET(req:NextRequest){
 const a=await admin(req,false);if(!a)return jsonResult({error:"forbidden"},403);
 try{return jsonResult(await withAuthDb(async db=>{
  const teams=await indicatorTeams(db,{accountId:a.id,role:"admin"});
  const users=await db.query<{id:string;username:string}>("SELECT id,username FROM public.smn_account WHERE installation_id='singleton' AND role='user' AND is_active=true AND must_change_password=false ORDER BY username");
  const grants=await db.query<{account_id:string;team_id:string}>("SELECT account_id,team_id FROM public.smn_indicator_team_grant WHERE installation_id='singleton' AND can_manage=true");
  return {teams,users:users.rows,grants:grants.rows};
 }),200);}catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function POST(req:NextRequest){
 const a=await admin(req,true);if(!a)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req,1000);
 if(!body||typeof body.accountId!=="string"||typeof body.teamId!=="string"||typeof body.enabled!=="boolean")return jsonResult({error:"invalid-input"},400);
 try{await withAuthDb(db=>updateIndicatorGrant(db,{accountId:a.id,role:"admin"},body.accountId as string,body.teamId as string,body.enabled as boolean));return jsonResult({ok:true},200);}
 catch(e){return jsonResult({error:e instanceof Error&&e.message==="team-access-forbidden"?"forbidden":"invalid-input"},403);}
}
