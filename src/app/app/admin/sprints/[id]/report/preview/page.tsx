import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {withLegacyReportReadDb} from "@/server/reports/legacy-read";
import {assertTeamReportCycle} from "@/server/reports/team-cycle";
import {readFrozenReportReference} from "@/server/reports/render-reference";

export const dynamic="force-dynamic";
const uuid=/^[a-f0-9-]{36}$/i;
const present=(value:unknown)=>value===null||value===undefined?"Non renseigné":typeof value==="object"?JSON.stringify(value,null,2):String(value);

/** Printable HTML uses only the verified, immutable reference. Never recompute live Sprint data. */
export default async function SprintPdfPreview({params,searchParams}:{
 params:Promise<{id:string}>;
 searchParams:Promise<{reference?:string;teamId?:string}>;
}){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"read",{type:"documents",exists:true,inScope:true,collection:true}))notFound();
 const {id}=await params,{reference,teamId}=await searchParams;
 if(!uuid.test(id)||!reference||!uuid.test(reference))notFound();
 if(teamId!==undefined&&(!teamId||!uuid.test(teamId)||actor.role!=="admin"))notFound();
 const stored=await (teamId?withAuthDb(async db=>{
  if(!await assertTeamReportCycle(db,{accountId:actor.id,role:actor.role},teamId,id))return null;
  return readFrozenReportReference(db,reference,id,teamId);
 }):withLegacyReportReadDb(db=>readFrozenReportReference(db,reference,id))).catch(()=>null);
 if(!stored||stored.payload.data.sprint.id!==id)notFound();
 const {data,language}=stored.payload;
 return <main lang={language.language} className="container-fluid px-3 px-lg-4 py-4 smn-report-printable">
  <article className="smn-panel rounded-4 p-4 my-3">
   <h1 className="h3">Rapport Sprint — {present(data.sprint.name)}</h1>
   <p className="small text-secondary">Référence figée : {stored.id}</p>
   {data.sections.map((section,index)=><section className="border-top pt-3 mt-3" key={section.key+index}>
    <h2 className="h5">{section.key}</h2>
    <p className="small text-secondary">{section.state}</p>
    {section.items.map((item,i)=><p key={i}><strong>{item.label}</strong> : {item.detail}</p>)}
   </section>)}
   <section className="border-top pt-3 mt-3"><h2 className="h5">Indicateurs figés</h2>
    <pre className="text-wrap small">{present(data.metrics)}</pre>
   </section>
   <section className="border-top pt-3 mt-3"><h2 className="h5">Notes et contexte</h2>
    <pre className="text-wrap small">{present(data.notes)}</pre>
    <pre className="text-wrap small">{present(data.teamContext)}</pre>
   </section>
  </article>
 </main>;
}
