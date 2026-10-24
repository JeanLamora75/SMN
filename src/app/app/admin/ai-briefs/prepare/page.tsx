import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {allowedBriefFields} from "@/lib/ai-brief-templates";
import {listBriefTemplates} from "@/server/ai-briefs/templates";

export const dynamic="force-dynamic";

type BriefContext={
 id:string; name:string; status:string; team:string; product:string|null;
 startAt:string; endAt:string; timeZone:string;
};

export default async function PrepareAiBrief({searchParams}:{
 searchParams:Promise<{mode?:string;id?:string;template?:string}>;
}){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 // Checking at the server boundary prevents read-only users from preparing a brief.
 if(!canAccess(account,"write",{type:"settings",exists:true,inScope:true}))notFound();
 const {mode,id,template}=await searchParams;
 if((mode!=="scrum"&&mode!=="kanban")||!id||!/^[a-f0-9-]{36}$/i.test(id))notFound();
 const scrum=mode==="scrum";
 const context=await withAuthDb(async db=>{
  const sql=scrum?`
   SELECT s.id,s.name,s.status,t.name AS team,p.name AS product,
   s.start_at::text AS "startAt",s.end_at::text AS "endAt",
   s.time_zone AS "timeZone"
   FROM public.smn_sprint s
   JOIN public.smn_team t ON t.id=s.team_id
   JOIN public.smn_product p ON p.id=t.product_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE s.id=$1 AND s.deleted_at IS NULL
   AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'
  `:`
   SELECT k.id,k.name,k.status,t.name AS team,p.name AS product,
   k.start_on::text AS "startAt",k.end_on::text AS "endAt",
   k.time_zone AS "timeZone"
   FROM public.smn_kanban_period k
   JOIN public.smn_team t ON t.id=k.team_id
   JOIN public.smn_product p ON p.id=t.product_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE k.id=$1 AND k.deleted_at IS NULL
   AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='kanban'
  `;
  const result=await db.query<BriefContext>(sql,[id]);
  return result.rows[0]??null;
 }).catch(()=>null);
 if(!context)notFound();
 const back=scrum?
  "/app/admin/sprints/"+encodeURIComponent(context.id):
  "/app/admin/kanban-periods/"+encodeURIComponent(context.id)+"/report";
 const templates=await withAuthDb(listBriefTemplates);
 const available=templates.filter(t=>t.active);
 const selected=available.find(t=>t.id===template)??available[0];
 const fields=allowedBriefFields(scrum?"scrum":"kanban",selected.data);
 const preparedAt=new Date().toISOString();
 const provisional=context.status!=="closed";
 return <main className="container-fluid px-3 px-lg-4 py-4">
  <Link href={back}>← Retour au cycle</Link>
  <section className="smn-panel rounded-4 p-4 my-3">
   <h1 className="h4">Préparer un brief IA</h1>
   <p className="text-secondary">Contexte repris automatiquement du cycle sélectionné. Aucun nouveau cycle n’est créé.</p>
   {provisional&&<div className="alert alert-warning" role="status">
    Brief provisoire : cette période n’est pas clôturée. Les données peuvent encore évoluer.
   </div>}
   <dl className="row mb-3">
    <dt className="col-sm-3">Identifiant</dt><dd className="col-sm-9">{context.id}</dd>
    <dt className="col-sm-3">Cycle</dt><dd className="col-sm-9">{context.name}</dd>
    <dt className="col-sm-3">Équipe</dt><dd className="col-sm-9">{context.team}</dd>
    <dt className="col-sm-3">Produit</dt><dd className="col-sm-9">{context.product??"Non renseigné"}</dd>
    <dt className="col-sm-3">Mode</dt><dd className="col-sm-9">{scrum?"Scrum":"Kanban"}</dd>
    <dt className="col-sm-3">Dates</dt><dd className="col-sm-9">{context.startAt} — {context.endAt} ({context.timeZone})</dd>
    <dt className="col-sm-3">Statut</dt><dd className="col-sm-9">{context.status}</dd>
    <dt className="col-sm-3">Préparé le</dt><dd className="col-sm-9"><time dateTime={preparedAt}>{new Intl.DateTimeFormat("fr-FR",{dateStyle:"long",timeStyle:"medium",timeZone:"Europe/Paris"}).format(new Date(preparedAt))} (Europe/Paris)</time></dd>
   </dl>
   <section aria-labelledby="brief-templates" className="border-top pt-3 mt-3">
    <h2 id="brief-templates" className="h5">Modèles de briefs</h2>
    <Link className="btn btn-outline-secondary btn-sm mb-3" href="/app/admin/ai-briefs/templates">Administrer les modèles</Link>
    <p className="text-secondary small">Choisissez un modèle pour consulter sa configuration. Les paramètres sont réutilisables et cette consultation n’enregistre rien.</p>
    <div className="d-flex flex-wrap gap-2 mb-3">
     {available.map(item=><Link key={item.id}
      className={item.id===selected.id?"btn btn-primary btn-sm":"btn btn-outline-primary btn-sm"}
      aria-current={item.id===selected.id?"page":undefined}
      href={"/app/admin/ai-briefs/prepare?"+new URLSearchParams({mode:mode!,id:context.id,template:item.id}).toString()}>
      {item.title}</Link>)}
    </div>
    <h3 className="h6">{selected.title}</h3><p>{selected.description}</p><p className="small text-secondary">Profondeur : {selected.depth}/5</p>
    <div className="row g-3">
     <div className="col-12 col-lg-6"><h4 className="h6">Rubriques</h4><ol>{selected.sections.map(s=><li key={s}>{s}</li>)}</ol></div>
     <div className="col-12 col-lg-6"><h4 className="h6">Données collectives proposées</h4><ul>{fields.map(field=><li key={field}><code>{field}</code></li>)}</ul></div>
     <div className="col-12 col-lg-6"><h4 className="h6">Questions proposées</h4><ul>{selected.questions.map(q=><li key={q}>{q}</li>)}</ul></div>
     <div className="col-12 col-lg-6"><h4 className="h6">Consignes</h4><ul>{selected.instructions.map(s=><li key={s}>{s}</li>)}</ul></div>
    </div>
    <p className="small text-secondary">Les champs individuels sont toujours exclus. Les données absentes resteront absentes ; aucune mesure ni conclusion ne sera inventée.</p>
   </section>
   <p className="small text-secondary">Ouverture sans sauvegarde : aucun brouillon, TXT ou analyse n’est créé. La sélection des données et la finalisation seront disponibles dans les étapes suivantes de l’Epic 9.</p>
   <Link className="btn btn-outline-secondary" href={back}>Fermer sans enregistrer</Link>
  </section>
 </main>;
}
