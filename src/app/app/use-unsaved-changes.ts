"use client";
import {useEffect} from "react";

/**
 * Protège les brouillons lors des liens Next.js (clic/touche Entrée) et des sorties
 * du navigateur. Une sortie confirmée demeure autorisée et ne sauvegarde rien.
 * Les navigateurs décident seuls du texte de leur dialogue beforeunload.
 */
export function useUnsavedChanges(dirty:boolean,warning:string):void{
  useEffect(()=>{
    if(!dirty)return;
    let approvedLogout=false;
    const before=(event:BeforeUnloadEvent)=>{
      if(approvedLogout)return;
      event.preventDefault();
      event.returnValue="";
    };
    const links=(event:MouseEvent)=>{
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||
        event.shiftKey||event.altKey)return;
      if(!(event.target instanceof Element))return;
      const logout=event.target.closest('[data-smn-navigation-action="logout"]');
      if(logout){
        if(window.confirm(warning)){approvedLogout=true;return;}
        event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
        return;
      }
      const anchor=event.target.closest("a[href]");
      if(!(anchor instanceof HTMLAnchorElement)||anchor.target==="_blank"||anchor.hasAttribute("download"))return;
      let next:URL;
      try{next=new URL(anchor.href,window.location.href);}catch{return;}
      if(next.href===window.location.href ||
        (next.pathname===window.location.pathname&&next.search===window.location.search&&
          next.origin===window.location.origin&&next.hash!==""))return;
      if(!window.confirm(warning)){
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener("beforeunload",before);
    document.addEventListener("click",links,true);
    return ()=>{
      window.removeEventListener("beforeunload",before);
      document.removeEventListener("click",links,true);
    };
  },[dirty,warning]);
}
