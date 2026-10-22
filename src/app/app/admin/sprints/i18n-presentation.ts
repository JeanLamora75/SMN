"use client";
import {useLocale,useTranslation} from "@/i18n/client";
export function useEpic4Presentation(){
 const locale=useLocale(),t=useTranslation();
 const kind=(value:string)=>value==="standard"?t("epic4Ui.standard"):value==="custom"?t("epic4Ui.custom"):value==="exceptional"?t("epic4Ui.exceptional"):value;
 const status=(value:string)=>value==="scheduled"?t("epic4Ui.scheduled"):value==="held"?t("epic4Ui.held"):value==="not_held"?t("epic4Ui.notHeld"):value==="cancelled"?t("epic4Ui.cancelled"):value==="planned"?t("epic4Ui.planned"):value==="active"?t("epic4Ui.active"):value==="finished"?t("epic4Ui.finished"):value==="closed"?t("epic4Ui.closed"):value;
 const date=(value:string)=>{const d=new Date(value);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{dateStyle:"short",timeStyle:"short",timeZone:"Europe/Paris"}).format(d):value;};
 return {kind,status,date};
}
