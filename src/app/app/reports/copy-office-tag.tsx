"use client";

import {useState} from "react";

export default function CopyOfficeTag({value,fr}:{value:string;fr:boolean}){
 const [status,setStatus]=useState<"idle"|"copied"|"error">("idle");
 async function copy(){
  try{
   await navigator.clipboard.writeText(value);
   setStatus("copied");
  }catch{setStatus("error");}
 }
 const label=status==="copied"?(fr?"Copié":"Copied"):status==="error"?(fr?"Copie impossible":"Copy failed"):(fr?"Copier le tag":"Copy tag");
 return <button type="button" className={"btn btn-sm d-inline-flex align-items-center gap-1 "+(status==="copied"?"btn-outline-success":"btn-outline-secondary")}
  onClick={()=>void copy()} aria-label={(fr?"Copier ":"Copy ")+value} title={label}>
  <span aria-hidden="true">{status==="copied"?"✓":"⧉"}</span>
  <span className="visually-hidden" aria-live="polite">{status==="idle"?"":label}</span>
 </button>;
}
