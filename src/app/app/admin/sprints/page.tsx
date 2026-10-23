import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import SprintIndexView from "./sprint-index-view";

export const dynamic="force-dynamic";

export default async function SprintsPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))
  redirect("/app");
 const isScrum=await withSprintIndexDb(async db=>{
  const result=await db.query(`SELECT 1 FROM public.smn_installation
   WHERE id='singleton' AND state='initialized' AND lower(mode)='scrum' LIMIT 1`);
  return result.rows.length===1;
 }).catch(()=>false);
 if(!isScrum)redirect("/app");
 return <main className="smn-page smn-team-page container-fluid py-4 px-3 px-lg-4">
  <SprintIndexView canManage={account.role==="admin"}/>
 </main>;
}
