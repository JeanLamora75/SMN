import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {listPrivateBriefArchives} from "@/server/ai-briefs/library";
export const dynamic="force-dynamic";
export default async function BriefArchiveLibrary(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))notFound();
 const rows=await withAuthDb(async db=>{
  const teams=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban')`);
  if(teams.rows.length!==1)return [];
  return listPrivateBriefArchives(db,teams.rows[0].id);
 }).catch(()=>null);
 return <main className="container-fluid px-3 px-lg-4 py-4">
  <Link href="/app">← Tableau de bord</Link>
  <section className="smn-panel rounded-4 p-4 my-3">
   <h1 className="h4">Bibliothèque privée des briefs IA</h1>
   <Link className="btn btn-outline-primary btn-sm mb-3" href="/app/ai-briefs/journal">Journal des analyses humaines et IA</Link>
   <p className="text-secondary">Fichiers TXT finalisés et conservés sans recalcul. Seules les archives autorisées sont visibles.</p>
   {rows===null?<p className="alert alert-warning">Bibliothèque indisponible.</p>:
    rows.length===0?<p>Aucun brief archivé.</p>:
    <div className="table-responsive"><table className="table table-sm align-middle">
     <thead><tr><th>Date</th><th>Cycle</th><th>Mode</th><th>Modèle</th><th>Archive</th><th>Accès</th></tr></thead>
     <tbody>{rows.map(item=><tr key={item.id}>
      <td>{item.created_at}</td><td><code>{item.cycle_id}</code></td>
      <td>{item.mode}</td><td>{item.template_id} · révision {item.template_revision}</td>
      <td><code>{item.id}</code></td>
      <td className="d-flex flex-wrap gap-2">
       <Link href={"/app/ai-briefs/archives/"+item.id}>Consulter</Link>
       <a href={"/api/ai-briefs/archives/"+item.id+"/download"} download>Télécharger TXT</a>
      </td>
     </tr>)}</tbody>
    </table></div>}
  </section>
 </main>;
}
