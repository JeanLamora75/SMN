import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import DevelopmentCapacityView from "./development-capacity-view";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {readSprintContext} from "@/server/sprints/context";
import {sprintPresenceDates} from "@/lib/sprint-presence";

export const dynamic="force-dynamic";
export default async function CapacityPage({searchParams}:{
 searchParams:Promise<{cycleId?:string|string[]}>;
}){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"read",{type:"members",exists:true,inScope:true}))
  redirect("/app");
 const locale=await requestLocale();
 const requested=await searchParams;
 // Only a persisted, selected Scrum Sprint provides an operational range.
 // Kanban or installations without a selected Sprint keep manual date selection.
 const initialPeriod=await withSprintIndexDb(async db=>{
  const team=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'`);
  if(team.rows.length!==1)return null;
  const context=await readSprintContext(db,team.rows[0].id);
  const requestedId=typeof requested.cycleId==="string"?requested.cycleId:null;
  const cycle=context.items.find(x=>x.id===requestedId)??
   context.items.find(x=>x.id===context.defaultCycleId);
  return cycle&&cycle.status!=="closed"?sprintPresenceDates(cycle):null;
 }).catch(()=>null);
 return <div className="smn-page container py-4">
  <div className="mb-3"><Link className="btn btn-outline-secondary" href="/app/team-calendar">
   {translate(locale,"developmentCapacity.back")}</Link></div>
  <DevelopmentCapacityView initialPeriod={initialPeriod}/>
 </div>;
}
