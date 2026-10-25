"use client";

import {useState} from "react";
import {useTranslation} from "@/i18n/client";
import RegistrySectionDialog from "./registry-section-dialog";
import RegistryCreate from "./registry-create";

/** Shared complete edit workflow: one audited PATCH for the main fields, plus
 * existing category-specific editors (assessment, ROAM, relationships, etc.). */
export default function RegistryFullEditModal({id,teamId,onDismiss,onSaved}:{
 id:string;teamId:string;onDismiss:()=>void;onSaved?:()=>void;
}){
 const t=useTranslation();
 const [saved,setSaved]=useState(false);
 return <RegistrySectionDialog title={t("registryList.editRecord")} onDismiss={()=>{
  if(saved)onSaved?.();
  onDismiss();
 }}>
  <RegistryCreate key={id} teamId={teamId} canManage={true} itemId={id} modalMode
   onSaved={()=>setSaved(true)}/>
 </RegistrySectionDialog>;
}
