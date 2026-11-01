"use client";
import {useEffect,useRef,useState} from "react";
type Definition={id:string;tag:string;name:string;unit:string;style:string;order:number};
type Cycle={id:string;name:string;status:string;values:Record<string,string|null>};
type Report={columns:Definition[];cycles:Cycle[]};
export default function IndicatorReporting({teamId,cycleType,screen,locale}:{teamId:string;cycleType:"scrum"|"kanban";screen:"cycle_list"|"trends"|"dashboard";locale:"fr"|"en"}){
 const [data,setData]=useState<Report|null>(null),[error,setError]=useState(false),[chosen,setChosen]=useState("");
 const ref=useRef<SVGSVGElement>(null);
 const t=(fr:string,en:string)=>locale==="fr"?fr:en;
 useEffect(()=>{const ctrl=new AbortController();
  void fetch("/api/admin/indicators/reporting?"+new URLSearchParams({teamId,cycleType,screen}),{cache:"no-store",signal:ctrl.signal})
  .then(async r=>{if(!r.ok)throw Error("unavailable");return r.json() as Promise<Report>})
  .then(x=>{if(!ctrl.signal.aborted){setData(x);setError(false);}})
  .catch(()=>{if(!ctrl.signal.aborted)setError(true);});
  return()=>ctrl.abort();
 },[teamId,cycleType,screen]);
 const definition=data?.columns.find(c=>c.id===chosen)??data?.columns[0];
 const values=data?.cycles.map(c=>{const raw=definition?c.values[definition.id]:null;return raw!=null&&raw!==""&&Number.isFinite(Number(raw))?Number(raw):null;})??[];
 const valid=values.filter((x):x is number=>x!==null);
 const min=Math.min(0,...valid),max=Math.max(1,...valid),range=Math.max(1,max-min);
 const points=values.map((v,i)=>({x:75+(i+0.5)*770/Math.max(1,values.length),y:v===null?null:290-(v-min)/range*205,value:v}));
 const line=points.map((p,i)=>p.y===null?null:{p,i}).filter((x):x is {p:typeof points[number];i:number}=>x!==null);
 async function savePng(){if(!ref.current)return;let url="";
  try{const svg=ref.current.cloneNode(true) as SVGSVGElement;
   svg.querySelectorAll<SVGElement>("[data-theme-color]").forEach(node=>{node.setAttribute("fill","#334155");});
   url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:"image/svg+xml"}));
   const image=new Image();image.src=url;await image.decode();
   const canvas=document.createElement("canvas");canvas.width=1600;canvas.height=720;const ctx=canvas.getContext("2d");if(!ctx)throw Error("canvas");
   ctx.fillStyle="#ffffff";ctx.fillRect(0,0,1600,720);ctx.drawImage(image,0,0,1600,720);
   const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/png"));if(!blob)throw Error("png");
   const download=URL.createObjectURL(blob),a=document.createElement("a");a.href=download;a.download="indicateurs-"+definition?.tag+".png";a.click();URL.revokeObjectURL(download);
  }catch{setError(true);}finally{if(url)URL.revokeObjectURL(url);}
 }
 return <section className="smn-panel rounded-4 p-3 my-3" aria-label={t("Indicateurs configurés","Configured indicators")}>
  <h2 className="h5">{t("Indicateurs configurés","Configured indicators")}</h2>
  {error&&<p role="alert" className="alert alert-warning">{t("Indicateurs indisponibles","Indicators unavailable")}</p>}
  {!data&&!error&&<p role="status">{t("Chargement","Loading")}</p>}
  {data?.columns.length===0&&<p role="status">{t("Aucun indicateur sélectionné pour cet écran","No indicator selected for this screen")}</p>}
  {screen==="trends"&&definition&&<>
   <div className="d-flex gap-2 align-items-end flex-wrap mb-3">
    <label className="form-label">{t("Indicateur","Indicator")}<select className="form-select" value={definition.id} onChange={e=>setChosen(e.target.value)}>{data!.columns.map(c=><option key={c.id} value={c.id}>{c.tag} — {c.name}</option>)}</select></label>
    <button type="button" className="btn btn-outline-primary" disabled={!valid.length} onClick={()=>void savePng()}>{t("Exporter PNG","Export PNG")}</button>
   </div>
   <svg ref={ref} viewBox="0 0 960 360" xmlns="http://www.w3.org/2000/svg" className="w-100" role="img" aria-label={definition.name}>
    <rect width="960" height="360" fill="#ffffff"/><text x="480" y="35" fontSize="18" textAnchor="middle" fill="#334155">{definition.tag} — {definition.name} ({definition.unit})</text>
    {[0,.25,.5,.75,1].map(n=><line key={n} x1="75" x2="845" y1={290-n*205} y2={290-n*205} stroke="#dddddd"/>)}
    {points.map((p,i)=>p.y!==null&&i>0&&points[i-1].y!==null?<line key={"l"+i} x1={points[i-1].x} y1={points[i-1].y!} x2={p.x} y2={p.y} stroke="#2563eb" strokeWidth="3"/>:null)}
    {line.map(({p,i})=><circle key={i} cx={p.x} cy={p.y!} r="4" fill="#2563eb"><title>{data!.cycles[i].name}: {p.value} {definition.unit}</title></circle>)}
    {points.map((p,i)=><text key={"x"+i} x={p.x} y="314" fontSize="10" fill="#334155" textAnchor="middle">{i+1}</text>)}
   </svg>
  </>}
  {data&&data.columns.length>0&&<div className="table-responsive"><table className="table table-striped align-middle">
   <thead><tr><th>{t("Cycle","Cycle")}</th><th>{t("Statut","Status")}</th>{(screen==="trends"?definition?[definition]:[]:data.columns).map(c=><th className="text-end" scope="col" key={c.id} title={c.name} tabIndex={0}>{c.tag}</th>)}</tr></thead>
   <tbody>{data.cycles.map(c=><tr key={c.id}><th>{c.name}</th><td>{c.status}</td>{(screen==="trends"?definition?[definition]:[]:data.columns).map(d=><td className="text-end" key={d.id}>{c.values[d.id]??"—"}{c.values[d.id]!=null&&d.unit?" "+d.unit:""}</td>)}</tr>)}</tbody>
  </table></div>}
 </section>;
}
