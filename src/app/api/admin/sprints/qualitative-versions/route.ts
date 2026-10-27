import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {assertLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult} from "@/server/auth/request";
import {readQualitativeVersion} from "@/server/registries/qualitative-versions";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const sprintId=req.nextUrl.searchParams.get("sprintId"),rawVersion=req.nextUrl.searchParams.get("version");
 if(!sprintId||!/^[a-f0-9-]{36}$/i.test(sprintId)||rawVersion!==null&&(!/^[1-9]\d*$/.test(rawVersion)||!Number.isSafeInteger(Number(rawVersion))))
 return jsonResult({error:"invalid-input"},400);
 try{const data=await withSprintIndexDb(async db=>{
 await assertLegacyTeamApi(db);
 const t=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t
 JOIN public.smn_installation i ON i.id=t.installation_id WHERE i.id='singleton'
 AND i.state='initialized' AND lower(i.mode)='scrum'`);
 if(t.rows.length!==1)return null;
 return readQualitativeVersion(db,t.rows[0].id,sprintId,rawVersion===null?null:Number(rawVersion));
 });
 return jsonResult(data??{error:"not-found"},data?200:404);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
