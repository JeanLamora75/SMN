"use client";
import {useState,type DragEvent} from "react";
import {useTranslation} from "@/i18n/client";

type Indicator={id:string;tag:string;name:string};
type Preference={indicator_id:string;screen_key:string;is_visible:boolean;display_order:number;display_style:string};
type Props={definitions:Indicator[];preferences:Map<string,Preference>;screen:string;teamId:string;busy:boolean;save:(command:Record<string,unknown>)=>Promise<boolean>};

export default function PreferenceOrderTable({definitions,preferences,screen,teamId,busy,save}:Props){
 const t=useTranslation();
 const [dragged,setDragged]=useState<string|null>(null);
 const [over,setOver]=useState<string|null>(null);
 const ordered=definitions.map((d,index)=>({d,index,order:preferences.get(d.id+":"+screen)?.display_order??index}))
  .sort((a,b)=>a.order-b.order||a.index-b.index).map(x=>x.d);
 async function move(from:string,to:string){
  if(busy||from===to)return;
  const ids=ordered.map(d=>d.id),source=ids.indexOf(from),target=ids.indexOf(to);
  if(source<0||target<0)return;
  ids.splice(source,1);ids.splice(target,0,from);
  await save({action:"reorder",teamId,screenKey:screen,indicatorIds:ids});
 }
 function begin(e:DragEvent<HTMLButtonElement>,indicatorId:string){
  if(busy){e.preventDefault();return;}
  setDragged(indicatorId);
  e.dataTransfer.effectAllowed="move";
  e.dataTransfer.setData("text/plain",indicatorId);
 }
 function drop(e:DragEvent<HTMLTableRowElement>,target:string){
  e.preventDefault();
  const source=dragged;
  setDragged(null);setOver(null);
  if(source)void move(source,target);
 }
 return <div className="table-responsive">
  <table className="table align-middle smn-indicator-preference-table">
   <thead><tr><th scope="col">{t("indicators.tag")}</th><th scope="col">{t("indicators.visible")}</th><th scope="col">{t("indicators.order")}</th><th scope="col">{t("indicators.style")}</th></tr></thead>
   <tbody>{ordered.map((d,index)=>{
    const p=preferences.get(d.id+":"+screen);
    const savePreference=(patch:Record<string,unknown>)=>void save({action:"preference",teamId,indicatorId:d.id,screenKey:screen,visible:p?.is_visible??true,order:p?.display_order??index,style:p?.display_style??"number",...patch});
    return <tr key={d.id} className={over===d.id&&dragged!==d.id?"smn-indicator-drop-target":""}
      onDragOver={e=>{if(dragged&&!busy){e.preventDefault();e.dataTransfer.dropEffect="move";setOver(d.id);}}}
      onDrop={e=>drop(e,d.id)} onDragLeave={()=>setOver(null)}>
      <th scope="row" title={d.name}>{d.tag}</th>
      <td><input type="checkbox" className="form-check-input" aria-label={t("indicators.visible")+" "+d.tag} checked={p?.is_visible??true} disabled={busy} onChange={e=>savePreference({visible:e.target.checked})}/></td>
      <td><div className="d-inline-flex align-items-center gap-2">
       <button type="button" draggable={!busy} disabled={busy} className="btn btn-sm btn-outline-secondary smn-indicator-drag-handle"
         title={"Glisser pour déplacer "+d.name} aria-label={"Glisser pour déplacer "+d.name}
         onDragStart={e=>begin(e,d.id)} onDragEnd={()=>{setDragged(null);setOver(null);}}>⠿</button>
       <div className="btn-group btn-group-sm" role="group" aria-label={"Déplacer "+d.name}>
        <button type="button" className="btn btn-outline-secondary" disabled={busy||index===0} aria-label={"Monter "+d.name} onClick={()=>void move(d.id,ordered[index-1].id)}>↑</button>
        <button type="button" className="btn btn-outline-secondary" disabled={busy||index===ordered.length-1} aria-label={"Descendre "+d.name} onClick={()=>void move(d.id,ordered[index+1].id)}>↓</button>
       </div>
      </div></td>
      <td><select className="form-select" aria-label={t("indicators.style")+" "+d.tag} value={p?.display_style??"number"} disabled={busy} onChange={e=>savePreference({style:e.target.value})}>{["number","card","gauge","line","bar"].map(style=><option key={style} value={style}>{t(("indicators.display."+style) as "indicators.display.number")}</option>)}</select></td>
    </tr>;
   })}</tbody>
  </table>
 </div>;
}
