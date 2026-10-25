"use client";
import {useSyncExternalStore,type ReactNode} from "react";
import {createPortal} from "react-dom";

/** Native dialogs live in document.body, outside page clipping and stacking contexts. */
const subscribe=()=>()=>{};
const onClient=()=>true;
const onServer=()=>false;
export function useRegistryPortalReady(){
 return useSyncExternalStore(subscribe,onClient,onServer);
}
export default function RegistryDialogPortal({children}:{children:ReactNode}){
 const ready=useRegistryPortalReady();
 return ready?createPortal(children,document.body):null;
}
