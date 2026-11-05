import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {withSessionReadDb} from "@/server/auth/database";
import {indicatorTeams} from "@/server/indicators/team-access";
import {readAccountDashboard} from "@/server/dashboard/read";
import IndicatorCatalog from "../../indicators/catalog-client";
import TeamGrants from "../../indicators/team-grants";
import IndicatorSettingsTabs from "./settings-tabs";

export const dynamic="force-dynamic";

export default async function IndicatorSettingsPage({searchParams}:{searchParams:Promise<{teamId?:string}>}){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(account.role!=="admin")redirect("/app");

 const allowed=await withSessionReadDb(db=>indicatorTeams(db,{accountId:account.id,role:account.role}));
 const dashboard=await withSessionReadDb(db=>readAccountDashboard(db,{accountId:account.id,role:account.role})).catch(()=>null);
 const requested=(await searchParams).teamId;
 const selected=requested&&allowed.some(t=>t.id===requested)?requested:
  allowed.some(t=>t.id===dashboard?.context?.teamId)?dashboard?.context?.teamId:
  allowed.length===1?allowed[0].id:null;
 const teams=allowed.length?await withSessionReadDb(async db=>{
  const found=await db.query<{id:string;name:string;agile_mode:string}>(
   "SELECT id,name,agile_mode FROM public.smn_team WHERE installation_id='singleton' AND NOT is_archived AND id=ANY($1::text[])",
   [allowed.map(t=>t.id)]);
  return found.rows.filter(t=>t.agile_mode==="scrum"||t.agile_mode==="kanban")
   .map(t=>({id:t.id,name:t.name,mode:t.agile_mode as "scrum"|"kanban"}));
 }):[];
 return <main className="smn-page smn-team-page container-fluid px-3 px-lg-4 py-4">
  <header className="smn-panel rounded-4 px-4 py-3 mb-3">
   <h1 className="h4 mb-1">Paramètres · Indicateurs</h1>
   <p className="small text-secondary mb-0">Catalogue global des définitions d’indicateurs — administration</p>
  </header>
  <IndicatorSettingsTabs teams={teams} teamId={teams.some(t=>t.id===selected)?selected:null}
   catalogue={<IndicatorCatalog teams={[]} isAdmin scope="global"/>}
   permissions={<details className="smn-panel rounded-4 p-3 mt-4"><summary className="fw-semibold">Habilitations des Scrum Masters par équipe</summary><TeamGrants/></details>}/>
 </main>;
}
