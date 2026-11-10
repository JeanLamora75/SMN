"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
export type SharedChartType="bar"|"line"|"area"|"pie"|"donut"|"gauge";
export type SharedChartPayload={
 type:SharedChartType;locale:"fr"|"en";cycles:{name:string}[];
 series:{name:string;unit:string;values:(number|null)[]}[];
};
type Style={id:string;name:string};
type Catalog={styles:Style[];defaults:Record<SharedChartType,{styleId:string}>};
export default function SharedTrendChart({payload,downloadName}:{payload:SharedChartPayload;downloadName:string}){
 const t=useTranslation();
 const tr=(key:"style"|"loading"|"unavailable"|"download"|"default")=>t(("indicators.sharedChart."+key) as Parameters<typeof t>[0]);
 const [catalog,setCatalog]=useState<Catalog|null>(null);
 const [catalogError,setCatalogError]=useState(false);
 const [chosen,setChosen]=useState("");
 const [url,setUrl]=useState("");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/admin/reports/chart-styles",{signal:controller.signal,cache:"no-store"})
   .then(async r=>{if(!r.ok)throw Error("styles");return r.json() as Promise<Catalog>;})
   .then(data=>{if(!controller.signal.aborted&&Array.isArray(data.styles)&&data.defaults){setCatalog(data);setCatalogError(false);}})
   .catch(()=>{if(!controller.signal.aborted)setCatalogError(true);});
  return()=>controller.abort();
 },[]);
 const styleId=chosen||catalog?.defaults?.[payload.type]?.styleId||"";
 const payloadKey=JSON.stringify(payload);
 useEffect(()=>{
  if(!styleId)return;
  const controller=new AbortController();let objectUrl="";
  void fetch("/api/admin/reports/charts/render",{method:"POST",signal:controller.signal,
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({...payload,styleId})
  }).then(async r=>{if(!r.ok)throw Error("chart");return r.blob();})
   .then(blob=>{
    if(controller.signal.aborted)return;
    objectUrl=URL.createObjectURL(blob);
    setUrl(objectUrl);setLoading(false);setError(false);
   })
   .catch(()=>{if(!controller.signal.aborted){setError(true);setLoading(false);setUrl("");}});
  return()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 // payloadKey tracks any data, interval or chart-type change. JSON keeps dependency stable
 // when the caller rebuilds an equivalent array while rendering.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[payloadKey,styleId]);
 function save(){
  if(!url)return;
  const a=document.createElement("a");a.href=url;a.download=downloadName+".png";a.click();
 }
 return <div className="border rounded-3 p-2 p-md-3 my-3">
  <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-3">
   <label className="form-label mb-0">{tr("style")}
    <select className="form-select form-select-sm mt-1" disabled={!catalog} value={chosen}
     onChange={e=>{setChosen(e.target.value);setLoading(true);setUrl("");}}>
     <option value="">{tr("default")}</option>
     {catalog?.styles.map(style=><option key={style.id} value={style.id}>{style.name}</option>)}
    </select>
   </label>
   <button type="button" className="btn btn-outline-primary btn-sm" disabled={!url||loading} onClick={save}>{tr("download")}</button>
  </div>
  {catalogError&&<p className="alert alert-warning" role="alert">{tr("unavailable")}</p>}
  {!catalogError&&loading&&<p role="status">{tr("loading")}</p>}
  {error&&<p role="alert" className="alert alert-warning">{tr("unavailable")}</p>}
  {url&&!loading&&<img src={url} alt={payload.series.map(s=>s.name).join(", ")} className="w-100 h-auto d-block"/>}
 </div>;
}
