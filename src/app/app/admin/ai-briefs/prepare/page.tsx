import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {listBriefTemplates} from "@/server/ai-briefs/templates";
import BriefOverrides from "./brief-overrides";
import HumanAnalysisForm from "@/app/app/ai-briefs/human-analysis-form";
import {readBriefFacts} from "@/server/ai-briefs/facts";
import {readAnalysisJournal} from "@/server/ai-briefs/journal";
import {readBriefIndicatorValues} from "@/server/ai-briefs/indicators";
import {requestLocale} from "@/i18n/locale.server";
import {aiBriefText,type AiBriefKey} from "@/lib/ai-brief-messages";
import {localizedNativeBrief} from "@/lib/ai-brief-native-locales";
import {formatBriefCycleDates} from "@/lib/ai-brief-date";
import {formatBriefNumericValue} from "@/lib/ai-brief-number";
import "./brief-cockpit.css";

export const dynamic="force-dynamic";

type BriefContext={
 id:string; name:string; status:string; teamId:string; team:string; product:string|null;
 startAt:string; endAt:string; timeZone:string;
};

export default async function PrepareAiBrief({searchParams}:{
 searchParams:Promise<{mode?:string;id?:string;template?:string}>;
}){
 const locale=await requestLocale();
 const t=(key:AiBriefKey)=>aiBriefText(locale,key);
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
   SELECT s.id,s.name,s.status,t.id AS "teamId",t.name AS team,p.name AS product,
   s.start_at::text AS "startAt",s.end_at::text AS "endAt",
   s.time_zone AS "timeZone"
   FROM public.smn_sprint s
   JOIN public.smn_team t ON t.id=s.team_id
   JOIN public.smn_product p ON p.id=t.product_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE s.id=$1 AND s.deleted_at IS NULL
   AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'
  `:`
   SELECT k.id,k.name,k.status,t.id AS "teamId",t.name AS team,p.name AS product,
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
 const displayed=localizedNativeBrief(selected,locale);
 const factsRead=await withAuthDb(db=>readBriefFacts(db,scrum?"scrum":"kanban",context.id))
  .then(value=>({value,failed:false as const}))
  .catch(()=>({value:{} as Record<string,import("@/server/ai-briefs/facts").BriefFact>,failed:true as const}));
 const indicatorsRead=await withAuthDb(db=>readBriefIndicatorValues(db,context.teamId,scrum?"scrum":"kanban",context.id))
  .then(value=>({value,failed:false as const}))
  .catch(()=>({value:[] as import("@/server/ai-briefs/indicators").BriefIndicatorValue[],failed:true as const}));
 const facts=factsRead.value,indicators=indicatorsRead.value;
 const projected=[...Object.values(facts).filter(item=>item.unit!==null),
  ...indicators.filter(item=>item.available&&item.value!==null).map(item=>({
   key:"indicator."+item.tag,label:item.tag,value:item.value,unit:item.unit,
   source:item.source,quality:"recorded" as const,snapshotVersion:null
  }))];
 const historical=await withAuthDb(async db=>{
  const teams=await db.query<{id:string}>("SELECT t.id FROM public.smn_team t JOIN public.smn_installation i ON i.id=t.installation_id WHERE i.id='singleton' AND i.state='initialized' AND lower(i.mode) IN ('scrum','kanban')");
  return teams.rows.length===1?readAnalysisJournal(db,teams.rows[0].id,{}):[];
 }).catch(()=>[]);
 const preparedAt=new Date().toISOString();
 const provisional=context.status!=="closed";
 const localizedStatus=({closed:locale==="en"?"Closed":"Clôturé",
  finished:locale==="en"?"Finished":"Terminé",active:locale==="en"?"Active":"En cours",
  planned:locale==="en"?"Planned":"Planifié"} as Record<string,string>)[context.status]??context.status;
 const localizedQuality=(quality:string)=>({recorded:locale==="en"?"Recorded":"Enregistré",
  calculated:locale==="en"?"Calculated":"Calculé",provisional:locale==="en"?"Provisional":"Provisoire",
  unavailable:locale==="en"?"Unavailable":"Indisponible"} as Record<string,string>)[quality]??quality;
 const localizedSource=(source:string)=>({current:locale==="en"?"Current data":"Données courantes",
  "current-saved-kpi":locale==="en"?"Saved capacity":"Capacité enregistrée",
  "closure-snapshot":locale==="en"?"Closure snapshot":"Instantané de clôture"} as Record<string,string>)[source]??source;
 return <main className="smn-page smn-team-page smn-brief-cockpit container-fluid px-3 px-lg-4 py-4">
  <header className="smn-brief-hero mb-3">
   <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
    <div>
     <p className="smn-brief-eyebrow mb-2">{scrum?"Scrum":"Kanban"} · {context.team}</p>
     <h1 className="mb-2">{t("prepareTitle")}</h1>
     <p className="smn-brief-subtitle mb-0">{t("prepareIntro")}</p>
    </div>
    <nav className="d-flex flex-wrap gap-2" aria-label={locale==="en"?"AI brief navigation":"Navigation des briefs IA"}>
     <Link className="btn btn-sm" href={back}>{t("back")}</Link>
     <Link className="btn btn-sm" href="/app/ai-briefs/archives">{t("library")}</Link>
    </nav>
   </div>
  </header>
  <section className="smn-brief-card mb-3" aria-labelledby="brief-context-title">
   <div className="smn-brief-card-header mb-3">
    <div><h2 id="brief-context-title">{locale==="en"?"Cycle context":"Contexte du cycle"}</h2>
     <p>{locale==="en"?"Information loaded from the selected cycle":"Informations reprises automatiquement du cycle sélectionné"}</p>
    </div>
    <span className={"badge "+(provisional?"text-bg-warning":"text-bg-success")}>{localizedStatus}</span>
   </div>
   <div className="smn-brief-context">
    <div className="smn-brief-context-item"><strong>{t("cycle")}</strong><span>{context.name}</span></div>
    <div className="smn-brief-context-item"><strong>{t("team")} · {t("product")}</strong><span>{context.team} · {context.product??t("unknown")}</span></div>
    <div className="smn-brief-context-item"><strong>{t("dates")}</strong><span>{formatBriefCycleDates(context.startAt,context.endAt,context.timeZone,locale)}</span></div>
   </div>
   {provisional&&<div className="alert alert-warning smn-brief-context-banner mt-3 mb-0 py-2" role="status">{t("provisional")}</div>}
  </section>
  <section className="smn-brief-card mb-3" aria-labelledby="brief-templates">
   <div className="smn-brief-card-header">
    <div><h2 id="brief-templates">{t("models")}</h2>
     <p>{t("selectModel")}</p></div>
    <Link className="btn btn-outline-secondary btn-sm" href="/app/admin/ai-briefs/templates">{t("manageModels")}</Link>
   </div>
   <nav className="smn-brief-template-list" aria-label={t("models")}>
    {available.map(item=><Link key={item.id}
     className={item.id===selected.id?"btn btn-primary":"btn btn-outline-primary"}
     aria-current={item.id===selected.id?"page":undefined}
     href={"/app/admin/ai-briefs/prepare?"+new URLSearchParams({mode:mode!,id:context.id,template:item.id}).toString()}>
     {localizedNativeBrief(item,locale).title}</Link>)}
   </nav>
   <div className="smn-brief-template-description">
    <div className="d-flex align-items-center flex-wrap gap-2">
     <strong>{displayed.title}</strong>
     <span className="badge text-bg-light">{selected.builtin?t("nativeModel"):t("customModel")} · {t("version")} {selected.revision}</span>
    </div>
    <p className="small text-secondary mb-0 mt-1">{displayed.description}</p>
   </div>
  </section>
  <section aria-label={t("provenanceTitle")} className="mb-3">
   <details className="smn-brief-details">
    <summary>
     <span>{t("provenanceTitle")} <span className="badge text-bg-secondary ms-2">{projected.length}</span></span>
     <span className="smn-brief-small-muted">{locale==="en"?"Show details":"Afficher le détail"}</span>
    </summary>
    <div className="smn-brief-details-body">
     {(factsRead.failed||indicatorsRead.failed)&&<p role="alert" className="alert alert-warning">
      {locale==="en"?"Some collective data could not be loaded. Values are not replaced with estimates.":
       "Certaines données collectives n’ont pas pu être chargées. Aucune estimation ne les remplace."}
     </p>}
     <p className="smn-brief-small-muted">{t("provenanceHelp")}</p>
     <div className="table-responsive">
      <table className="table smn-brief-data-table">
       <thead><tr><th scope="col">{t("indicator")}</th><th scope="col" className="smn-brief-number">{t("value")}</th>
        <th scope="col">{t("unit")}</th><th scope="col">{t("quality")}</th><th scope="col">{t("source")}</th></tr></thead>
       <tbody>{projected.map(item=><tr key={item.key}>
        <th scope="row">{item.label}</th>
        <td className="smn-brief-number">{formatBriefNumericValue(item.value,locale)??t("unknown")}</td>
        <td>{item.unit??"—"}</td><td>{localizedQuality(item.quality)}</td>
        <td>{localizedSource(item.source)}{item.snapshotVersion!==null?" · V"+item.snapshotVersion:""}</td>
       </tr>)}</tbody>
      </table>
     </div>
    </div>
   </details>
  </section>
  <BriefOverrides key={selected.id+":"+selected.revision} template={displayed} mode={scrum?"scrum":"kanban"}
   context={context} facts={facts} preparedAt={preparedAt} historical={historical} indicators={indicators}/>
  <section className="smn-brief-card mt-3" aria-label={locale==="en"?"Additional analysis":"Analyse complémentaire"}>
   <HumanAnalysisForm mode={scrum?"scrum":"kanban"} cycleId={context.id}/>
  </section>
  <footer className="d-flex justify-content-between align-items-center gap-2 flex-wrap mt-3">
   <p className="smn-brief-small-muted mb-0">{t("personalInfoExcluded")} {t("noAutoArchive")}</p>
   <Link className="btn btn-outline-secondary" href={back}>{t("close")}</Link>
  </footer>
 </main>;
}
