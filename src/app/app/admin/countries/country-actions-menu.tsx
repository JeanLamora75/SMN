"use client";
import {useEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {useTranslation} from "@/i18n/client";

export default function CountryActionsMenu({code,name,archived,onRename,onLifecycle}:{
 code:string;name:string;archived:boolean;onRename:()=>void;onLifecycle:()=>void;
}){
 const t=useTranslation();
 const button=useRef<HTMLButtonElement>(null),menu=useRef<HTMLDivElement>(null);
 const [position,setPosition]=useState<{top:number;left:number}|null>(null);
 function close(restore=false){setPosition(null);if(restore)button.current?.focus();}
 function toggle(){
  if(position){close(true);return;}
  const rect=button.current?.getBoundingClientRect();
  if(!rect)return;
  const width=184,height=92,margin=8;
  setPosition({
   left:Math.max(margin,Math.min(window.innerWidth-width-margin,rect.right-width)),
   top:rect.bottom+height+margin>window.innerHeight&&rect.top>height+margin
    ?rect.top-height-margin:Math.min(rect.bottom+margin,window.innerHeight-height-margin)
  });
 }
 useEffect(()=>{
  if(!position)return;
  const dismiss=(event:PointerEvent)=>{
   if(!menu.current?.contains(event.target as Node)&&!button.current?.contains(event.target as Node))close();
  };
  const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();close(true);}};
  const onScroll=()=>close();
  document.addEventListener("pointerdown",dismiss);
  document.addEventListener("keydown",escape);
  window.addEventListener("scroll",onScroll,true);
  window.addEventListener("resize",onScroll);
  requestAnimationFrame(()=>menu.current?.querySelector<HTMLButtonElement>("button")?.focus());
  return ()=>{
   document.removeEventListener("pointerdown",dismiss);
   document.removeEventListener("keydown",escape);
   window.removeEventListener("scroll",onScroll,true);
   window.removeEventListener("resize",onScroll);
  };
 },[position]);
 return <>
  <button ref={button} type="button" className="btn btn-sm btn-outline-secondary"
   data-country-actions={code} aria-label={t("countries.lifecycleMenuForCountry",{country:name})}
   aria-haspopup="menu" aria-expanded={!!position} onClick={toggle}>⋯</button>
  {position&&createPortal(<div ref={menu} role="menu" className="smn-country-actions-menu"
    style={{position:"fixed",top:position.top,left:position.left,zIndex:1100}}>
   {!archived&&<button role="menuitem" type="button" onClick={()=>{close();onRename();}}>
    <i className="bi bi-pencil-square" aria-hidden="true"/> {t("countries.renameAction")}
   </button>}
   <button role="menuitem" type="button" onClick={()=>{close();onLifecycle();}}>
    <i className={"bi "+(archived?"bi-arrow-counterclockwise":"bi-archive")} aria-hidden="true"/>
    {t(archived?"countries.lifecycleReactivateAction":"countries.lifecycleArchiveAction")}
   </button>
  </div>,document.body)}
 </>;
}
