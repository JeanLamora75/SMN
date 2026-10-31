"use client";
import {useEffect,useState} from "react";
import {useTranslation} from "@/i18n/client";
import BootstrapIcon from "../../bootstrap-icon";
import {registryTypes,type RegistryType} from "@/lib/registry-types";
import RegistryCreate from "./registry-create";
import RegistrySectionDialog from "./registry-section-dialog";
const icons:Record<RegistryType,string>={
 risk:"exclamation-octagon-fill",obstacle:"exclamation-triangle-fill",
 dependency:"stack",decision:"bullseye",action:"ticket-perforated-fill",highlight:"bell-fill"
};
export default function RegistryEditModal({id,teamId,onSaved,onDismiss}:{
 id:string;teamId:string;onSaved:()=>void;onDismiss:()=>void;
}){
 const t=useTranslation();
 const [identity,setIdentity]=useState<{type:RegistryType;title:string}|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/admin/registries/"+encodeURIComponent(id)+"?teamId="+encodeURIComponent(teamId),
   {cache:"no-store",signal:controller.signal}).then(async response=>{
    if(!response.ok)throw Error("unavailable");
    return response.json() as Promise<{item?:{type?:unknown;title?:unknown}}>;
   }).then(({item})=>{
    if(controller.signal.aborted||!item||typeof item.title!=="string"||
      typeof item.type!=="string"||!registryTypes.some(type=>type===item.type))return;
    setIdentity({type:item.type as RegistryType,title:item.title});
   }).catch(()=>{});
  return()=>controller.abort();
 },[id,teamId]);
 const label=identity? <span className="d-inline-flex align-items-center gap-2">
  <BootstrapIcon name={icons[identity.type]}/>
  <span>{t(("registryCreate."+identity.type) as Parameters<typeof t>[0])} : {identity.title}</span>
 </span>:t("registryList.editRecord");
 return <RegistrySectionDialog title={label} onDismiss={onDismiss} wide submitFormId="registry-main-edit">
  <RegistryCreate key={id} itemId={id} teamId={teamId} canManage={true}
   initialType="risk" modalMode onSaved={onSaved}/>
 </RegistrySectionDialog>;
}
