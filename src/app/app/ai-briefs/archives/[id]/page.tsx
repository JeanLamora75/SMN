import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {readPrivateBriefArchive} from "@/server/ai-briefs/library";
import DuplicateButton from "../duplicate-button";
import AddManualResponse from "./manual-response-form";
import ManualResponseActions from "./manual-response-actions";
import HumanAnalysisForm from "../../human-analysis-form";
import EditHumanAnalysis from "../../edit-human-analysis";
import {listManualAiResponses} from "@/server/ai-briefs/responses";
import {listHumanAnalyses} from "@/server/ai-briefs/human-analyses";
export const dynamic="force-dynamic";
export default async function ArchivedBriefPage({params}:{params:Promise<{id:string}>}){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))notFound();
 const {id}=await params;
 const view=await withAuthDb(async db=>{
  const teams=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban')`);
  if(teams.rows.length!==1)return {archive:{state:"not-found" as const},responses:[],analyses:[]};
  const archive=await readPrivateBriefArchive(db,id,teams.rows[0].id);
  const responses=archive.state==="ok"?await listManualAiResponses(db,id,teams.rows[0].id):[];
  const analyses=archive.state==="ok"?await listHumanAnalyses(db,archive.metadata.cycle_id,teams.rows[0].id):[];
  return {archive,responses,analyses};
 }).catch(()=>({archive:{state:"unavailable" as const},responses:[],analyses:[]}));
 const {archive,responses,analyses}=view;
 if(archive.state==="not-found")notFound();
 return <main className="container-fluid px-3 px-lg-4 py-4">
  <Link href="/app/ai-briefs/archives">← Bibliothèque privée des briefs</Link>
  <section className="smn-panel rounded-4 p-4 my-3">
   <h1 className="h4">Brief TXT archivé</h1>
   {archive.state==="integrity-error"?<div className="alert alert-danger" role="alert">Échec du contrôle d&apos;intégrité : fichier altéré. Aucun texte recomposé n&apos;est proposé.</div>:
    archive.state==="unavailable"?<div className="alert alert-warning" role="alert">Archive indisponible.</div>:
    <>
     <p className="small text-secondary">Archive {archive.metadata.id} · {archive.metadata.mode} · {archive.metadata.created_at} · modèle {archive.metadata.template_id} (révision {archive.metadata.template_revision})</p>
     {archive.metadata.parent_archive_id&&<p>Copie de : <Link href={"/app/ai-briefs/archives/"+archive.metadata.parent_archive_id}>{archive.metadata.parent_archive_id}</Link></p>}
     <a className="btn btn-outline-primary mb-3" href={"/api/ai-briefs/archives/"+encodeURIComponent(id)+"/download"}>Télécharger le TXT original</a>
     {account.role==="admin"&&<DuplicateButton parentId={id}/>}
     <label htmlFor="archived-brief-text" className="form-label">Contenu original, en lecture seule</label>
     <textarea id="archived-brief-text" className="form-control font-monospace" rows={25} readOnly value={archive.text}/>
     <h2 className="h5 mt-4">Réponses IA ajoutées manuellement</h2>
     {responses.length===0?<p className="text-secondary">Aucune réponse enregistrée pour ce brief.</p>:responses.map(response=><section className="border rounded-3 p-3 mb-3" key={response.id}>
      <p className="small text-secondary">Réponse {response.id} · {response.human_edited?"Origine IA, retouchée par un humain":"Réponse IA brute (collée manuellement)"} · enregistrée le {response.created_at} · dernière modification {response.updated_at} · fournisseur : {response.provider??"Non renseigné"} · modèle : {response.model??"Non renseigné"} · cycle : {archive.metadata.cycle_id}</p>
      <textarea className="form-control font-monospace" rows={12} readOnly value={response.response_text} aria-label={"Réponse IA "+response.id}/>
      {account.role==="admin"&&<ManualResponseActions archiveId={id} response={response}/>}
     </section>)}
     {account.role==="admin"&&responses.length===0&&<AddManualResponse archiveId={id}/> }
     <h2 className="h5 mt-4">Analyses humaines du cycle</h2>
     {analyses.length===0?<p className="text-secondary">Aucune analyse humaine.</p>:analyses.map(item=><section className="border rounded-3 p-3 mb-3" key={item.id}>
      <p className="small text-secondary">Origine : Humaine · {item.scope} · auteur : {item.author_id} · créé le {item.created_at} · modifié le {item.updated_at}</p>
      <textarea className="form-control" rows={6} readOnly value={item.content} aria-label={"Analyse humaine "+item.id}/>
      {account.role==="admin"&&<EditHumanAnalysis analysis={item}/>}
     </section>)}
     {account.role==="admin"&&<HumanAnalysisForm mode={archive.metadata.mode} cycleId={archive.metadata.cycle_id} archiveId={id}/>}
    </>}
  </section>
 </main>;
}
