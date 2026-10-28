"use client";
import {useEffect,useRef,useState,type KeyboardEvent as ReactKeyboardEvent,type ReactNode} from "react";
import {createPortal} from "react-dom";

/** SMN-298 : piège de focus, Échap, retour au déclencheur, verrouillage du scroll. */
export default function LinkDialog({titleId,children,onClose,locked=false,large=false}:{
 titleId:string;children:ReactNode;onClose:()=>void;locked?:boolean;large?:boolean;
}){
 const ref=useRef<HTMLDivElement>(null);
 const [mounted,setMounted]=useState(false);
 useEffect(()=>{
  queueMicrotask(()=>setMounted(true));
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const originalOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  const focusables=()=>Array.from(ref.current?.querySelectorAll<HTMLElement>(
   'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  )??[]).filter(el=>el.getClientRects().length>0);
  const frame=requestAnimationFrame(()=>{(focusables()[0]??ref.current)?.focus();});
  return()=>{cancelAnimationFrame(frame);document.body.style.overflow=originalOverflow;previous?.focus();};
 },[]);
 const keydown=(event:ReactKeyboardEvent<HTMLDivElement>)=>{
  if(event.key==="Escape"){event.stopPropagation();if(!locked)onClose();return;}
  if(event.key!=="Tab")return;
  const all=Array.from(ref.current?.querySelectorAll<HTMLElement>(
   'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  )??[]).filter(el=>el.getClientRects().length>0);
  if(!all.length){event.preventDefault();ref.current?.focus();return;}
  const first=all[0],last=all[all.length-1];
  if(event.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){
   event.preventDefault();last.focus();
  }else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===ref.current)){
   event.preventDefault();first.focus();
  }
 };
 if(!mounted)return null;
 return createPortal(<div ref={ref} tabIndex={-1} className="modal d-block" role="dialog"
  aria-modal="true" aria-labelledby={titleId} onKeyDown={keydown}
  style={{backgroundColor:"rgba(0,0,0,.55)"}}>
  <div className={"modal-dialog modal-dialog-centered modal-dialog-scrollable"+(large?" modal-lg":"")}>
   <div className="modal-content">{children}</div>
  </div>
 </div>,document.body);
}
