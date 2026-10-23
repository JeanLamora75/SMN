import Link from "next/link";
import HideArchiveAction from "./hide-archive-action";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {searchPdfArchives} from "@/server/reports/archive-library";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
export const dynamic="force-dynamic";
export default async function ArchivedReportsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const account=await currentAccount();if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"write",{type:"settings",exists:true,inScope:true}))notFound();
 const raw=await searchParams;
 const single=(v:string|string[]|undefined)=>typeof v==="string"?v:"";
 const filters={cycleId:single(raw.cycleId),from:single(raw.from),to:single(raw.to),templateId:single(raw.templateId),status:single(raw.status),page:Number(single(raw.page)||1)};
 const result=await withSprintIndexDb(db=>searchPdfArchives(db,filters)).catch(()=>null);
 if(!result)notFound();
 const locale=await requestLocale(),tr=(key:string)=>translate(locale,("archiveLibrary."+key) as "archiveLibrary.heading");
 const query=(page:number)=>{const p=new URLSearchParams();for(const [k,v] of Object.entries(filters))if(k!=="page"&&String(v))p.set(k,String(v));p.set("page",String(page));return "?"+p.toString();};
 return <main className="container-fluid px-3 px-lg-4 py-4"><h1 className="h4">{tr("heading")}</h1>
 <p>{tr("intro")}</p>
 <form method="get" className="border rounded p-3 row g-2 mb-3">
 <label className="col-md-3">{tr("cycle")}<input name="cycleId" className="form-control" defaultValue={filters.cycleId}/></label>
 <label className="col-md-2">{tr("from")}<input name="from" type="date" className="form-control" defaultValue={filters.from}/></label>
 <label className="col-md-2">{tr("to")}<input name="to" type="date" className="form-control" defaultValue={filters.to}/></label>
 <label className="col-md-3">{tr("template")}<input name="templateId" className="form-control" defaultValue={filters.templateId}/></label>
 <label className="col-md-2">{tr("status")}<select name="status" className="form-select" defaultValue={filters.status}>
 <option value="">{tr("all")}</option><option value="closed">closed</option><option value="open">open</option><option value="reopened">reopened</option></select></label>
 <div><button type="submit" className="btn btn-primary">{tr("search")}</button></div></form>
 {result.items.length===0?<p className="alert alert-info">{tr("empty")}</p>:
 <div className="table-responsive"><table className="table table-sm">
 <thead><tr><th>{tr("date")}</th><th>{tr("cycle")}</th><th>{tr("template")}</th><th>{tr("status")}</th><th>{tr("version")}</th><th>ID</th><th>{tr("actions")}</th></tr></thead>
 <tbody>{result.items.map((a:any)=><tr key={a.id}>
 <td>{a.createdAt}</td><td><Link href={"/app/admin/sprints/"+encodeURIComponent(a.cycleId)+"/report"}>{a.cycleName}</Link></td>
 <td>{a.manifest?.templateName??a.templateId}</td><td>{a.status}</td><td>{a.snapshotVersion===null?"—":"V"+a.snapshotVersion}</td><td><code>{a.id}</code></td><td><a className="btn btn-sm btn-outline-primary me-2" href={"/api/admin/reports/archives/"+encodeURIComponent(a.id)+"/download"}>{tr("download")}</a><HideArchiveAction id={a.id} labels={{hide:tr("hide"),reason:tr("reason"),confirm:tr("confirm"),error:tr("hideError")}}/></td>
 </tr>)}</tbody></table></div>}
 <p>{tr("count")}: {result.total}</p>
 <nav className="d-flex gap-3">{result.page>1&&<Link href={query(result.page-1)}>{tr("previous")}</Link>}
 {result.page*25<result.total&&<Link href={query(result.page+1)}>{tr("next")}</Link>}</nav>
 </main>;
}
