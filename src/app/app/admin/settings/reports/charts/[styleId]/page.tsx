import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import ChartStyleEditor from "../style-editor";
import "../style-gallery.css";
export const dynamic="force-dynamic";
export default async function ChartStyleEditorPage({params}:{
 params:Promise<{styleId:string}>
}){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 const {styleId}=await params;
 if(!/^[a-z][a-z0-9-]{2,63}$/.test(styleId))redirect("/app/admin/settings/reports/charts");
 return <main className="smn-page smn-team-page smn-chart-style-page container-fluid px-3 px-lg-4 py-4">
  <ChartStyleEditor id={styleId} canEdit={actor.role==="admin"}/>
 </main>;
}
