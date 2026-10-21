import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import TeamCalendarView from "./team-calendar-view";

export const dynamic="force-dynamic";

export default async function TeamCalendarPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"read",{type:"collective",exists:true,inScope:true}))
  redirect("/app");
 return <TeamCalendarView isAdmin={actor.role==="admin"}/>;
}
