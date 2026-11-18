"use client";
import {useState,type DragEvent} from "react";
import {useTranslation} from "@/i18n/client";
import {SMNIcon} from "../../smn-icon";
import {isDashboardIcon} from "@/lib/dashboard-builder/icon-catalog";

type Indicator={id:string;tag:string;name:string;icon?:string|null;color?:string|null};
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
   <thead><tr>
    <th scope="col" className="smn-indicator-preference-handle-cell"><span className="visually-hidden">{t("indicators.order")}</span></th>
    <th scope="col" className="smn-indicator-preference-code-cell">{t("indicators.tag")}</th>
    <th scope="col" className="smn-indicator-preference-name-cell">{t("indicators.name")}</th>
    <th scope="col" className="smn-indicator-preference-visible-cell">{t("indicators.visible")}</th>
    <th scope="col" className="smn-indicator-preference-style-cell">{t("indicators.style")}</th>
   </tr></thead>
   <tbody>{ordered.map((d,index)=>{
    const p=preferences.get(d.id+":"+screen);
    const savePreference=(patch:Record<string,unknown>)=>void save({action:"preference",teamId,indicatorId:d.id,screenKey:screen,visible:p?.is_visible??true,order:p?.display_order??index,style:p?.display_style??"number",...patch});
    return <tr key={d.id} className={over===d.id&&dragged!==d.id?"smn-indicator-drop-target":""}
      onDragOver={e=>{if(dragged&&!busy){e.preventDefault();e.dataTransfer.dropEffect="move";setOver(d.id);}}}
      onDrop={e=>drop(e,d.id)} onDragLeave={()=>setOver(null)}>
      <td className="smn-indicator-preference-handle-cell">
       <button type="button" draggable={!busy} disabled={busy}
        className="btn btn-sm btn-outline-secondary smn-indicator-drag-handle"
        title={"Glisser pour déplacer "+d.name} aria-label={"Glisser pour déplacer "+d.name}
        onDragStart={e=>begin(e,d.id)} onDragEnd={()=>{setDragged(null);setOver(null);}}>⠿</button>
      </td>
      <th scope="row" className="smn-indicator-preference-code-cell">
       <span className="smn-indicator-preference-code-content">
        {d.icon&&isDashboardIcon(d.icon)&&<span className="smn-indicator-preference-icon"
         style={{color:d.color&&/^#[0-9a-fA-F]{6}$/.test(d.color)?d.color:"var(--smn-brand)"}} aria-hidden="true"><SMNIcon name={d.icon}/></span>}
        <span>{d.tag}</span>
       </span>
      </th>
      <td className="smn-indicator-preference-name-cell">{d.name}</td>
      <td className="smn-indicator-preference-visible-cell">
       <div className="form-check form-switch mb-0">
        <input type="checkbox" role="switch" className="form-check-input"
         aria-label={t("indicators.visible")+" "+d.name}
         checked={p?.is_visible??true} disabled={busy}
         onChange={e=>savePreference({visible:e.target.checked})}/>
       </div>
      </td>
      <td className="smn-indicator-preference-style-cell">
       <select className="form-select form-select-sm"
        aria-label={t("indicators.style")+" "+d.tag}
        value={p?.display_style??"number"} disabled={busy}
        onChange={e=>savePreference({style:e.target.value})}>
        {["number","card","gauge","line","bar"].map(style=><option key={style} value={style}>{t(("indicators.display."+style) as "indicators.display.number")}</option>)}
       </select>
      </td>
    </tr>;
   })}</tbody>
  </table>
 </div>;
}
