import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import {canAccess} from "@/server/access-policy";
import KanbanPeriodForm from "./period-form";
import PeriodNameList from "./period-name-list";
import UniversalIndicatorInput from "../indicators/universal-input";
import IndicatorReporting from "../indicators/reporting-view";
import {indicatorTeams} from "@/server/indicators/team-access";
import {withAuthDb} from "@/server/auth/database";
export const dynamic="force-dynamic";
export default async function KanbanPeriodsPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 const enabled=await withAuthDb(async db=>{
  const teams=await indicatorTeams(db,{accountId:account.id,role:account.role});
  if(!teams.length)return [];
  const result=await db.query<{id:string;name:string;team_id:string}>("SELECT p.id,p.name,p.team_id FROM public.smn_kanban_period p JOIN public.smn_team t ON t.id=p.team_id WHERE p.deleted_at IS NULL AND t.agile_mode='kanban' AND NOT t.is_archived AND p.team_id=ANY($1::text[]) ORDER BY p.start_on DESC,p.id LIMIT 100",[teams.map(t=>t.id)]);
  return result.rows;
 }).catch(()=>[]);
 return <main className="smn-page container py-4" style={{maxWidth:900}}>
  <Link href="/app/admin/kanban-cadence" className="btn btn-link px-0 mb-2">← Paramètres Kanban</Link>
  <KanbanPeriodForm canManage={account.role==="admin"}/>
  <PeriodNameList canManage={account.role==="admin"}/>
  {enabled.length>0&&<IndicatorReporting teamId={enabled[0].team_id} cycleType="kanban" screen="cycle_list" locale={locale}/>}
  {enabled.length>0&&<IndicatorReporting teamId={enabled[0].team_id} cycleType="kanban" screen="trends" locale={locale}/>}
  {enabled.length>0&&<section className="smn-panel rounded-4 p-3 mt-3"><h2 className="h5">{translate(locale,"indicators.input.kanbanTitle")}</h2>{enabled.map(p=><div key={p.id} className="d-flex align-items-center justify-content-between gap-3 border-bottom py-2"><span>{p.name}</span><UniversalIndicatorInput teamId={p.team_id} cycleType="kanban" cycleId={p.id}/></div>)}</section>}
  <Link href="/app/admin/kanban-periods/preview" className="btn btn-outline-primary mt-3">Prévisualiser un lot de périodes →</Link>
 </main>;
}
