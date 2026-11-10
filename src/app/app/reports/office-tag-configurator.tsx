"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {officeRowDefinitions,officeScalarDefinitions,officeChartDefinitions} from "./office-tags";
import {serializeOfficeTag} from "@/lib/office-tag-builder";
import {useTranslation} from "@/i18n/client";

type Locale="fr"|"en";
type Family="scalar"|"indicator"|"row"|"chart";
type Rule={field:string;direction:"ASC"|"DESC"};
type Indicator={id:string;tag:string;name:string;archived_at:string|null};
type Catalog={definitions:Indicator[];selections:{indicator_id:string;is_active:boolean}[]};
type ChartStyle={id:string;name:string};
type ChartType="bar"|"line"|"area"|"pie"|"donut"|"gauge";
const fieldName=/^[A-Z][A-Z0-9_]*$/;
export default function OfficeTagConfigurator({locale,teamId}:{locale:Locale;teamId:string|null}){
 const t=useTranslation();
 const tr=(key:string)=>t(("reportsCenter.tagBuilder"+key) as Parameters<typeof t>[0]);
 const [open,setOpen]=useState(false),[family,setFamily]=useState<Family>("scalar");
 const [search,setSearch]=useState(""),[key,setKey]=useState("TEAM_NAME");
 const [rules,setRules]=useState<Rule[]>([]);
 const [chartType,setChartType]=useState<ChartType>("bar");
 const [chartTags,setChartTags]=useState<string[]>([]);
 const [last,setLast]=useState(6),[explicitLast,setExplicitLast]=useState(false);
 const [style,setStyle]=useState("");
 const [indicators,setIndicators]=useState<Indicator[]>([]);
 const [styles,setStyles]=useState<ChartStyle[]>([]);
 const [catalogError,setCatalogError]=useState(false),[styleError,setStyleError]=useState(false);
 const [loading,setLoading]=useState(false),[copied,setCopied]=useState(false),[copyFailed,setCopyFailed]=useState(false);
 const opener=useRef<HTMLButtonElement>(null),dialog=useRef<HTMLDivElement>(null);
 const selected=new Set(indicators.map(i=>i.tag));
 const options=useMemo(()=>{
  const scalars=officeScalarDefinitions.filter(x=>!x.key.includes("<")).map(x=>({value:x.key,label:locale==="fr"?x.fr:x.en,description:x.key}));
  const dynamic=indicators.map(x=>({value:x.tag,label:x.name,description:x.tag}));
  const rows=officeRowDefinitions.map(x=>({value:x.source,label:locale==="fr"?x.fr:x.en,description:x.source}));
  const charts=officeChartDefinitions.map(x=>({value:x.type,label:locale==="fr"?x.fr:x.en,description:x.type}));
  const all=family==="scalar"?scalars:family==="indicator"?dynamic:family==="row"?rows:charts;
  const q=search.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase();
  return all.filter(x=>(x.label+" "+x.description).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase().includes(q));
 },[family,indicators,locale,search]);
 const currentRow=officeRowDefinitions.find(x=>x.source===key);
 const currentFields=currentRow?.fields??[];
 const computed=serializeOfficeTag({family,key,rules,
  allowedFields:currentFields,
  chart:{type:chartType,tags:chartTags,last,style,explicitLast,explicitType:chartType!=="bar"}});
 const canCopy=!!computed&&options.some(x=>x.value===key)&&
  (family!=="indicator"||!!teamId&&selected.has(key))&&
  (family!=="chart"||(!catalogError&&!loading&&(style===""||!styleError)&&(!chartTags.length||chartTags.every(x=>selected.has(x)))));
 function selectFamily(next:Family){
  setFamily(next);setSearch("");setKey(next==="scalar"?"TEAM_NAME":next==="row"?"MEMBERS_ACTIVE":next==="chart"?"bar":"");
  setRules([]);setChartTags([]);setChartType("bar");setLast(6);setExplicitLast(false);setStyle("");
  setCopied(false);setCopyFailed(false);
 }
 useEffect(()=>{
  if(!open)return;
  let alive=true;
  setLoading(true);setCatalogError(false);setStyleError(false);
  void Promise.allSettled([
   teamId?fetch("/api/admin/indicators/catalog?teamId="+encodeURIComponent(teamId),{cache:"no-store"}).then(async r=>{
    if(!r.ok)throw Error("catalog");const data=await r.json() as Catalog;
    const ids=new Set(data.selections.filter(s=>s.is_active).map(s=>s.indicator_id));
    if(alive)setIndicators(data.definitions.filter(x=>ids.has(x.id)&&x.archived_at===null&&fieldName.test(x.tag)));
   }):Promise.resolve(),
   fetch("/api/admin/reports/chart-styles",{cache:"no-store"}).then(async r=>{
    if(!r.ok)throw Error("styles");
    const data=await r.json() as {styles?:ChartStyle[]};
    if(!Array.isArray(data.styles))throw Error("styles");
    if(alive)setStyles(data.styles.filter(x=>/^[a-z][a-z0-9-]{2,63}$/.test(x.id)));
   })
  ]).then(results=>{
   if(!alive)return;
   if(results[0].status==="rejected")setCatalogError(true);
   if(results[1].status==="rejected")setStyleError(true);
   setLoading(false);
  });
  return()=>{alive=false};
 },[open,teamId]);
 useEffect(()=>{
  if(!open)return;
  const previous=document.activeElement as HTMLElement|null;
  const frame=requestAnimationFrame(()=>dialog.current?.querySelector<HTMLElement>("button[data-close]")?.focus());
  function onKey(event:KeyboardEvent){
   if(event.key==="Escape"){event.preventDefault();setOpen(false);return;}
   if(event.key!=="Tab"||!dialog.current)return;
   const elements=[...dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]),select:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex="0"]')];
   if(!elements.length)return;
   const first=elements[0],end=elements[elements.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();end.focus();}
   else if(!event.shiftKey&&document.activeElement===end){event.preventDefault();first.focus();}
  }
  document.addEventListener("keydown",onKey);
  return()=>{cancelAnimationFrame(frame);document.removeEventListener("keydown",onKey);(opener.current??previous)?.focus();}
 },[open]);
 async function copy(value:string){
  setCopyFailed(false);setCopied(false);
  try{await navigator.clipboard.writeText(value);setCopied(true);}
  catch{setCopyFailed(true);}
 }
 const list=options;
 return <>
  <button ref={opener} type="button" className="btn btn-primary btn-sm" onClick={()=>{setOpen(true);selectFamily("scalar");}}>
   <span aria-hidden="true">⚙ </span>{tr("Open")}
  </button>
  {open&&<div className="modal d-block" role="presentation" style={{backgroundColor:"rgba(0,0,0,.6)",zIndex:1090}}>
   <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
    <div ref={dialog} className="modal-content" role="dialog" aria-modal="true" aria-labelledby="smn-tag-config-title">
     <div className="modal-header">
      <div><h2 className="modal-title fs-5" id="smn-tag-config-title">{tr("Title")}</h2><p className="text-secondary small mb-0">{tr("Intro")}</p></div>
      <button data-close type="button" className="btn-close" aria-label={tr("Close")} onClick={()=>setOpen(false)}/>
     </div>
     <div className="modal-body d-grid gap-3">
      <fieldset><legend className="h6">{tr("Family")}</legend><div className="d-flex flex-wrap gap-2">
       {(["scalar","indicator","row","chart"] as Family[]).map(f=><button key={f} type="button"
        className={"btn btn-sm "+(family===f?"btn-primary":"btn-outline-secondary")}
        aria-pressed={family===f} onClick={()=>selectFamily(f)}>{tr("Family"+f)}</button>)}
      </div></fieldset>
      <label className="form-label">{tr("Search")}
       <input type="search" className="form-control" value={search} onChange={e=>setSearch(e.target.value)}/>
      </label>
      {family==="indicator"&&!teamId&&<p className="alert alert-warning mb-0" role="status">{tr("TeamRequired")}</p>}
      {loading&&(family==="indicator"||family==="chart")&&<p role="status">{tr("Loading")}</p>}
      {catalogError&&(family==="indicator"||family==="chart")&&<p className="alert alert-danger" role="alert">{tr("CatalogError")}</p>}
      {styleError&&family==="chart"&&<p className="alert alert-warning" role="alert">{tr("StyleError")}</p>}
      {!list.length&&<p role="status">{tr("Empty")}</p>}
      {!!list.length&&<label className="form-label">{tr("Selection")}
       <select className="form-select" value={list.some(x=>x.value===key)?key:""} onChange={e=>{
        setKey(e.target.value);setRules([]);setCopied(false);
        if(family==="chart")setChartType(e.target.value as ChartType);
       }}>
        {!list.some(x=>x.value===key)&&<option value="">{tr("Choose")}</option>}
        {list.map(x=><option key={x.value} value={x.value}>{x.label} ({x.value})</option>)}
       </select>
      </label>}
      {family==="row"&&currentRow&&<div className="border rounded p-3 d-grid gap-2">
       <h3 className="h6 mb-0">{tr("Sort")}</h3>
       <p className="small text-secondary mb-0">{tr("SortHint")}</p>
       {rules.map((rule,i)=><div key={rule.field} className="d-flex gap-2 align-items-center flex-wrap">
        <span className="small">{i+1}.</span>
        <select className="form-select form-select-sm w-auto flex-grow-1" aria-label={tr("Column")} value={rule.field}
         onChange={e=>setRules(prev=>prev.map((r,j)=>j===i?{...r,field:e.target.value}:r))}>
         {currentFields.filter(x=>x===rule.field||!rules.some(r=>r.field===x)).map(x=><option key={x} value={x}>{x}</option>)}
        </select>
        <select className="form-select form-select-sm w-auto" aria-label={tr("Direction")} value={rule.direction}
         onChange={e=>setRules(prev=>prev.map((r,j)=>j===i?{...r,direction:e.target.value as "ASC"|"DESC"}:r))}>
         <option value="ASC">{tr("Asc")}</option><option value="DESC">{tr("Desc")}</option>
        </select>
        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={i===0} onClick={()=>setRules(prev=>prev.map((r,j)=>j===i-1?prev[i]:j===i?prev[i-1]:r))} aria-label={tr("Up")}>↑</button>
        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={i===rules.length-1} onClick={()=>setRules(prev=>prev.map((r,j)=>j===i+1?prev[i]:j===i?prev[i+1]:r))} aria-label={tr("Down")}>↓</button>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={()=>setRules(prev=>prev.filter((_,j)=>j!==i))} aria-label={tr("Remove")}>×</button>
       </div>)}
       <button type="button" className="btn btn-outline-primary btn-sm align-self-start" disabled={rules.length>=currentFields.length}
        onClick={()=>setRules(prev=>[...prev,{field:currentFields.find(x=>!prev.some(r=>r.field===x))!,direction:"ASC"}])}>{tr("AddSort")}</button>
       <h3 className="h6 mt-2 mb-0">{tr("Columns")}</h3>
       <div className="d-flex flex-wrap gap-2">{currentFields.map(field=><button className="btn btn-outline-secondary btn-sm" type="button" key={field}
        title={tr("CopyColumn")} onClick={()=>void copy("{{"+field+"}}")}>{field}</button>)}</div>
      </div>}
      {family==="chart"&&<div className="border rounded p-3 d-grid gap-3">
       <div><label className="form-label">{tr("ChartType")}
        <select className="form-select" value={chartType} onChange={e=>{const next=e.target.value as ChartType;setChartType(next);setKey(next);setChartTags(old=>next==="gauge"?old.slice(0,1):old);if(["pie","donut","gauge"].includes(next))setExplicitLast(false);}}>
         {officeChartDefinitions.map(x=><option key={x.type} value={x.type}>{locale==="fr"?x.fr:x.en}</option>)}
        </select></label></div>
       <fieldset><legend className="h6">{tr("Series")}</legend>
        <p className="small text-secondary">{tr("SeriesHint")}</p>
        {!indicators.length&&<p className="small">{tr("EmptyIndicators")}</p>}
        <div className="d-flex flex-wrap gap-2">{indicators.map(x=><label key={x.id} className="border rounded px-2 py-1">
         <input className="form-check-input me-2" type="checkbox" checked={chartTags.includes(x.tag)}
          disabled={!chartTags.includes(x.tag)&&(chartTags.length>=6||(chartType==="gauge"&&chartTags.length>=1))}
          onChange={e=>setChartTags(prev=>e.target.checked?[...prev,x.tag]:prev.filter(v=>v!==x.tag))}/> {x.name} ({x.tag})
        </label>)}</div>
       </fieldset>
       {!["pie","donut","gauge"].includes(chartType)&&<div>
        <label className="form-check-label"><input className="form-check-input me-2" type="checkbox" checked={explicitLast} onChange={e=>setExplicitLast(e.target.checked)}/>{tr("LastEnabled")}</label>
        {explicitLast&&<label className="form-label d-block">{tr("Last")}<input type="number" className="form-control" min="1" max="24" value={last} onChange={e=>setLast(Number(e.target.value))}/></label>}
       </div>}
       <label className="form-label">{tr("Style")}
        <select className="form-select" value={style} onChange={e=>setStyle(e.target.value)}>
         <option value="">{tr("StyleDefault")}</option><option value="legacy">legacy</option>
         {styles.filter(x=>x.id!=="legacy").map(x=><option value={x.id} key={x.id}>{x.name}</option>)}
        </select>
       </label>
       {chartType==="gauge"&&<p className="small text-secondary mb-0">{tr("GaugeHint")}</p>}
       {["pie","donut"].includes(chartType)&&<p className="small text-secondary mb-0">{tr("PieHint")}</p>}
       <p className="small text-secondary mb-0">{tr("ChartPlacement")}</p>
      </div>}
      <div className="border rounded p-3 d-grid gap-2">
       <h3 className="h6 mb-0">{tr("Generated")}</h3>
       <code className="d-block text-break user-select-all" aria-live="polite" style={{whiteSpace:"pre-wrap"}}>{canCopy?computed:tr("Unavailable")}</code>
       {copyFailed&&<p className="text-danger small mb-0" role="alert">{tr("CopyError")}</p>}
       {copied&&<p className="text-success small mb-0" role="status">{tr("Copied")}</p>}
      </div>
     </div>
     <div className="modal-footer">
      <button className="btn btn-outline-secondary" type="button" onClick={()=>selectFamily(family)}>{tr("Reset")}</button>
      <button className="btn btn-outline-secondary" type="button" onClick={()=>setOpen(false)}>{tr("Close")}</button>
      <button className="btn btn-primary" type="button" disabled={!canCopy} onClick={()=>void copy(computed)}>{tr("Copy")}</button>
     </div>
    </div>
   </div>
  </div>}
 </>;
}
