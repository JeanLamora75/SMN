import {redirect} from "next/navigation";
import {SprintReviewHeader} from "../i18n-navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import GoalsForm from "../goals-form";
import StoryPointsForm from "../story-points-form";
import TicketCountsForm from "../ticket-counts-form";
import ReviewCapacity from "../review-capacity";
import SprintTrends from "./trends";
import SprintClosure from "./closure";
export const dynamic="force-dynamic";
export default async function SprintReviewPage(){
 const actor=await currentAccount();if(!actor)redirect("/login");
 if(!canAccess(actor,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 return <main className="smn-page container py-4" style={{maxWidth:900}}>
  <SprintReviewHeader/>
  <GoalsForm/>
  <StoryPointsForm/>
  <TicketCountsForm canManage={actor.role==="admin"}/>
  <ReviewCapacity/>
  <SprintTrends/>
  <SprintClosure/>
 </main>;
}
