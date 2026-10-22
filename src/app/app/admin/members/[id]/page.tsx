import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import MemberDetail from "./member-detail";
export const dynamic="force-dynamic";
export default async function MemberPage({params}:{params:Promise<{id:string}>}){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(!canAccess(actor,"read",{type:"members",exists:true,inScope:true}))redirect("/app");
 const {id}=await params;
 return <main className="smn-page smn-member-page"><MemberDetail id={id}/></main>;
}
