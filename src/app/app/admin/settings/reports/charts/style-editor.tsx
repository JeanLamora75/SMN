"use client";
import Link from "next/link";
import {useCallback,useEffect,useRef,useState,type ReactNode} from "react";
import {useLocale,useTranslation} from "@/i18n/client";
import type {TranslationKey} from "@/i18n/catalog";
import {CHART_TYPES,type ChartStyleConfig,type ChartType,validChartStyleConfig} from "@/server/reports/chart-style-contract";
import {validGalleryCatalog,type GalleryStyle,type GalleryCatalog} from "@/lib/chart-style-gallery";

const BACK="/app/admin/settings/reports/charts";
const API="/api/admin/reports/chart-styles";
const PREVIEW="/api/admin/reports/chart-styles/preview";
type EditorStatus="fresh"|"stale"|"ready"|"loading"|"error";
const title=(type:ChartType):TranslationKey=>("chartStyles.gallery.types."+type) as TranslationKey;
function parseNumber(input:string,min:number,max:number):number{
 const value=Number(input);
 return Number.isFinite(value)?Math.min(max,Math.max(min,value)):min;
}
function parseThresholds(value:string,min:number,max:number):number[]{
 const values=value.trim()?value.split(",").map(x=>Number(x.trim())):[];
 if(values.length>5||values.some(v=>!Number.isInteger(v)||v<min||v>max)||
  values.some((v,i)=>i>0&&v<=values[i-1]))throw Error("invalid-input");
 return values;
}
function Field({label,children}:{label:string;children:ReactNode}){
 return <label className="smn-chart-editor-field"><span className="form-label">{label}</span>{children}</label>;
}
function NumberField({label,value,min,max,onChange,step=1,disabled=false}:{
 label:string;value:number;min:number;max:number;step?:number;disabled?:boolean;onChange:(n:number)=>void
}){
 return <Field label={label}><input className="form-control" type="number" min={min} max={max} step={step}
  value={value} disabled={disabled} onChange={e=>onChange(parseNumber(e.target.value,min,max))}/></Field>;
}
function CheckField({label,checked,onChange,disabled=false}:{
 label:string;checked:boolean;disabled?:boolean;onChange:(v:boolean)=>void
}){
 return <label className="smn-chart-editor-check"><input type="checkbox" className="form-check-input"
  checked={checked} disabled={disabled} onChange={e=>onChange(e.target.checked)}/><span>{label}</span></label>;
}
function SelectField<T extends string>({label,value,options,onChange,disabled=false}:{
 label:string;value:T;options:readonly {value:T;label:string}[];
 disabled?:boolean;onChange:(v:T)=>void
}){
 return <Field label={label}><select className="form-select" disabled={disabled} value={value}
  onChange={e=>onChange(e.target.value as T)}>
  {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
 </select></Field>;
}
function localError(code:string,t:(k:TranslationKey)=>string){
 const map:Record<string,TranslationKey>={
  "invalid-input":"chartStyles.invalidInput","forbidden":"chartStyles.forbidden",
  "not-found":"chartStyles.notFound","conflict":"chartStyles.conflict",
  "protected-style":"chartStyles.protectedStyle","schema-not-ready":"chartStyles.schemaNotReady",
  "service-unavailable":"chartStyles.serviceUnavailable"
 };
 return t(map[code]??"chartStyles.editor.previewError");
}
export default function ChartStyleEditor({id,canEdit}:{id:string;canEdit:boolean}){
 const t=useTranslation();
 const locale=useLocale();
 const tr=(name:string)=>t(("chartStyles.editor."+name) as TranslationKey);
 const [original,setOriginal]=useState<GalleryStyle|null>(null);
 const [draft,setDraft]=useState<ChartStyleConfig|null>(null);
 const [name,setName]=useState("");
 const [description,setDescription]=useState("");
 const [type,setType]=useState<ChartType>("bar");
 const [preview,setPreview]=useState<string|null>(null);
 const previewUrl=useRef<string|null>(null);
 const [previewStatus,setPreviewStatus]=useState<EditorStatus>("fresh");
 const [loading,setLoading]=useState(true);
 const [working,setWorking]=useState(false);
 const [error,setError]=useState("");
 const [success,setSuccess]=useState("");
 const [thresholdInput,setThresholdInput]=useState("");
 const [thresholdError,setThresholdError]=useState(false);
 const [reloadSignal,setReloadSignal]=useState(0);
 const saved=original!==null&&draft!==null&&
  original.name===name&&original.description===description&&
  JSON.stringify(original.config)===JSON.stringify(draft);
 const dirty=original!==null&&!saved;
 const editable=canEdit&&original?.source==="custom";
 const discard=useCallback(()=>{if(dirty)return window.confirm(tr("discardConfirm"));return true;},[dirty,t]);
 useEffect(()=>{
  let alive=true;
  void (async()=>{
   setLoading(true);setError("");
   try{
    const response=await fetch(API,{cache:"no-store"});
    const raw=await response.json().catch(()=>({})) as unknown;
    if(!response.ok)throw Error((raw as {error?:string})?.error??"service-unavailable");
    if(!validGalleryCatalog(raw))throw Error("service-unavailable");
    const item=(raw as GalleryCatalog).styles.find(s=>s.id===id);
    if(!item)throw Error("not-found");
    if(alive){
     setOriginal(item);setDraft(structuredClone(item.config));
     setName(item.name);setDescription(item.description);
     setThresholdInput(item.config.types.gauge.thresholds.join(", "));
     setThresholdError(false);setPreviewStatus("fresh");setSuccess("");
     if(previewUrl.current)URL.revokeObjectURL(previewUrl.current);
     previewUrl.current=null;setPreview(null);
    }
   }catch(cause){if(alive)setError(cause instanceof Error?cause.message:"service-unavailable")}
   finally{if(alive)setLoading(false)}
  })();
  return()=>{alive=false};
 },[id,reloadSignal]);
 useEffect(()=>{
  const warn=(event:BeforeUnloadEvent)=>{
   if(!dirty)return;event.preventDefault();event.returnValue="";
  };
  window.addEventListener("beforeunload",warn);
  return()=>window.removeEventListener("beforeunload",warn);
 },[dirty]);
 useEffect(()=>()=>{if(previewUrl.current)URL.revokeObjectURL(previewUrl.current);},[]);
 function mutate(fn:(d:ChartStyleConfig)=>void){
  if(!editable)return;
  setDraft(current=>{
   if(!current)return current;
   const next=structuredClone(current);fn(next);return next;
  });
  setPreviewStatus("stale");setError("");setSuccess("");
 }
 function changeType(next:ChartType){setType(next);setPreviewStatus(preview?"stale":"fresh");}
 async function refreshPreview(){
  if(!draft||working||thresholdError)return;
  if(!validChartStyleConfig(draft)){setError("invalid-input");return;}
  setWorking(true);setError("");setPreviewStatus("loading");
  try{
   const response=await fetch(PREVIEW,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({type,config:draft,locale})});
   if(!response.ok){
    const detail=await response.json().catch(()=>({})) as {error?:string};
    throw Error(detail.error??"preview-unavailable");
   }
   const blob=await response.blob();
   if(blob.type!=="image/png")throw Error("preview-unavailable");
   const url=URL.createObjectURL(blob);
   if(previewUrl.current)URL.revokeObjectURL(previewUrl.current);
   previewUrl.current=url;setPreview(url);setPreviewStatus("ready");
  }catch(cause){setPreviewStatus("error");setError(cause instanceof Error?cause.message:"preview-unavailable")}
  finally{setWorking(false)}
 }
 async function save(){
  if(!draft||!original||!editable||working||!dirty||thresholdError)return;
  if(!validChartStyleConfig(draft)||!name.trim()||name.length>120||description.length>500){
   setError("invalid-input");return;
  }
  setWorking(true);setError("");setSuccess("");
  try{
   const response=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action:"update",id:original.id,revision:original.revision,
     name:name.trim(),description:description.trim(),config:draft})});
   if(!response.ok){
    const detail=await response.json().catch(()=>({})) as {error?:string};
    throw Error(detail.error??"service-unavailable");
   }
   const latest=await fetch(API,{cache:"no-store"});
   const data=await latest.json().catch(()=>({})) as unknown;
   if(!latest.ok||!validGalleryCatalog(data))throw Error("service-unavailable");
   const item=data.styles.find(s=>s.id===id);
   if(!item)throw Error("not-found");
   setOriginal(item);setDraft(structuredClone(item.config));setName(item.name);setDescription(item.description);
   setSuccess(tr("saved"));setPreviewStatus("stale");
  }catch(cause){setError(cause instanceof Error?cause.message:"service-unavailable")}
  finally{setWorking(false)}
 }
 const select=(key:string,values:readonly string[])=>values.map(value=>({value,label:tr(key+"."+value)}));
 return <div className="smn-chart-m2">
  <nav aria-label={tr("breadcrumb")}>
   <Link href={BACK} className="btn btn-link px-0" onClick={e=>{if(!discard())e.preventDefault()}}>{tr("back")}</Link>
  </nav>
  <header className="smn-chart-style-hero mb-4">
   <p className="smn-chart-style-eyebrow">COCKPIT AGILE · M2</p>
   <h1>{tr("heading")}</h1>
   <p>{tr("intro")}</p>
  </header>
  {loading&&<p role="status" className="smn-panel p-4">{tr("loading")}</p>}
  {error&&<p role="alert" className="alert alert-warning">{localError(error,t)}
   {error==="conflict"&&<button className="btn btn-outline-secondary btn-sm ms-2"
     type="button" onClick={()=>{if(discard())setReloadSignal(x=>x+1)}}>{tr("reload")}</button>}
  </p>}
  {success&&<p role="status" className="alert alert-success">{success}</p>}
  {draft&&original&&<>
   <div className="smn-chart-m2-title">
    <div><h2 className="h4 mb-1">{original.name}</h2>
     <span className="text-secondary small">{original.source==="builtin"?tr("builtin"):tr("custom")}</span>
     {dirty&&<span className="badge text-bg-warning ms-2">{tr("unsaved")}</span>}</div>
    {original.source==="builtin"&&<p className="mb-0 small text-secondary">{tr("builtinHint")}</p>}
   </div>
   <div className="smn-chart-m2-columns">
    <section className="smn-panel smn-chart-m2-fields" aria-label={tr("settings")}>
     <details open><summary>{tr("identity")}</summary><div className="smn-chart-m2-section">
      <Field label={tr("name")}><input className="form-control" value={name} maxLength={120} disabled={!editable||working}
       onChange={e=>{setName(e.target.value);setPreviewStatus("stale")}}/></Field>
      <Field label={tr("description")}><textarea className="form-control" rows={2} value={description}
       maxLength={500} disabled={!editable||working}
       onChange={e=>{setDescription(e.target.value);setPreviewStatus("stale")}}/></Field>
     </div></details>
     <details open><summary>{tr("common")}</summary><div className="smn-chart-m2-section">
      <div className="smn-chart-m2-fields-grid">
       <Field label={tr("background")}><input type="color" className="form-control form-control-color"
        value={draft.common.background} disabled={!editable||working}
        onChange={e=>mutate(d=>{d.common.background=e.target.value})}/></Field>
       <Field label={tr("textColor")}><input type="color" className="form-control form-control-color"
        value={draft.common.textColor} disabled={!editable||working}
        onChange={e=>mutate(d=>{d.common.textColor=e.target.value})}/></Field>
       <SelectField label={tr("fontFamily")} value={draft.common.fontFamily}
        options={["Arial","Segoe UI","Calibri"].map(value=>({value:value as ChartStyleConfig["common"]["fontFamily"],label:value}))}
        disabled={!editable||working} onChange={v=>mutate(d=>{d.common.fontFamily=v})}/>
       <NumberField label={tr("fontSize")} value={draft.common.fontSize} min={9} max={48}
        disabled={!editable||working} onChange={v=>mutate(d=>{d.common.fontSize=v})}/>
       <NumberField label={tr("spacing")} value={draft.common.spacing} min={0} max={80}
        disabled={!editable||working} onChange={v=>mutate(d=>{d.common.spacing=v})}/>
      </div>
      <div className="smn-chart-m2-fields-grid">
       <Field label={tr("title")}><input className="form-control" maxLength={120} value={draft.common.title}
        disabled={!editable||working} onChange={e=>mutate(d=>{d.common.title=e.target.value})}/></Field>
       <Field label={tr("subtitle")}><input className="form-control" maxLength={160} value={draft.common.subtitle}
        disabled={!editable||working} onChange={e=>mutate(d=>{d.common.subtitle=e.target.value})}/></Field>
      </div>
      <p className="small fw-semibold mt-3 mb-2">{tr("palette")}</p>
      <div className="smn-chart-m2-palette">
       {draft.common.palette.map((color,index)=><Field key={index} label={tr("color")+" "+(index+1)}>
        <input type="color" className="form-control form-control-color" value={color}
         disabled={!editable||working} onChange={e=>mutate(d=>{d.common.palette[index]=e.target.value})}/>
       </Field>)}
       {editable&&draft.common.palette.length<6&&<button type="button" className="btn btn-outline-secondary btn-sm"
        disabled={working} onClick={()=>mutate(d=>{d.common.palette.push("#547bb2")})}>{tr("addColor")}</button>}
       {editable&&draft.common.palette.length>1&&<button type="button" className="btn btn-outline-secondary btn-sm"
        disabled={working} onClick={()=>mutate(d=>{d.common.palette.pop()})}>{tr("removeColor")}</button>}
      </div>
      <div className="smn-chart-m2-fields-grid mt-3">
       <SelectField label={tr("legendPosition")} value={draft.common.legend.position}
        options={select("legend",["bottom","right","none"]) as {value:"bottom"|"right"|"none";label:string}[]}
        disabled={!editable||working} onChange={v=>mutate(d=>{d.common.legend.position=v})}/>
       <NumberField label={tr("decimals")} min={0} max={2} value={draft.common.labels.decimals}
        disabled={!editable||working} onChange={v=>mutate(d=>{d.common.labels.decimals=v})}/>
      </div>
      <CheckField label={tr("showLegend")} checked={draft.common.legend.visible}
       disabled={!editable||working} onChange={v=>mutate(d=>{d.common.legend.visible=v})}/>
      <CheckField label={tr("showLabels")} checked={draft.common.labels.visible}
       disabled={!editable||working} onChange={v=>mutate(d=>{d.common.labels.visible=v})}/>
     </div></details>
     <details open><summary>{tr("specific")}</summary><div className="smn-chart-m2-section">
      <Field label={tr("chartType")}><select className="form-select" value={type}
       onChange={e=>changeType(e.target.value as ChartType)}>
       {CHART_TYPES.map(item=><option value={item} key={item}>{t(title(item))}</option>)}
      </select></Field>
      <div className="smn-chart-m2-specific">
       {type==="bar"&&<>
        <SelectField label={tr("orientation")} value={draft.types.bar.orientation}
         options={select("orientationOptions",["vertical","horizontal"]) as {value:"vertical"|"horizontal";label:string}[]}
         disabled={!editable||working} onChange={v=>mutate(d=>{d.types.bar.orientation=v})}/>
        <SelectField label={tr("barMode")} value={draft.types.bar.mode}
         options={select("barModes",["grouped","stacked"]) as {value:"grouped"|"stacked";label:string}[]}
         disabled={!editable||working} onChange={v=>mutate(d=>{d.types.bar.mode=v})}/>
        <NumberField label={tr("gap")} value={draft.types.bar.gap} min={0} max={90}
         disabled={!editable||working} onChange={v=>mutate(d=>{d.types.bar.gap=v})}/>
        <NumberField label={tr("radius")} value={draft.types.bar.radius} min={0} max={40}
         disabled={!editable||working} onChange={v=>mutate(d=>{d.types.bar.radius=v})}/>
       </>}
       {type==="line"&&<>
        <NumberField label={tr("strokeWidth")} value={draft.types.line.strokeWidth} min={1} max={12}
         disabled={!editable||working} onChange={v=>mutate(d=>{d.types.line.strokeWidth=v})}/>
        <SelectField label={tr("marker")} value={draft.types.line.marker}
         options={select("markers",["circle","square","none"]) as {value:"circle"|"square"|"none";label:string}[]}
         disabled={!editable||working} onChange={v=>mutate(d=>{d.types.line.marker=v})}/>
        <CheckField label={tr("smooth")} checked={draft.types.line.smooth}
         disabled={!editable||working} onChange={v=>mutate(d=>{d.types.line.smooth=v})}/>
       </>}
       {type==="area"&&<>
        <NumberField label={tr("opacity")} value={draft.types.area.opacity} min={0} max={1} step={0.05}
         disabled={!editable||working} onChange={v=>mutate(d=>{d.types.area.opacity=v})}/>
        <CheckField label={tr("stacked")} checked={draft.types.area.stacked}
         disabled={!editable||working} onChange={v=>mutate(d=>{d.types.area.stacked=v})}/>
       </>}
       {type==="pie"&&<>
        <NumberField label={tr("separation")} min={0} max={15} value={draft.types.pie.separation}
         disabled={!editable||working} onChange={v=>mutate(d=>{d.types.pie.separation=v})}/>
        <CheckField label={tr("showPercent")} checked={draft.types.pie.showPercent}
         disabled={!editable||working} onChange={v=>mutate(d=>{d.types.pie.showPercent=v})}/>
       </>}
       {type==="donut"&&<>
        <NumberField label={tr("innerRadius")} min={20} max={80} value={draft.types.donut.innerRadiusPercent}
         disabled={!editable||working} onChange={v=>mutate(d=>{d.types.donut.innerRadiusPercent=v})}/>
        <CheckField label={tr("centerValue")} checked={draft.types.donut.showCenterValue}
         disabled={!editable||working} onChange={v=>mutate(d=>{d.types.donut.showCenterValue=v})}/>
       </>}
       {type==="gauge"&&<>
        <NumberField label={tr("strokePercent")} min={5} max={50} value={draft.types.gauge.strokePercent}
         disabled={!editable||working} onChange={v=>mutate(d=>{d.types.gauge.strokePercent=v})}/>
        <NumberField label={tr("min")} min={0} max={Math.min(99,draft.types.gauge.max-1)}
         value={draft.types.gauge.min} disabled={!editable||working}
         onChange={v=>mutate(d=>{d.types.gauge.min=v;d.types.gauge.thresholds=[];setThresholdInput("")})}/>
        <NumberField label={tr("max")} min={Math.max(1,draft.types.gauge.min+1)} max={100}
         value={draft.types.gauge.max} disabled={!editable||working}
         onChange={v=>mutate(d=>{d.types.gauge.max=v;d.types.gauge.thresholds=[];setThresholdInput("")})}/>
        <Field label={tr("thresholds")}><input className={"form-control"+(thresholdError?" is-invalid":"")}
         value={thresholdInput} disabled={!editable||working} placeholder="50, 80"
         onChange={e=>{
          const input=e.target.value;setThresholdInput(input);
          try{
           const values=parseThresholds(input,draft.types.gauge.min,draft.types.gauge.max);
           setThresholdError(false);mutate(d=>{d.types.gauge.thresholds=values});
          }catch{setThresholdError(true);setPreviewStatus("stale");}
         }}/></Field>
        {thresholdError&&<p role="alert" className="text-danger small">{tr("thresholdError")}</p>}
       </>}
      </div>
     </div></details>
    </section>
    <aside className="smn-panel smn-chart-m2-preview" aria-label={tr("preview")}>
     <h2 className="h5">{tr("preview")}</h2>
     <p className="small text-secondary">{tr("demoData")}</p>
     <div className="smn-chart-preview-canvas">
      {preview?<img src={preview} alt={tr("previewAlt")} width={960} height={560}/>:
       <p className="text-secondary text-center">{tr("previewPlaceholder")}</p>}
     </div>
     <p role="status" className="small mt-3">{tr(previewStatus==="ready"?"previewReady":
      previewStatus==="loading"?"previewLoading":previewStatus==="error"?"previewError":
      previewStatus==="stale"?"previewStale":"previewPlaceholder")}</p>
     <button type="button" className="btn btn-primary" disabled={working||thresholdError}
      onClick={()=>void refreshPreview()}>{tr("refresh")}</button>
    </aside>
   </div>
   <div className="smn-chart-m2-actions smn-panel p-3 mt-3" role="group" aria-label={tr("actions")}>
    <Link href={BACK} className="btn btn-outline-secondary"
     onClick={e=>{if(!discard())e.preventDefault()}}>{tr("cancel")}</Link>
    {editable&&<button type="button" className="btn btn-primary"
     disabled={!dirty||working||thresholdError} onClick={()=>void save()}>{working?tr("saving"):tr("save")}</button>}
   </div>
  </>}
 </div>;
}
