"use client";
import {useEffect,useMemo,useState} from "react";
import {useTranslation} from "@/i18n/client";
type Item={id:string;title:string;url:string;scope:"TRANSVERSE"|"EQUIPE";teamId:string|null;teamName:string|null;categoryId:string;categoryName:string;revision:number};
type Team={id:string;name:string};
export default function LinksAdminInventory(){
 const t=useTranslation();
 const [items,setItems]=useState<Item[]>([]),[teams,setTeams]=useState<Team[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState(false);
 const [search,setSearch]=useState(""),[team,setTeam]=useState("all"),[scope,setScope]=useState("all"),[category,setCategory]=useState("all");
 useEffect(()=>{const controller=new AbortController();void fetch("/api/admin/links/inventory",{signal:controller.signal,cache:"no-store"})
  .then(async response=>{if(!response.ok)throw Error("unavailable");return response.json() as Promise<{items:Item[];teams:Team[]}>;})
  .then(result=>{if(controller.signal.aborted)return;if(!Array.isArray(result.items)||!Array.isArray(result.teams))throw Error("invalid");setItems(result.items);setTeams(result.teams);setError(false);})
  .catch(()=>{if(!controller.signal.aborted)setError(true);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[]);
 const categories=useMemo(()=>Array.from(new Map(items.map(i=>[i.categoryId,i.categoryName])).entries()),[items]);
 const shown=useMemo(()=>items.filter(i=>(!search||[i.title,i.url,i.categoryName,i.teamName].some(v=>v?.toLocaleLowerCase().includes(search.toLocaleLowerCase())))&&(team==="all"||i.teamId===team)&&(scope==="all"||i.scope===scope)&&(category==="all"||i.categoryId===category)),[items,search,team,scope,category]);
 return <section className="d-grid gap-3"><h1 className="h3">{t("linksAdmin.title")}</h1>
  {loading?<p role="status">{t("links.loading")}</p>:error?<p className="alert alert-warning" role="alert">{t("links.error")}</p>:<>
  <div className="card"><div className="card-body d-flex flex-wrap gap-2">
   <input type="search" className="form-control" style={{maxWidth:300}} aria-label={t("links.search")} placeholder={t("links.search")} value={search} onChange={e=>setSearch(e.target.value)}/>
   <select className="form-select w-auto" aria-label={t("links.team")} value={team} onChange={e=>setTeam(e.target.value)}><option value="all">{t("linksAdmin.allTeams")}</option>{teams.map(team=><option key={team.id} value={team.id}>{team.name}</option>)}</select>
   <select className="form-select w-auto" aria-label={t("links.scope")} value={scope} onChange={e=>setScope(e.target.value)}><option value="all">{t("links.allScopes")}</option><option value="TRANSVERSE">{t("links.transverse")}</option><option value="EQUIPE">{t("links.specific")}</option></select>
   <select className="form-select w-auto" aria-label={t("links.category")} value={category} onChange={e=>setCategory(e.target.value)}><option value="all">{t("links.allCategories")}</option>{categories.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select>
  </div></div>
  <p role="status" className="small text-body-secondary">{shown.length} / {items.length}</p>
  {shown.length===0?<p className="alert alert-info">{t("links.noMatch")}</p>:
  <div className="list-group">{shown.map(item=><article key={item.id} className="list-group-item d-flex align-items-center justify-content-between gap-2 flex-wrap"><div><strong>{item.title}</strong><div className="small text-body-secondary">{item.categoryName} · {item.scope==="TRANSVERSE"?t("links.transverse"):item.teamName??t("links.specific")}</div></div><a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">{t("links.open")}</a></article>)}</div>}
  </>}
 </section>;
}
