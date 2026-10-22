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
export const dynamic="force-dynamic";
export default async function SprintsPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(!canAccess(actor,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 return <main className="smn-page container py-4" style={{maxWidth:900}}><SprintForm/><BatchPreviewForm/><RenameSprintForm/><DeleteSprintForm/><SprintStateList/><LunchForm/><MeetingConflicts/><CeremonyEditor/><TemplateForm/></main>;
}
