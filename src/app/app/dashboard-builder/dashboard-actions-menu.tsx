"use client";
import {useEffect,useRef,useState} from "react";

export function DashboardActionsMenu({items,header=false}:{
 items:readonly {label:string;action:()=>void;disabled?:boolean}[];header?:boolean;
}){
 const [open,setOpen]=useState(false);
 const root=useRef<HTMLDivElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!open)return;
  function outside(e:PointerEvent){if(!root.current?.contains(e.target as Node))setOpen(false);}
  function key(e:KeyboardEvent){if(e.key==="Escape"){e.preventDefault();setOpen(false);trigger.current?.focus();}}
  document.addEventListener("pointerdown",outside);document.addEventListener("keydown",key);
  return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",key);};
 },[open]);
 return <div className="dropdown" ref={root}>
  <button ref={trigger} type="button" className={header?"btn btn-sm fw-semibold text-white border-white":"btn btn-outline-secondary"}
   style={header?{background:"rgba(255,255,255,.16)",minHeight:36}:undefined}
   aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>
   Actions <span aria-hidden="true">▾</span>
  </button>
  {open&&<ul className="dropdown-menu show end-0" role="menu" style={{position:"absolute",minWidth:240,zIndex:1100,boxShadow:"0 8px 24px rgba(0,0,0,.2)"}}>
   {items.map(item=><li key={item.label} role="none">
    <button type="button" role="menuitem" className="dropdown-item py-2" disabled={item.disabled}
     onClick={()=>{setOpen(false);item.action();}}>{item.label}</button>
   </li>)}
  </ul>}
 </div>;
}
