import {redirect,notFound} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import HistoricalSprintForm from "./historical-sprint-form";
export const dynamic="force-dynamic";
export default async function HistoricalSprintPage({searchParams}:{searchParams:Promise<{teamId?:string|string[]}>}){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(actor.role!=="admin"||!canAccess(actor,"write",{type:"settings",exists:true,inScope:true}))notFound();
 const query=await searchParams;
 return <main className="container-fluid px-3 px-lg-4 py-4"><HistoricalSprintForm teamId={typeof query.teamId==="string"?query.teamId:null}/></main>;
}
