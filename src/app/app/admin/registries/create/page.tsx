import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import RegistryCreate from "../registry-create";
export const dynamic="force-dynamic";
export default async function NewRegistryPage({searchParams}:{searchParams:Promise<{type?:string|string[]}>}){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(!canAccess(actor,"write",{type:"settings",exists:true,inScope:true}))redirect("/app/admin/registries");
 const teamId=await withSprintIndexDb(async db=>{
  const r=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized' LIMIT 2`);
  return r.rows.length===1?r.rows[0].id:null;
 }).catch(()=>null);
 const query=await searchParams;
 const initialType=query.type==="obstacle"?"obstacle":"risk";
 return <main className="smn-page smn-team-page container-fluid px-3 px-lg-4 py-4">
  <RegistryCreate teamId={teamId} initialType={initialType} canManage/>
 </main>;
}
