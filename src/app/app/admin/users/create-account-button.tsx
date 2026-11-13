"use client";
import {useTranslation} from "@/i18n/client";
export const OPEN_ACCOUNT_CREATE="smn:account-create";
export default function CreateAccountButton(){
 const t=useTranslation();
 return <button type="button" className="btn btn-sm"
   onClick={()=>window.dispatchEvent(new Event(OPEN_ACCOUNT_CREATE))}>
   <i className="bi bi-person-plus" aria-hidden="true"/> {t("accounts.createTitle")}
  </button>;
}
