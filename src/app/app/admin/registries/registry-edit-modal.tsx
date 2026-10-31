"use client";
import {useTranslation} from "@/i18n/client";
import RegistryCreate from "./registry-create";
import RegistrySectionDialog from "./registry-section-dialog";

export default function RegistryEditModal({id,teamId,onSaved,onDismiss}:{
 id:string;teamId:string;onSaved:()=>void;onDismiss:()=>void;
}){
 const t=useTranslation();
 return <RegistrySectionDialog title={t("registryList.editRecord")} onDismiss={onDismiss} wide submitFormId="registry-main-edit">
  <RegistryCreate key={id} itemId={id} teamId={teamId} canManage={true}
   initialType="risk" modalMode onSaved={onSaved}/>
 </RegistrySectionDialog>;
}
