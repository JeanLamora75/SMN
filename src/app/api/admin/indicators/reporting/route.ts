import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {readIndicatorReporting} from "@/server/indicators/reporting";
import type {ScreenKey} from "@/server/indicators/catalog";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const p=req.nextUrl.searchParams,teamId=p.get("teamId")??"",type=p.get("cycleType"),screen=p.get("screen");
 if(!["scrum","kanban"].includes(type??"")||!["cycle_list","trends","dashboard","cycle_detail","reports"].includes(screen??"")||!teamId)return jsonResult({error:"invalid-input"},400);
 try{return jsonResult(await withAuthDb(async db=>{
  const r=await db.query("SELECT 1 FROM public.smn_account a JOIN public.smn_team t ON t.installation_id=a.installation_id WHERE a.id=$1 AND a.is_active=true AND a.must_change_password=false AND t.id=$2 AND NOT t.is_archived AND (a.role='admin' OR EXISTS(SELECT 1 FROM public.smn_indicator_team_grant g WHERE g.account_id=a.id AND g.team_id=t.id AND g.can_manage=true))",[actor.id,teamId]);
  if(r.rows.length!==1)throw Error("forbidden");
  return readIndicatorReporting(db,teamId,screen as ScreenKey,type as "scrum"|"kanban");
 }),200);}catch(e){const forbidden=e instanceof Error&&["forbidden","team-not-found"].includes(e.message);return jsonResult({error:forbidden?"forbidden":"unavailable"},forbidden?403:503);}
}
