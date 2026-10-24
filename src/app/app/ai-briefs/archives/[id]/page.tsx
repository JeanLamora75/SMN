import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {readPrivateBriefArchive} from "@/server/ai-briefs/library";
import DuplicateButton from "../duplicate-button";
export const dynamic="force-dynamic";
export default async function ArchivedBriefPage({params}:{params:Promise<{id:string}>}){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))notFound();
 const {id}=await params;
 const archive=await withAuthDb(async db=>{
  const teams=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban')`);
  if(teams.rows.length!==1)return {state:"not-found" as const};
  return readPrivateBriefArchive(db,id,teams.rows[0].id);
 }).catch(()=>({state:"unavailable" as const}));
 if(archive.state==="not-found")notFound();
 return <main className="container-fluid px-3 px-lg-4 py-4">
  <Link href="/app/ai-briefs/archives">← Bibliothèque privée des briefs</Link>
  <section className="smn-panel rounded-4 p-4 my-3">
   <h1 className="h4">Brief TXT archivé</h1>
   {archive.state==="integrity-error"?<div className="alert alert-danger" role="alert">Échec du contrôle d'intégrité : fichier altéré. Aucun texte recomposé n'est proposé.</div>:
    archive.state==="unavailable"?<div className="alert alert-warning" role="alert">Archive indisponible.</div>:
    <>
     <p className="small text-secondary">Archive {archive.metadata.id} · {archive.metadata.mode} · {archive.metadata.created_at} · modèle {archive.metadata.template_id} (révision {archive.metadata.template_revision})</p>
     <a className="btn btn-outline-primary mb-3" href={"/api/ai-briefs/archives/"+encodeURIComponent(id)+"/download"}>Télécharger le TXT original</a>
     {account.role==="admin"&&<DuplicateButton parentId={id}/>}
     <label htmlFor="archived-brief-text" className="form-label">Contenu original, en lecture seule</label>
     <textarea id="archived-brief-text" className="form-control font-monospace" rows={25} readOnly value={archive.text}/>
    </>}
  </section>
 </main>;
}
