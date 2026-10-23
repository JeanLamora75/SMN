import {redirect} from "next/navigation";
import Link from "next/link";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import SprintForm from "../sprint-form";
import BatchPreviewForm from "../batch-preview-form";
import RenameSprintForm from "../rename-form";
import DeleteSprintForm from "../delete-form";
import SprintStateList from "../state-list";
import MeetingConflicts from "../meeting-conflicts";
import CeremonyEditor from "../ceremony-editor";
import TemplateOccurrencesList from "../template-occurrences-list";
import ExceptionalMeetingForm from "../exceptional-meeting-form";
import AttendanceForm from "../attendance-form";
import ActualDurationForm from "../actual-duration-form";
import ExceptionalCapacityForm from "../exceptional-capacity-form";
import RescheduleForm from "../reschedule-form";
import {SprintReviewLink} from "../i18n-navigation";
export const dynamic="force-dynamic";
export default async function SprintToolsPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 return <main className="smn-page container py-4" style={{maxWidth:1000}}>
  <header className="mb-3">
   <Link href="/app/admin/sprints" className="btn btn-link px-0">← {translate(locale,"navigation.entries.sprints")}</Link>
   <h1 className="h4">{translate(locale,"sprintsIndex.legacyTitle")}</h1>
   <p className="text-secondary">{translate(locale,"sprintsIndex.legacyDescription")}</p>
  </header>
  <nav aria-label={translate(locale,"navigation.entries.settings")} className="smn-panel p-3 mb-3 d-flex flex-wrap gap-3 align-items-center">
   <span className="fw-semibold">{translate(locale,"navigation.entries.settings")}</span>
   <Link href="/app/admin/settings/working-days">{translate(locale,"settingsCatalog.items.workingDays.title")}</Link>
   <Link href="/app/admin/settings/ceremonies">{translate(locale,"settingsCatalog.items.ceremonies.title")}</Link>
   <Link href="/app/admin/scrum-cadence">{translate(locale,"settingsCatalog.items.cadence.title")}</Link>
  </nav>
  <section id="create-sprints"><SprintForm/><BatchPreviewForm/></section><section id="sprint-operations"><RenameSprintForm/><DeleteSprintForm/><SprintStateList/><MeetingConflicts/><CeremonyEditor/><TemplateOccurrencesList/><ExceptionalMeetingForm/><AttendanceForm/><ActualDurationForm/><ExceptionalCapacityForm/><RescheduleForm/></section><div className="mt-4"><SprintReviewLink/></div></main>;
}
