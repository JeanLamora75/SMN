"use client";
import {useEffect,useRef} from "react";

/** Shared focus management for independently rendered Bootstrap-style Dashboard modals. */
export function useDashboardModalFocus(onClose:()=>void,active=true){
 const dialog=useRef<HTMLDivElement>(null);
 const close=useRef(onClose);
 close.current=onClose;
 useEffect(()=>{
  if(!active)return;
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const node=dialog.current;
  if(!node)return;
  const focusables=()=>Array.from(node.querySelectorAll<HTMLElement>(
   'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  )).filter(el=>el.getClientRects().length>0);
  (node.querySelector<HTMLElement>('[data-initial-focus="true"]')??focusables()[0]??node).focus();
  const keydown=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();event.stopPropagation();close.current();return;}
   if(event.key!=="Tab")return;
   const items=focusables();
   if(!items.length){event.preventDefault();node.focus();return;}
   const first=items[0],last=items[items.length-1];
   if(event.shiftKey&&(document.activeElement===first||!node.contains(document.activeElement))){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&(document.activeElement===last||!node.contains(document.activeElement))){event.preventDefault();first.focus();}
  };
  document.addEventListener("keydown",keydown,true);
  return ()=>{document.removeEventListener("keydown",keydown,true);previous?.focus();};
 },[active]);
 return dialog;
}
