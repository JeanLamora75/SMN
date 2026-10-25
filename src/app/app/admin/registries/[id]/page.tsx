import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import RegistryDetail from "../registry-detail";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";

export const dynamic="force-dynamic";
export default async function RegistryDetailPage({params}:{params:Promise<{id:string}>}){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(!canAccess(actor,"read",{type:"collective",exists:true,inScope:true}))redirect("/app");
 const {id}=await params;
 const locale=await requestLocale();
 const teamId=await withSprintIndexDb(async db=>{
  const r=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized'
    AND lower(i.mode) IN ('scrum','kanban') LIMIT 2`);
  return r.rows.length===1?r.rows[0].id:null;
 }).catch(()=>null);
 return <main className="smn-page smn-team-page container-fluid px-3 px-lg-4 py-4">
  {teamId?<RegistryDetail id={id} teamId={teamId} canManage={actor.role==="admin"}/>:
   <p role="alert">{translate(locale,"registryDetail.teamUnavailable")}</p>}
 </main>;
}
