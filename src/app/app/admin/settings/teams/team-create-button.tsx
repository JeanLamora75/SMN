"use client";
import {useTranslation} from "@/i18n/client";
export const OPEN_TEAM_EDITOR="smn:settings-team-create";
export default function TeamCreateButton(){
 const t=useTranslation();
 return <button type="button" className="btn btn-sm"
  onClick={()=>window.dispatchEvent(new Event(OPEN_TEAM_EDITOR))}>
  <span aria-hidden="true">＋ </span>{t("teamSettings.newTeam")}
 </button>;
}
