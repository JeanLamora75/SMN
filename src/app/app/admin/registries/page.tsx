import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import RegistryList from "./registry-list";
import "./registry-cockpit.css";
import {registryTypes,type RegistryType} from "@/lib/registry-types";
import {safeRegistryReturnPath} from "@/lib/registry-return-context";
export const dynamic="force-dynamic";
export default async function RegistriesPage({searchParams}:{
 searchParams:Promise<{type?:string;create?:string;sourceId?:string;cycleId?:string;returnTo?:string}>;
}){
 const params=await searchParams;
 const initialType=registryTypes.includes(params.type as RegistryType)?params.type as RegistryType:"all";
 const uuidRx=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 const sourceId=typeof params.sourceId==="string"&&uuidRx.test(params.sourceId)?params.sourceId:undefined;
 const cycleId=typeof params.cycleId==="string"&&uuidRx.test(params.cycleId)?params.cycleId:undefined;
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
  {teamId?<><RegistryList canManage={actor.role==="admin"} teamId={teamId} initialType={initialType}
   initialCreate={params.create==="1"} sourceId={sourceId} initialCycleId={cycleId}
   returnTo={safeRegistryReturnPath(params.returnTo)}/></>:<p role="alert">Équipe indisponible / Team unavailable.</p>}
 </main>;
}
