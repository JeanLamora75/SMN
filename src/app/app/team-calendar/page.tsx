import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import TeamCalendarView from "./team-calendar-view";

export const dynamic="force-dynamic";

export default async function TeamCalendarPage({searchParams}:{
 searchParams:Promise<{create?:string|string[];cycleId?:string|string[];teamId?:string|string[]}>;
}){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"read",{type:"collective",exists:true,inScope:true}))
  redirect("/app");
 const query=await searchParams;
 const initialCycleId=typeof query.cycleId==="string"&&query.cycleId.length<=80?query.cycleId:null;
 return <TeamCalendarView key={typeof query.teamId==="string"?query.teamId:"initial"} isAdmin={actor.role==="admin"}
  initialCreate={query.create==="1"&&actor.role==="admin"} initialCycleId={initialCycleId}
  initialTeamId={typeof query.teamId==="string"?query.teamId:null}/>;
}
