import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {listInstallationTeams} from "@/server/teams/list";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** Aucun contenu d'équipe n'est exposé avant contrôle de la session Admin. */
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 if(request.nextUrl.searchParams.size!==0)return jsonResult({error:"invalid-input"},400);
 try{
  const items=await withAuthDb(async db=>{
   const installation=await db.query<{installation_id:string}>(
    "SELECT installation_id FROM public.smn_account WHERE id=$1 AND is_active=true",
    [actor.id]);
   if(installation.rows.length!==1)throw Error("account-installation-unavailable");
   return listInstallationTeams(db,installation.rows[0].installation_id);
  });
  return jsonResult({items});
 }catch{
  console.error("team-list-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
