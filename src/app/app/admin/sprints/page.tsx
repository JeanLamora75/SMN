import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import SprintForm from "./sprint-form";
import BatchPreviewForm from "./batch-preview-form";
import RenameSprintForm from "./rename-form";
import DeleteSprintForm from "./delete-form";
import SprintStateList from "./state-list";
import LunchForm from "./lunch-form";
import MeetingConflicts from "./meeting-conflicts";
import CeremonyEditor from "./ceremony-editor";
import TemplateForm from "./template-form";
import TemplateOccurrencesList from "./template-occurrences-list";
import ExceptionalMeetingForm from "./exceptional-meeting-form";
import AttendanceForm from "./attendance-form";
import ActualDurationForm from "./actual-duration-form";
import ExceptionalCapacityForm from "./exceptional-capacity-form";
import RescheduleForm from "./reschedule-form";
import GoalsForm from "./goals-form";
import StoryPointsForm from "./story-points-form";
import Link from "next/link";
export const dynamic="force-dynamic";
export default async function SprintsPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(!canAccess(actor,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 return <main className="smn-page container py-4" style={{maxWidth:900}}><SprintForm/><BatchPreviewForm/><RenameSprintForm/><DeleteSprintForm/><SprintStateList/><LunchForm/><MeetingConflicts/><CeremonyEditor/><TemplateForm/><TemplateOccurrencesList/><ExceptionalMeetingForm/><AttendanceForm/><ActualDurationForm/><ExceptionalCapacityForm/><RescheduleForm/><div className="mt-4"><Link href="/app/admin/sprints/review" className="btn btn-primary">Bilan du Sprint</Link></div></main>;
}
