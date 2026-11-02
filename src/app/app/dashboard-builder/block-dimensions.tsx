"use client";
import {useState} from "react";
import type {BlockDimensions} from "@/lib/dashboard-builder/dimensions";
import {DEFAULT_BLOCK_DIMENSIONS} from "@/lib/dashboard-builder/dimensions";

export function BlockDimensionControl({value,onChange,disabled=false}:{
 value?:BlockDimensions;onChange:(v:BlockDimensions)=>void;disabled?:boolean;
}){
 const [open,setOpen]=useState(false);
 const current=value??DEFAULT_BLOCK_DIMENSIONS;
 return <div className="position-relative d-inline-block">
  <button type="button" className="btn btn-outline-secondary btn-sm" disabled={disabled}
   aria-label="Redimensionner le bloc" aria-expanded={open}
   onClick={()=>setOpen(v=>!v)}>◢</button>
  {open&&<div className="position-absolute end-0 bottom-100 mb-2 bg-body border rounded shadow p-3"
   style={{zIndex:1030,width:"min(290px,85vw)",maxWidth:"calc(100vw - 32px)"}} role="group" aria-label="Dimensions du bloc">
   <label className="form-label" htmlFor="block-dimension-width">Largeur logique</label>
   <select id="block-dimension-width" className="form-select mb-2" value={current.width}
    onChange={e=>onChange({...current,width:Number(e.target.value) as BlockDimensions["width"]})}>
    {[1,2,3,4].map(n=><option key={n} value={n}>{n} colonne{n>1?"s":""}</option>)}
   </select>
   <label className="form-label" htmlFor="block-dimension-height">Hauteur</label>
   <select id="block-dimension-height" className="form-select" value={String(current.height)}
    onChange={e=>onChange({...current,height:e.target.value==="auto"?"auto":Number(e.target.value) as Exclude<BlockDimensions["height"],"auto">})}>
    <option value="auto">Automatique</option>
    {[240,320,400,480,640].map(n=><option key={n} value={n}>{n} px</option>)}
   </select>
   <button type="button" className="btn btn-outline-secondary btn-sm mt-2" onClick={()=>setOpen(false)}>Fermer</button>
  </div>}
 </div>;
}
