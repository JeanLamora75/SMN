import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {composeKanbanReport} from "@/server/kanban/report-preparation";
import {readReportIndicatorProjection} from "@/server/reports/dynamic-indicators";
import KanbanReportPreview from "./report-preview";
import ReportAnalysisChoices from "@/app/app/admin/sprints/[sprintId]/report/report-analysis-choices";
import FactSelection from "@/app/app/admin/registries/fact-selection";
import ConfirmedHighlights from "@/app/app/admin/registries/confirmed-highlights";
export const dynamic="force-dynamic";
export default async function KanbanReportPreparation({params}:{params:Promise<{id:string}>}){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))notFound();
 const {id}=await params;
 const data=await withAuthDb(db=>composeKanbanReport(db,id)).catch(()=>null);
 if(!data)notFound();
 const indicators=await withAuthDb(async db=>{
  const t=await db.query<{team_id:string}>("SELECT team_id FROM public.smn_kanban_period WHERE id=$1 AND deleted_at IS NULL",[id]);
  if(!t.rows.length)return {values:[],preferred:[] as string[]};
  const rows=await db.query<{id:string;is_visible:boolean;display_order:number}>(`SELECT d.id,COALESCE(p.is_visible,false) AS is_visible,COALESCE(p.display_order,0) AS display_order FROM public.smn_indicator_definition d JOIN public.smn_indicator_team_selection s ON s.indicator_id=d.id AND s.team_id=$1 AND s.is_active=true LEFT JOIN public.smn_indicator_display_preference p ON p.indicator_id=d.id AND p.team_id=s.team_id AND p.screen_key='reports' WHERE d.archived_at IS NULL ORDER BY p.display_order,d.tag LIMIT 51`,[t.rows[0].team_id]);
  if(rows.rows.length>50)throw Error("report-indicator-budget");
  const values=await readReportIndicatorProjection(db,t.rows[0].team_id,"kanban",id,rows.rows.map(x=>x.id));
  return {values,preferred:rows.rows.filter(x=>x.is_visible).map(x=>x.id)};
 }).catch(()=>({values:[],preferred:[] as string[]}));
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
  {account.role==="admin"&&<><FactSelection canManage={true}/><ConfirmedHighlights canManage={true}/></>}
  <KanbanReportPreview data={data} availableIndicators={indicators.values} preferredIndicatorIds={indicators.preferred}/>
 </main>;
}
