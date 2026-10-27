import "./print.css";
import Link from "next/link";
import Image from "next/image";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {withAuthDb} from "@/server/auth/database";
import {assertTeamReportCycle} from "@/server/reports/team-cycle";
import {withLegacyReportReadDb} from "@/server/reports/legacy-read";
import {composeHtmlReportPreview} from "@/server/reports/html-preview";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import {readReportLanguage} from "@/server/reports/language";
import {readReportLogo} from "@/server/reports/logo-store";
import {readFrozenReportReference} from "@/server/reports/render-reference";
import PrintReportButton from "./print-report-button";
import FrozenPdfExport from "./frozen-pdf-export";
export const dynamic="force-dynamic";
export default async function ReportPreviewPage({params,searchParams}:{params:Promise<{sprintId:string}>;searchParams:Promise<{reference?:string;teamId?:string}>}){
 const account=await currentAccount();if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"write",{type:"settings",exists:true,inScope:true}))notFound();
 const {sprintId}=await params;if(!/^[a-f0-9-]{36}$/i.test(sprintId))notFound();
 const {reference:requested,teamId}=await searchParams;
 if(teamId!==undefined&&(!/^[a-f0-9-]{36}$/i.test(teamId)||account.role!=="admin"))notFound();
 const frozen=typeof requested==="string"&&/^[a-f0-9-]{36}$/i.test(requested);
 if(requested&&!frozen)notFound();
 const load=async (db:import("pg").Client)=>{
  if(teamId&&!await assertTeamReportCycle(db,{accountId:account.id,role:account.role},teamId,sprintId))return null;
  if(frozen){
   const ref=await readFrozenReportReference(db,requested,sprintId,teamId);
   if(!ref)return null;
   return ref.payload;
  }
  if(teamId)return null; // No live preview in v28: a verified frozen reference is required.
  return {data:await composeHtmlReportPreview(db,sprintId),
   language:await readReportLanguage(db,sprintId),
   logo:await readReportLogo(db,sprintId)};
 };
 const payload=await (teamId?withAuthDb(load):withLegacyReportReadDb(load)).catch(()=>null);
 if(!payload?.data)notFound();
 const data=payload.data;
 const locale=payload.language.language,label=(key:string)=>translate(locale,("reportPreview."+key) as "reportPreview.title");
 const note=(key:string)=>{const n=data.notes[key as keyof typeof data.notes];return n?.included&&n.text.trim()?n:null;};
 return <main lang={locale} className="container-fluid px-3 px-lg-4 py-4 smn-report-printable">
 <span className="d-print-none"><Link href={"/app/admin/sprints/"+encodeURIComponent(sprintId)+"/report"}>{label("back")}</Link></span>
 {frozen&&<p className="alert alert-info" role="status">{label("frozenReference")}: <code>{requested}</code></p>}
 {frozen&&!teamId?<FrozenPdfExport sprintId={sprintId} reference={requested} label={label("pdfExport")} errorLabel={label("pdfError")}/>:!frozen?<PrintReportButton label={label("print")} warning={label("printWarning")}/>:null}
 <article className="smn-panel rounded-4 p-4 my-3">
 <header className="border-bottom pb-3 mb-4"><div className="d-flex gap-4 justify-content-between align-items-start"><div><h1 className="h3">{label("title")}</h1>
 <h2 className="h5">{data.sprint.name}</h2>
 <p>{data.sprint.product} · {data.sprint.team}</p>
 <p>{data.sprint.startAt} — {data.sprint.endAt} · {data.sprint.status}</p>
 <p>{label("generatedAt")}: <time dateTime={data.generatedAt}>{data.generatedAt}</time>
 {data.version!==null&&<> · V{data.version}</>}</p>
 {data.historicalEvidence&&<div className="alert alert-warning" role="note">
  <strong>{locale==="fr"?"Sprint historique — bilan reconstitué rétrospectivement":"Historical Sprint — retrospectively reconstructed report"}</strong>
  <p className="mb-1">{locale==="fr"?"Les dates affichées sont celles du Sprint. La saisie et la préparation du rapport ont lieu ultérieurement ; ce document n'est pas une archive produite à l'époque.":"The dates shown belong to the Sprint. Data entry and report preparation happened later; this is not an original period archive."}</p>
  <p className="mb-0">{locale==="fr"?"Registres qualitatifs anciens : historique indisponible sauf preuve explicitement documentée. Les informations absentes ne valent pas zéro.":"Historical qualitative registers: unavailable unless explicitly evidenced. Missing information does not mean zero."}</p>
 </div>}
 {data.provisional&&<div className="alert alert-warning">{label("provisional")}</div>}
 <p className="text-secondary d-print-none">{label("readOnly")}</p></div>
 {payload.logo&&<Image unoptimized src={"data:"+payload.logo.mime+";base64,"+payload.logo.base64} alt={label("logoAlt")} width={130} height={90} style={{objectFit:"contain",maxWidth:"28%"}}/>}</div>
 </header>
 {note("introduction")&&<section><h2 className="h5">{label("introduction")}</h2><p style={{whiteSpace:"pre-wrap"}} lang={note("introduction")?.language}>{note("introduction")?.text}</p></section>}
 {data.sections.map(section=><section className="mb-4" key={section.key}>
 <h2 className="h5">{translate(locale,("standardReport."+section.key) as "standardReport.executive")}</h2>
 {section.key==="indicators"?<>
 <ul>{data.metrics.map(m=><li key={m.key}>{translate(locale,("reportContent."+m.key) as "reportContent.committedSp")}: {m.available?m.value+" "+m.unit:label("missing")}{data.historicalEvidence&&<small className="ms-2 text-secondary">({(()=>{const q=m.key==="completedSp"?data.historicalEvidence.completedSpQuality:m.key==="plannedJh"?data.historicalEvidence.capacityPlannedQuality:m.key==="actualJh"?data.historicalEvidence.capacityActualQuality:"not-supplied";return q==="known"?(locale==="fr"?"Connue":"Known"):q==="estimated"?(locale==="fr"?"Estimée":"Estimated"):(locale==="fr"?"Qualité non attestée":"Unverified quality");})()})</small>}</li>)}</ul>
 {data.trends.length>0&&<div className="table-responsive"><table className="table table-sm"><caption className="caption-top">{label("trendsCaption")}</caption><thead><tr><th scope="col">{label("cycle")}</th><th scope="col">SP</th><th scope="col">%</th><th scope="col">JH</th></tr></thead><tbody>
 {data.trends.map(p=><tr key={p.sprintId}><td>{p.name}</td><td>{p.completedSp??label("missing")}</td>
 <td>{p.completionRate??label("missing")}</td><td>{p.actualCapacityJh??label("missing")}</td></tr>)}
 </tbody></table></div>}
 </>:section.items.length?<ul>{section.items.map((entry,index)=><li key={index}>
 {entry.label}{entry.detail?" — "+entry.detail:""}</li>)}</ul>:
 <p className="text-secondary">{translate(locale,section.state==="unavailable"?"standardReport.unavailable":"standardReport.empty")}</p>}
 {note(section.key)&&<p className="border-start ps-3" lang={note(section.key)?.language} style={{whiteSpace:"pre-wrap"}}>{note(section.key)?.text}</p>}
 </section>)}
 {data.chosenAnalyses?.length>0&&<section className="border-top pt-3 mt-4" aria-label="Interprétations sélectionnées"><h2 className="h5">Analyses choisies — interprétations, non indicateurs</h2><p className="small text-secondary">Ces textes ne sont ni des KPI ni des données observées. Ils ont été sélectionnés volontairement.</p>{data.chosenAnalyses.map(a=><article className="border-start ps-3 mb-3" key={a.type+":"+a.id}><h3 className="h6">{a.origin} · {a.scope}</h3><p className="small text-secondary">Origine : {a.type==="human"?"Humaine":"IA"} · créé le {a.createdAt} · cycle {a.cycleId}{a.archiveId?" · brief source "+a.archiveId:""}</p><p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{a.content}</p></article>)}</section>}
 {note("conclusion")&&<section><h2 className="h5">{label("conclusion")}</h2><p style={{whiteSpace:"pre-wrap"}} lang={note("conclusion")?.language}>{note("conclusion")?.text}</p></section>}
 {data.teamContext.length>0&&<footer className="border-top pt-3">{data.teamContext.map(entry=><section key={entry.key}>
 <h2 className="h6">{label(entry.key)}</h2>
 {entry.kind==="url"?<p><a href={entry.value} target="_blank" rel="noopener noreferrer">{entry.value}</a> — {label("unverified")}</p>:
 <p lang={entry.language??undefined} style={{whiteSpace:"pre-wrap"}}>{entry.value}</p>}</section>)}</footer>}
 </article></main>;
}
