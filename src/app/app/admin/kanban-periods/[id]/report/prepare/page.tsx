import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {composeKanbanReport} from "@/server/kanban/report-preparation";
import KanbanReportPreview from "./report-preview";
import ReportAnalysisChoices from "@/app/app/admin/sprints/[sprintId]/report/report-analysis-choices";
export const dynamic="force-dynamic";
export default async function KanbanReportPreparation({params}:{params:Promise<{id:string}>}){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))notFound();
 const {id}=await params;
 const data=await withAuthDb(db=>composeKanbanReport(db,id)).catch(()=>null);
 if(!data)notFound();
 return <main className="container-fluid px-3 px-lg-4 py-4">
  <Link href={"/app/admin/kanban-periods/"+encodeURIComponent(id)+"/report"}>← Retour au bilan Kanban</Link>
  <div className="my-3">{account.role==="admin"&&<Link className="btn btn-outline-primary" href={"/app/admin/ai-briefs/prepare?"+new URLSearchParams({mode:"kanban",id:data.period.id}).toString()}>Générer un brief IA</Link>}</div>
  <header className="smn-panel rounded-4 p-4 my-3">
   <h1 className="h4 mb-2">Préparer un rapport Kanban</h1>
   <p className="mb-1"><strong>{data.period.name}</strong> · {data.period.team}</p>
   <p className="mb-1">{data.period.startOn} — {data.period.endOn} · {data.period.status}</p>
   <p className="small text-secondary mb-0">{data.provisional?"Rapport provisoire — données enregistrées actuelles": "Rapport issu du cliché de clôture V"+data.snapshotVersion}</p>
  </header>
  {account.role==="admin"&&<ReportAnalysisChoices sprintId={id} mode="kanban"/>}
  <KanbanReportPreview data={data}/>
 </main>;
}
