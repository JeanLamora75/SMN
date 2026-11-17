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
 return <main className="container-fluid px-3 px-lg-4 py-4">
  <div className="d-flex flex-wrap justify-content-between gap-2"><Link href={back}>{t("back")}</Link><Link href="/app/ai-briefs/archives">{t("library")}</Link></div>
  <section className="smn-panel rounded-4 p-4 my-3">
   <h1 className="h4">{t("prepareTitle")}</h1>
   <p className="text-secondary">{t("prepareIntro")}</p>
   {provisional&&<div className="alert alert-warning" role="status">
    {t("provisional")}
   </div>}
   <dl className="row mb-3">
    <dt className="col-sm-3">{t("cycle")}</dt><dd className="col-sm-9">{context.name}</dd>
    <dt className="col-sm-3">{t("team")}</dt><dd className="col-sm-9">{context.team}</dd>
    <dt className="col-sm-3">{t("product")}</dt><dd className="col-sm-9">{context.product??t("unknown")}</dd>
    <dt className="col-sm-3">{t("agileMode")}</dt><dd className="col-sm-9">{scrum?"Scrum":"Kanban"}</dd>
    <dt className="col-sm-3">{t("dates")}</dt><dd className="col-sm-9">{formatBriefCycleDates(context.startAt,context.endAt,context.timeZone,locale)}</dd>
    <dt className="col-sm-3">{t("status")}</dt><dd className="col-sm-9">{localizedStatus}</dd>
    <dt className="col-sm-3">{t("preparedAt")}</dt><dd className="col-sm-9"><time dateTime={preparedAt}>{new Intl.DateTimeFormat(locale==="en"?"en-GB":"fr-FR",{dateStyle:"long",timeStyle:"medium",timeZone:context.timeZone}).format(new Date(preparedAt))} ({context.timeZone})</time></dd>
   </dl>
   <section aria-labelledby="brief-templates" className="border-top pt-3 mt-3">
    <h2 id="brief-templates" className="h5">{t("models")}</h2>
    <Link className="btn btn-outline-secondary btn-sm mb-3" href="/app/admin/ai-briefs/templates">{t("manageModels")}</Link>
    <p className="text-secondary small">{t("selectModel")}</p>
    <div className="d-flex flex-wrap gap-2 mb-3">
     {available.map(item=><Link key={item.id}
      className={item.id===selected.id?"btn btn-primary btn-sm":"btn btn-outline-primary btn-sm"}
      aria-current={item.id===selected.id?"page":undefined}
      href={"/app/admin/ai-briefs/prepare?"+new URLSearchParams({mode:mode!,id:context.id,template:item.id}).toString()}>
      {localizedNativeBrief(item,locale).title}</Link>)}
    </div>
    <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
     <h3 className="h6 m-0">{displayed.title}</h3>
     <span className="badge text-bg-light">{selected.builtin?t("nativeModel"):t("customModel")} · {t("version")} {selected.revision}</span>
    </div>
    <p className="text-secondary">{displayed.description}</p>
    <p className="small text-secondary">{t("modelDescription")}</p>
    <div className="border rounded-3 p-3 mt-3">
     <h3 className="h6">{t("provenanceTitle")}</h3>
     {(factsRead.failed||indicatorsRead.failed)&&<p role="alert" className="alert alert-warning">
      {locale==="en"?"Some collective data could not be loaded. Values are not replaced with estimates.":
       "Certaines données collectives n’ont pas pu être chargées. Aucune estimation ne les remplace."}
     </p>}
     <p className="small text-secondary">{t("provenanceHelp")}</p>
     <div className="table-responsive"><table className="table table-sm">
      <thead><tr><th>{t("indicator")}</th><th>{t("value")}</th><th>{t("unit")}</th><th>{t("quality")}</th><th>{t("source")}</th></tr></thead>
      <tbody>{projected.map(item=><tr key={item.key}><th scope="row">{item.label}</th><td>{formatBriefNumericValue(item.value,locale)??t("unknown")}</td><td>{item.unit??"—"}</td><td>{localizedQuality(item.quality)}</td><td>{localizedSource(item.source)}{item.snapshotVersion!==null?" · V"+item.snapshotVersion:""}</td></tr>)}</tbody>
     </table></div>
    </div>
    <BriefOverrides key={selected.id+":"+selected.revision} template={displayed} mode={scrum?"scrum":"kanban"} context={context} facts={facts} preparedAt={preparedAt} historical={historical} indicators={indicators}/>
    <p className="small text-secondary">{t("personalInfoExcluded")}</p>
   </section>
   <HumanAnalysisForm mode={scrum?"scrum":"kanban"} cycleId={context.id}/>
   <p className="small text-secondary">{t("noAutoArchive")}</p>
   <Link className="btn btn-outline-secondary" href={back}>{t("close")}</Link>
  </section>
 </main>;
}
