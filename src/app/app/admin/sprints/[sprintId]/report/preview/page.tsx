import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {composeHtmlReportPreview} from "@/server/reports/html-preview";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import {readReportLanguage} from "@/server/reports/language";
export const dynamic="force-dynamic";
export default async function ReportPreviewPage({params}:{params:Promise<{sprintId:string}>}){
 const account=await currentAccount();if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"write",{type:"settings",exists:true,inScope:true}))notFound();
 const {sprintId}=await params;if(!/^[a-f0-9-]{36}$/i.test(sprintId))notFound();
 const payload=await withSprintIndexDb(async db=>({
  data:await composeHtmlReportPreview(db,sprintId),
  language:await readReportLanguage(db,sprintId)
 })).catch(()=>null);
 if(!payload?.data)notFound();
 const data=payload.data;
 const locale=payload.language.language,label=(key:string)=>translate(locale,("reportPreview."+key) as "reportPreview.title");
 const note=(key:string)=>{const n=data.notes[key as keyof typeof data.notes];return n?.included&&n.text.trim()?n:null;};
 return <main lang={locale} className="container-fluid px-3 px-lg-4 py-4">
 <Link href={"/app/admin/sprints/"+encodeURIComponent(sprintId)+"/report"}>{label("back")}</Link>
 <article className="smn-panel rounded-4 p-4 my-3">
 <header className="border-bottom pb-3 mb-4"><h1 className="h3">{label("title")}</h1>
 <h2 className="h5">{data.sprint.name}</h2>
 <p>{data.sprint.product} · {data.sprint.team}</p>
 <p>{data.sprint.startAt} — {data.sprint.endAt} · {data.sprint.status}</p>
 <p>{label("generatedAt")}: <time dateTime={data.generatedAt}>{data.generatedAt}</time>
 {data.version!==null&&<> · V{data.version}</>}</p>
 {data.provisional&&<div className="alert alert-warning">{label("provisional")}</div>}
 <p className="text-secondary">{label("readOnly")}</p>
 </header>
 {note("introduction")&&<section><h2 className="h5">{label("introduction")}</h2><p style={{whiteSpace:"pre-wrap"}} lang={note("introduction")?.language}>{note("introduction")?.text}</p></section>}
 {data.sections.map(section=><section className="mb-4" key={section.key}>
 <h2 className="h5">{translate(locale,("standardReport."+section.key) as "standardReport.executive")}</h2>
 {section.key==="indicators"?<>
 <ul>{data.metrics.map(m=><li key={m.key}>{translate(locale,("reportContent."+m.key) as "reportContent.committedSp")}: {m.available?m.value+" "+m.unit:label("missing")}</li>)}</ul>
 {data.trends.length>0&&<div className="table-responsive"><table className="table table-sm"><thead><tr><th>{label("cycle")}</th><th>SP</th><th>%</th><th>JH</th></tr></thead><tbody>
 {data.trends.map(p=><tr key={p.sprintId}><td>{p.name}</td><td>{p.completedSp??label("missing")}</td>
 <td>{p.completionRate??label("missing")}</td><td>{p.actualCapacityJh??label("missing")}</td></tr>)}
 </tbody></table></div>}
 </>:section.items.length?<ul>{section.items.map((entry,index)=><li key={index}>
 {entry.label}{entry.detail?" — "+entry.detail:""}</li>)}</ul>:
 <p className="text-secondary">{translate(locale,section.state==="unavailable"?"standardReport.unavailable":"standardReport.empty")}</p>}
 {note(section.key)&&<p className="border-start ps-3" lang={note(section.key)?.language} style={{whiteSpace:"pre-wrap"}}>{note(section.key)?.text}</p>}
 </section>)}
 {note("conclusion")&&<section><h2 className="h5">{label("conclusion")}</h2><p style={{whiteSpace:"pre-wrap"}} lang={note("conclusion")?.language}>{note("conclusion")?.text}</p></section>}
 {data.teamContext.length>0&&<footer className="border-top pt-3">{data.teamContext.map(entry=><section key={entry.key}>
 <h2 className="h6">{label(entry.key)}</h2>
 {entry.kind==="url"?<p><a href={entry.value} target="_blank" rel="noopener noreferrer">{entry.value}</a> — {label("unverified")}</p>:
 <p lang={entry.language??undefined} style={{whiteSpace:"pre-wrap"}}>{entry.value}</p>}</section>)}</footer>}
 </article></main>;
}
