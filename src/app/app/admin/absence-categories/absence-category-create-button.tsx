"use client";
import {useTranslation} from "@/i18n/client";
export const OPEN_ABSENCE_CATEGORY="smn:absence-category-create";
export default function AbsenceCategoryCreateButton(){
 const t=useTranslation();
 return <button type="button" className="btn btn-sm"
  onClick={()=>window.dispatchEvent(new Event(OPEN_ABSENCE_CATEGORY))}>
  <span aria-hidden="true">＋ </span>{t("absenceCategories.createTitle")}
 </button>;
}
