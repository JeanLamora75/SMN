import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import TeamOverview from "./team-overview";
export const dynamic="force-dynamic";
export default async function TeamPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(!canAccess(actor,"read",{type:"members",exists:true,inScope:true}))redirect("/app");
 return <main className="smn-page container-fluid py-4 px-3 px-lg-4">
  <TeamOverview/>
 </main>;
}
