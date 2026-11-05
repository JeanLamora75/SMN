"use client";
import {useId} from "react";
import {CEREMONY_ICON_COLORS,type CeremonyIconColor} from "@/lib/ceremony-appearance";

/** Contrôle partagé pour choisir une couleur de pictogramme parmi des teintes sûres. */
export function CeremonyColorPicker({value,onChange,disabled=false,label="Couleur de l’icône"}:{
 value?:CeremonyIconColor|null;onChange:(value:CeremonyIconColor|undefined)=>void;disabled?:boolean;label?:string;
}){
 const id=useId();
 return <fieldset className="mb-0" disabled={disabled}>
  <legend className="form-label fs-6 mb-2">{label}</legend>
  <div className="d-flex flex-wrap align-items-center gap-2">
   <label className="btn btn-outline-secondary btn-sm">
    <input type="radio" className="visually-hidden" name={id} checked={!value}
     onChange={()=>onChange(undefined)}/>Par défaut
   </label>
   {CEREMONY_ICON_COLORS.map(color=><label key={color.id} className="d-inline-flex align-items-center gap-1 p-1 rounded border"
    style={{outline:value===color.id?"2px solid var(--bs-primary)":undefined,outlineOffset:2,cursor:"pointer"}}
    title={color.label}>
    <input type="radio" name={id} className="visually-hidden" checked={value===color.id}
     onChange={()=>onChange(color.id)} aria-label={color.label}/>
    <span aria-hidden="true" className="rounded-circle border" style={{width:24,height:24,display:"inline-block",backgroundColor:color.hex}}/>
    <span className="small">{color.label}</span>
   </label>)}
  </div>
 </fieldset>;
}
