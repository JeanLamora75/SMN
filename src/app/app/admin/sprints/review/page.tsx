import {redirect} from "next/navigation";
import Link from "next/link";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import GoalsForm from "../goals-form";
import StoryPointsForm from "../story-points-form";
import ReviewCapacity from "../review-capacity";
import SprintTrends from "./trends";
import SprintClosure from "./closure";
export const dynamic="force-dynamic";
export default async function SprintReviewPage(){
 const actor=await currentAccount();if(!actor)redirect("/login");
 if(!canAccess(actor,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 return <main className="smn-page container py-4" style={{maxWidth:900}}>
  <header className="d-flex justify-content-between align-items-center"><h1 className="h3">Bilan du Sprint</h1><Link href="/app/admin/sprints" className="btn btn-outline-secondary">Administration des Sprints</Link></header>
  <GoalsForm/>
  <StoryPointsForm/>
  <ReviewCapacity/>
  <SprintTrends/>
  <SprintClosure/>
 </main>;
}
