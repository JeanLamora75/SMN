import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {readKanbanPeriodReport} from "@/server/kanban/report";
import KanbanGoalsPanel from "./goals-panel";
export const dynamic="force-dynamic";
const labels:Record<string,string>={planned:"À venir",active:"En cours",finished:"Terminée",closed:"Clôturée"};
export default async function KanbanPeriodReport({params}:{params:Promise<{id:string}>}){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))redirect("/app");
 const {id}=await params;
 const report=await withAuthDb(db=>readKanbanPeriodReport(db,id)).catch(()=>null);
 if(!report)notFound();
 const {period,blocks,provisional}=report;
 return <main className="smn-page container-fluid px-3 px-lg-4 py-4">
  <Link href="/app/admin/kanban-periods">← Périodes Kanban</Link>
  <header className="smn-panel rounded-4 p-3 p-md-4 my-3">
   <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
    <div><h1 className="h4 mb-1">{period.name}</h1>
     <p className="text-secondary mb-1">{period.team} · {period.startOn} — {period.endOn}</p>
     <p className="small mb-0">{period.timeZone}</p></div>
    <span className="badge text-bg-secondary">{labels[period.status]??period.status}</span>
   </div>
   {provisional&&<p className="alert alert-info mt-3 mb-0">Bilan provisoire : les données peuvent encore évoluer. Les modifications sont soumises aux droits de votre compte.</p>}
  </header>
  <div className="row g-3">
   <section className="col-12" aria-labelledby="kanban-objectives"><div className="smn-panel rounded-4 p-4"><h2 className="h5" id="kanban-objectives">1. Objectifs</h2>
    <KanbanGoalsPanel periodId={period.id} canManage={account.role==="admin"} closed={period.status==="closed"}/></div></section>
   <section className="col-12" aria-labelledby="kanban-metrics"><div className="smn-panel rounded-4 p-4"><h2 className="h5" id="kanban-metrics">2. Métriques de la période</h2>
    <p className="text-secondary mb-0">Aucune métrique de flux collectée pour cette période.</p></div></section>
   <section className="col-12" aria-labelledby="kanban-capacity"><div className="smn-panel rounded-4 p-4"><h2 className="h5" id="kanban-capacity">3. Capacité de la période</h2>
    <p className="mb-1">Capacité initiale (J/H) : {blocks.capacity.initialJh===null?"Non disponible":blocks.capacity.initialJh}</p>
    <p className="small text-secondary mb-0">Provenance : {blocks.capacity.provenance}. Capacité réalisée : non collectée.</p></div></section>
   <section className="col-12" aria-labelledby="kanban-trends"><div className="smn-panel rounded-4 p-4"><h2 className="h5" id="kanban-trends">4. Tendances</h2>
    <p className="text-secondary mb-0">Données de tendance non encore collectées.</p></div></section>
  </div>
 </main>;
}
