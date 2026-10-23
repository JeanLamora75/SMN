"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Archive={id:string;createdAt:string;snapshotVersion:number|null;templateId:string;language:string;integrity:"verified"|"degraded"|"unavailable";manifest:{templateName?:string;sha256:string}};
export default function ReportArchiveList({sprintId}:{sprintId:string}){
 const t=useTranslation();
 const [items,setItems]=useState<Archive[]>([]),[error,setError]=useState(false);
 useEffect(()=>{const abort=new AbortController();void fetch("/api/admin/reports/sprints/"+encodeURIComponent(sprintId)+"/archives",{signal:abort.signal,cache:"no-store"}).then(async r=>{if(!r.ok)throw Error();return r.json() as Promise<Archive[]>;}).then(v=>{if(!abort.signal.aborted)setItems(v);}).catch(()=>{if(!abort.signal.aborted)setError(true);});return()=>abort.abort();},[sprintId]);
 return <section className="border-top pt-3"><h2 className="h5">{t("reportArchives.heading")}</h2>
 {error&&<p role="alert">{t("reportArchives.error")}</p>}
 {!error&&items.length===0&&<p className="text-secondary">{t("reportArchives.empty")}</p>}
 {items.length>0&&<div className="table-responsive"><table className="table table-sm">
 <thead><tr><th>{t("reportArchives.date")}</th><th>Vn</th><th>{t("reportArchives.template")}</th><th>{t("reportArchives.integrity")}</th><th>ID</th><th>{t("archiveLibrary.actions")}</th></tr></thead>
 <tbody>{items.map(item=><tr key={item.id}><td>{item.createdAt}</td><td>{item.snapshotVersion===null?"—":"V"+item.snapshotVersion}</td><td>{item.manifest.templateName??item.templateId} ({item.language})</td><td>{t(("reportArchives."+item.integrity) as "reportArchives.verified")}</td><td><code>{item.id}</code></td><td>{item.integrity==="verified"&&<a className="btn btn-sm btn-outline-primary" href={"/api/admin/reports/archives/"+encodeURIComponent(item.id)+"/download"}>{t("archiveLibrary.download")}</a>}</td></tr>)}</tbody></table></div>}
 </section>;
}
