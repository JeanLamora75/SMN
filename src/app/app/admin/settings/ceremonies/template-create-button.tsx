"use client";
import {useTranslation} from "@/i18n/client";
export const OPEN_CEREMONY_TEMPLATE="smn:ceremony-template-create";
export default function TemplateCreateButton(){
 const t=useTranslation();
 return <button type="button" className="btn btn-sm"
  onClick={()=>window.dispatchEvent(new Event(OPEN_CEREMONY_TEMPLATE))}>
  <span aria-hidden="true">＋ </span>{t("ceremonyTemplates.new")}
 </button>;
}
