import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import TeamOverview from "./team-overview";
import "./team-cockpit.css";
export const dynamic="force-dynamic";
export default async function TeamPage({searchParams}:{
 searchParams:Promise<{teamId?:string|string[]}>;
}){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(!canAccess(actor,"read",{type:"members",exists:true,inScope:true}))redirect("/app");
 const {teamId:requested}=await searchParams;
 const teamId=typeof requested==="string"?requested:null;
 return <main className="smn-page smn-team-page container-fluid py-4 px-3 px-lg-4">
  <TeamOverview key={teamId??"initial"} initialTeamId={teamId}
   canManage={canAccess(actor,"write",{type:"settings",exists:true,inScope:true})}/>
 </main>;
}
