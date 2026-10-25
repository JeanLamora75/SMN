import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {normalizeAnalysisFilters,readAnalysisJournal} from "@/server/ai-briefs/journal";
export const dynamic="force-dynamic";
export default async function AnalysisJournalPage({searchParams}:{searchParams:Promise<{type?:string;cycleId?:string;from?:string;to?:string}>}){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"read",{type:"collective",exists:true,inScope:true}))notFound();
 const params=await searchParams;
 const filters=normalizeAnalysisFilters(params);
 const entries=filters?await withAuthDb(async db=>{
  const team=await db.query<{id:string}>(`SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban')`);
  if(team.rows.length!==1)return [];
  return readAnalysisJournal(db,team.rows[0].id,filters);
 }).catch(()=>null):[];
 return <main className="container-fluid px-3 px-lg-4 py-4">
  <Link href="/app/ai-briefs/archives">← Bibliothèque des briefs</Link>
  <section className="smn-panel rounded-4 p-4 my-3">
   <h1 className="h4">Journal commun des analyses</h1>
   <p className="text-secondary">Analyses humaines et réponses IA ajoutées manuellement. Ce journal ne présente pas les interprétations comme des mesures observées.</p>
   <form method="get" className="row g-2 mb-4">
    <div className="col-md-3"><label htmlFor="journal-type" className="form-label">Origine</label>
     <select className="form-select" id="journal-type" name="type" defaultValue={params.type??""}>
      <option value="">Toutes</option><option value="human">Humaine</option><option value="ai">IA</option>
     </select></div>
    <div className="col-md-3"><label htmlFor="journal-cycle" className="form-label">Identifiant du cycle</label>
     <input id="journal-cycle" className="form-control" name="cycleId" defaultValue={params.cycleId??""}/></div>
    <div className="col-md-2"><label htmlFor="journal-from" className="form-label">Du</label>
     <input id="journal-from" className="form-control" type="date" name="from" defaultValue={params.from??""}/></div>
    <div className="col-md-2"><label htmlFor="journal-to" className="form-label">Au</label>
     <input id="journal-to" className="form-control" type="date" name="to" defaultValue={params.to??""}/></div>
    <div className="col-md-2 d-flex align-items-end"><button className="btn btn-primary w-100" type="submit">Filtrer</button></div>
   </form>
   {!filters?<div className="alert alert-warning">Filtres invalides. Corrigez les dates ou l&apos;identifiant du cycle.</div>:
    entries===null?<div className="alert alert-warning">Journal momentanément indisponible.</div>:
    entries.length===0?<div className="text-secondary">Aucune analyse trouvée pour ce périmètre et ces filtres.</div>:
    <div className="d-grid gap-3">{entries.map(item=><article className="border rounded-3 p-3" key={item.type+item.id}>
     <div className="d-flex justify-content-between gap-2 flex-wrap"><strong>{item.origin} — {item.scope}</strong>
      <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("fr-FR",{timeZone:"Europe/Paris"})}</time></div>
     <p className="small text-secondary mb-2">Cycle : {item.cycleId} · Auteur : {item.authorId} · modifié le {new Date(item.updatedAt).toLocaleString("fr-FR",{timeZone:"Europe/Paris"})}</p>
     <p className="mb-2" style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{item.content}</p>
     {item.archiveId&&<Link href={"/app/ai-briefs/archives/"+item.archiveId}>Consulter le TXT original immuable</Link>}
    </article>)}</div>}
  </section>
 </main>;
}
