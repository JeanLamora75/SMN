"use client";
import {useId} from "react";
import {CEREMONY_ICON_COLORS} from "@/lib/ceremony-appearance";

const HEX=/^#[0-9a-fA-F]{6}$/;

/** Shared hexadecimal color picker, reusing the Cockpit Agile ceremony palette.
 * Indicator definitions store #RRGGBB, not semantic ceremony color ids. */
export function HexColorPicker({value,onChange,disabled=false,allowClear=true,label="Couleur",locale="fr"}:{
 value?:string|null;onChange:(value:string)=>void;disabled?:boolean;allowClear?:boolean;label?:string;locale?:"fr"|"en";
}){
 const id=useId();
 const valid=typeof value==="string"&&HEX.test(value);
 const current=valid?value:"#336699";
 return <div className="smn-hex-color-picker">
  <label className="form-label d-block mb-1" htmlFor={id}>{label}</label>
  <div className="d-flex align-items-center gap-2">
   <input id={id} type="color" className="form-control form-control-color flex-shrink-0"
    value={current} disabled={disabled} onChange={event=>onChange(event.target.value)}
    title={locale==="fr"?"Choisir une couleur personnalisée":"Choose a custom color"}
    aria-label={label}/>
   <output className="small text-body-secondary" htmlFor={id}>{valid?value!.toUpperCase():"—"}</output>
   {allowClear&&<button type="button" className="btn btn-outline-secondary btn-sm ms-auto" disabled={disabled||!valid}
    onClick={()=>onChange("")}>{locale==="fr"?"Effacer":"Clear"}</button>}
  </div>
  <details className="mt-1">
   <summary className="small text-primary" style={{cursor:"pointer"}}>
    {locale==="fr"?"Palette prédéfinie":"Preset palette"}
   </summary>
   <div className="d-flex flex-wrap gap-1 pt-2" role="group"
    aria-label={locale==="fr"?"Couleurs prédéfinies":"Preset colors"}>
    {CEREMONY_ICON_COLORS.map(color=><button key={color.id} type="button"
     className="btn btn-sm border" disabled={disabled}
     onClick={()=>onChange(color.hex)} aria-label={color.label}
     aria-pressed={valid&&value!.toLowerCase()===color.hex.toLowerCase()}
     title={color.label} style={{backgroundColor:color.hex,width:26,height:26,padding:0,
      outline:valid&&value!.toLowerCase()===color.hex.toLowerCase()?"2px solid var(--smn-brand)":undefined,
      outlineOffset:2}}/>)}
   </div>
  </details>
 </div>;
}
