import "./calendar-cockpit.css";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import TeamCalendarView from "./team-calendar-view";
import {withAuthDb} from "@/server/auth/database";
import {resolveAdminTeam} from "@/server/teams/resolve";

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
 const requestedTeamId=typeof query.teamId==="string"?query.teamId:null;
 const selectedTeam=actor.role==="admin"?await withAuthDb(db=>resolveAdminTeam(db,
  {accountId:actor.id,role:"admin"},requestedTeamId)).catch(()=>null):null;
 const resolvedTeamId=selectedTeam?.team_id??requestedTeamId;
 return <TeamCalendarView key={resolvedTeamId??"initial"} isAdmin={actor.role==="admin"}
  initialCreate={query.create==="1"&&actor.role==="admin"} initialCycleId={initialCycleId}
  initialTeamId={resolvedTeamId}/>;
}
