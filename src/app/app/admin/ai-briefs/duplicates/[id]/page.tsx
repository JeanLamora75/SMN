import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {readBriefDraft} from "@/server/ai-briefs/duplicates";
import DraftEditor from "../draft-editor";
export const dynamic="force-dynamic";
export default async function DuplicatedBriefPage({params}:{params:Promise<{id:string}>}){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"write",{type:"settings",exists:true,inScope:true}))notFound();
 const {id}=await params;
 const draft=await withAuthDb(async db=>{
  const teams=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban')`);
  if(teams.rows.length!==1)return null;
  return readBriefDraft(db,id,teams.rows[0].id);
 }).catch(()=>null);
 if(!draft)notFound();
 return <main className="container-fluid px-3 px-lg-4 py-4">
  <Link href="/app/ai-briefs/archives">← Bibliothèque privée</Link>
  <DraftEditor initial={draft}/>
 </main>;
}
