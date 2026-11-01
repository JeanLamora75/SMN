import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import HistoricalCsvTemplateView from "./template-view";
import V33HistoricalCsvImport from "./v33-import";
import {withAuthDb} from "@/server/auth/database";
export const dynamic="force-dynamic";
export default async function HistoricalCsvPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))redirect("/app");
 const v33=await withAuthDb(async db=>{
  const r=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
  return r.rows[0]?.schema_version===33;
 });
 return <main className="smn-page container-fluid py-4 px-3 px-lg-4">{v33?<V33HistoricalCsvImport/>:<HistoricalCsvTemplateView/>}</main>;
}
