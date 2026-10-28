import {redirect} from "next/navigation";
import Link from "next/link";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import SprintIndexView from "./sprint-index-view";
import "./sprints-cockpit.css";
import {parseSprintIndexQuery} from "@/server/sprints/index";

export const dynamic="force-dynamic";

export default async function SprintsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))
  redirect("/app");
 const isScrum=await withSprintIndexDb(async db=>{
  const result=await db.query(`SELECT 1 FROM public.smn_installation
   WHERE id='singleton' AND state='initialized' AND lower(mode)='scrum' LIMIT 1`);
  return result.rows.length===1;
 }).catch(()=>false);
 if(!isScrum)redirect("/app");
 const requested=await searchParams;
 const qs=new URLSearchParams();
 for(const key of ["search","status","sort","page"]){
  if(typeof requested[key]==="string")qs.set(key,requested[key]);
 }
 const parsed=parseSprintIndexQuery(qs);
 const initialFilters=parsed?{search:parsed.search,status:parsed.status,sort:parsed.sort,page:parsed.page}:undefined;
 return <main className="smn-page smn-team-page container-fluid py-4 px-3 px-lg-4">
  {account.role==="admin"&&<div className="d-flex justify-content-end mb-3">
   <Link href="/app/admin/team-cycles" className="btn btn-outline-secondary btn-sm">
    Consulter les cycles par équipe
   </Link>
  </div>}
  <SprintIndexView canManage={account.role==="admin"} initialFilters={initialFilters}/>
 </main>;
}
