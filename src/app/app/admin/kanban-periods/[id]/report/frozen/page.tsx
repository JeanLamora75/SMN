import Link from "next/link";
import KanbanPdfExport from "./kanban-pdf-export";
import {notFound,redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {readKanbanRenderReference} from "@/server/kanban/render-reference";
export const dynamic="force-dynamic";
const labels:Record<string,string>={objectives:"Objectifs",flow:"Flux",timing:"Cycle Time / Lead Time",capacity:"Capacité (J/H)",trends:"Tendances"};
const present=(x:unknown)=>x===null||x===undefined?"Non renseigné":typeof x==="object"?JSON.stringify(x,null,2):String(x);
export default async function FrozenKanbanReportPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{reference?:string}>}){
 const actor=await currentAccount();if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"read",{type:"documents",exists:true,inScope:true,collection:true}))notFound();
 const {id}=await params;const reference=(await searchParams).reference;
 if(!reference)notFound();
 const stored=await withAuthDb(db=>readKanbanRenderReference(db,id,reference)).catch(()=>null);
 if(!stored)notFound();
 const {data,sections,language}=stored.payload;
 const values:Record<string,unknown>={objectives:data.goals,flow:data.flow,timing:data.timing,capacity:data.capacity,trends:data.trends};
 return <main lang={language} className="container-fluid px-3 px-lg-4 py-4 smn-report-printable">
  <div className="d-print-none mb-3"><Link href={"/app/admin/kanban-periods/"+id+"/report/prepare"}>← Préparation du rapport</Link></div>
  {actor.role==="admin"&&<KanbanPdfExport periodId={id} referenceId={stored.id}/>}
  <article className="smn-panel rounded-4 p-4 my-3">
   <h1 className="h3">Rapport Kanban — {data.period.name}</h1>
   <p>{data.period.team} · {data.period.startOn} — {data.period.endOn} · {data.period.status}</p>
   <p className="small text-secondary">{data.provisional?"Photographie provisoire figée":"Clôture V"+data.snapshotVersion} · Référence {stored.id}</p>
   {sections.map(key=><section className="border-top pt-3 mt-3" key={key}>
    <h2 className="h5">{labels[key]??key}</h2>
    <pre className="text-wrap small">{present(values[key])}</pre>
   </section>)}
   {stored.payload.chosenAnalyses?.length?<section className="border-top mt-4 pt-3"><h2 className="h5">Analyses choisies — interprétations, non KPI</h2>{stored.payload.chosenAnalyses.map(a=><article className="border-start ps-3 mb-3" key={a.type+":"+a.id}><h3 className="h6">{a.origin} · {a.scope}</h3><p className="small text-secondary">Origine : {a.type==="human"?"Humaine":"IA"} · Date : {a.createdAt} · Cycle : {a.cycleId}{a.archiveId?" · Brief source : "+a.archiveId:""}</p><p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{a.content}</p></article>)}</section>:null}
   <p className="small text-secondary">Aucun indicateur en Story Points. Valeurs absentes non reconstruites.</p>
  </article>
 </main>;
}
