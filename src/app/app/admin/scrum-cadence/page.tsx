import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import CadenceForm from "./cadence-form";
export const dynamic="force-dynamic";
export default async function ScrumCadencePage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(!canAccess(account,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 return <main className="smn-page container py-4" style={{maxWidth:900}}>
  <CadenceForm/>
 </main>;
}
