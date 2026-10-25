import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import RegistryList from "./registry-list";
import {registryTypes,type RegistryType} from "@/lib/registry-types";
import AttentionCockpit from "./attention-cockpit";
export const dynamic="force-dynamic";
export default async function RegistriesPage({searchParams}:{
 searchParams:Promise<{type?:string}>;
}){
 const params=await searchParams;
 const initialType=registryTypes.includes(params.type as RegistryType)?params.type as RegistryType:"all";
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(!canAccess(actor,"read",{type:"collective",exists:true,inScope:true}))redirect("/app");
 const teamId=await withSprintIndexDb(async db=>{
  const r=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban') LIMIT 2`);
  return r.rows.length===1?r.rows[0].id:null;
 }).catch(()=>null);
 return <main className="smn-page smn-team-page container-fluid px-3 px-lg-4 py-4">
  {teamId?<><AttentionCockpit/><RegistryList canManage={actor.role==="admin"} initialType={initialType}/></>:<p role="alert">Équipe indisponible / Team unavailable.</p>}
 </main>;
}
