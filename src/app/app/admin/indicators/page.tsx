import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {indicatorTeams} from "@/server/indicators/team-access";
import {withSessionReadDb} from "@/server/auth/database";
import {readAccountDashboard} from "@/server/dashboard/read";
import IndicatorCatalog from "./catalog-client";
import {requestLocale} from "@/i18n/locale.server";
export const dynamic="force-dynamic";
export default async function IndicatorPage({searchParams}:{searchParams:Promise<{teamId?:string}>}){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 const locale=await requestLocale();
 const teams=await withSessionReadDb(db=>indicatorTeams(db,{accountId:actor.id,role:actor.role}));
 if(teams.length===0)redirect("/app");
 const dashboard=actor.role==="admin"?await withSessionReadDb(db=>readAccountDashboard(db,{accountId:actor.id,role:actor.role})).catch(()=>null):null;
 const active=dashboard?.context;
 const requested=(await searchParams).teamId;
 const team=requested&&teams.some(t=>t.id===requested)?requested:teams.some(t=>t.id===active?.teamId)?active?.teamId:teams[0].id;
 const mode=await withSessionReadDb(async db=>{const r=await db.query<{agile_mode:"scrum"|"kanban"}>("SELECT agile_mode FROM public.smn_team WHERE id=$1 AND installation_id=\'singleton\' AND NOT is_archived",[team]);return r.rows[0]?.agile_mode;});
 if(mode!=="scrum"&&mode!=="kanban")redirect("/app");
 return <main className="smn-page smn-team-page container-fluid px-3 px-lg-4 py-4">
  <header className="smn-panel rounded-4 px-4 py-3 mb-3">
   <h1 className="h4 mb-1">Indicateur</h1><p className="small text-secondary mb-0">{teams.find(t=>t.id===team)?.name}</p>
  </header>
  <IndicatorCatalog key={team} teams={teams} activeTeamId={team} cycleType={mode} locale={locale} isAdmin={actor.role==="admin"} scope="team"/>
 </main>;
}
