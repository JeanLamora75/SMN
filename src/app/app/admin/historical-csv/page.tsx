import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import HistoricalCsvTemplateView from "./template-view";
export const dynamic="force-dynamic";
export default async function HistoricalCsvPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))redirect("/app");
 return <main className="smn-page container-fluid py-4 px-3 px-lg-4"><HistoricalCsvTemplateView/></main>;
}
