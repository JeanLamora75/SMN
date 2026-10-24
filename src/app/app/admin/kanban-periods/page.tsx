import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import KanbanPeriodForm from "./period-form";
import PeriodNameList from "./period-name-list";
export const dynamic="force-dynamic";
export default async function KanbanPeriodsPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))redirect("/app");
 return <main className="smn-page container py-4" style={{maxWidth:900}}>
  <Link href="/app/admin/kanban-cadence" className="btn btn-link px-0 mb-2">← Paramètres Kanban</Link>
  <KanbanPeriodForm canManage={account.role==="admin"}/>
  <PeriodNameList canManage={account.role==="admin"}/>
  <Link href="/app/admin/kanban-periods/preview" className="btn btn-outline-primary mt-3">Prévisualiser un lot de périodes →</Link>
 </main>;
}
