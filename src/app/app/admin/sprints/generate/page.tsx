import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import SprintGenerationWizard from "../sprint-generation-wizard";
export const dynamic="force-dynamic";
export default async function GenerateSprintsPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"write",{type:"settings",exists:true,inScope:true}))redirect("/app");
 const scrum=await withSprintIndexDb(async db=>{
  const r=await db.query(`SELECT 1 FROM public.smn_installation
   WHERE id='singleton' AND state='initialized' AND lower(mode)='scrum'`);
  return r.rows.length===1;
 }).catch(()=>false);
 if(!scrum)redirect("/app");
 return <main className="smn-page container-fluid px-3 px-lg-4 py-4">
  <div className="mx-auto" style={{maxWidth:1100}}><SprintGenerationWizard/></div>
 </main>;
}
