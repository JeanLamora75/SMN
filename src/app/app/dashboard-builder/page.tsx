import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {withSessionReadDb} from "@/server/auth/database";
import {readAccountDashboard} from "@/server/dashboard/read";
import {readDashboardLayout} from "@/server/dashboard-builder/layout";
import {requestLocale} from "@/i18n/locale.server";
import DashboardConsultation from "./dashboard-consultation";
import {listDashboardCycles,cycleNavigation} from "@/server/dashboard-builder/cycles";

export const dynamic="force-dynamic";
/** Separate route until approved cutover of the existing /app dashboard. */
export default async function DashboardBuilderPage({searchParams}:{
 searchParams:Promise<{teamId?:string;cycleId?:string}>;
}){
 const account=await currentAccount();
 if(!account)redirect("/login");
 const query=await searchParams;
 try{
  const data=await withSessionReadDb(async db=>{
   const context=await readAccountDashboard(db,{accountId:account.id,role:account.role},
    typeof query.teamId==="string"?query.teamId:null);
   const owner=await db.query<{installation_id:string}>(
    "SELECT installation_id FROM public.smn_account WHERE id=$1 AND is_active=true",[account.id]);
   if(owner.rows.length!==1)throw Error("dashboard-access-denied");
   const teamId=context.context.teamId;
   const saved=await readDashboardLayout(db,{
    installationId:owner.rows[0].installation_id,accountId:account.id,teamId,
   });
   const mode=context.context.mode as "scrum"|"kanban";
   const cycles=await listDashboardCycles(db,{installationId:owner.rows[0].installation_id,accountId:account.id,teamId},mode);
   const navigation=cycleNavigation(cycles,typeof query.cycleId==="string"?query.cycleId:null);
   return {teamId,teamName:context.context.team,mode,layout:saved.layout,navigation};
  });
  const locale=await requestLocale();
  return <div className="py-3">
   <div className="mb-3"><Link href="/app" className="text-decoration-none">← Tableau de bord principal</Link></div>
   <div className="smn-panel p-3 mb-3">
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
     <h2 className="h5 mb-0">{data.teamName}</h2>
     <span className="badge text-bg-secondary">{data.mode==="scrum"?"Scrum":"Kanban"}</span>
    </div>
   </div>
   <DashboardConsultation layout={data.layout} teamId={data.teamId}
    navigation={data.navigation} mode={data.mode} locale={locale}/>
  </div>;
 }catch{
  return <section className="smn-panel p-4" role="alert">
   <h1 className="h4">Tableau de bord indisponible</h1>
   <p>La configuration de cette équipe n'est pas accessible actuellement.</p>
   <Link href="/app" className="btn btn-outline-primary">Retour au tableau de bord</Link>
  </section>;
 }
}
