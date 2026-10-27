import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {resolveRegistryReadContext} from "@/server/registries/team-access";
import {readTeamRegistryItem} from "@/server/registries/team-item-read";
import RegistryDetail from "../registry-detail";
import {parseRegistryNavigation,parseRegistryIndexState} from "@/lib/registry-navigation";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";

export const dynamic="force-dynamic";
export default async function RegistryDetailPage({params,searchParams}:{
 params:Promise<{id:string}>;
 searchParams:Promise<{origin?:string;trail?:string;teamId?:string}>;
}){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(!canAccess(actor,"read",{type:"collective",exists:true,inScope:true}))
  redirect("/app");
 const {id}=await params;
 const search=await searchParams;
 const navigation=parseRegistryNavigation(search,id);
 const fromOrigin=parseRegistryIndexState(navigation.origin).teamId;
 const requestedTeamId=typeof search.teamId==="string"?search.teamId:
  fromOrigin??null;
 const locale=await requestLocale();
 const context=await withSprintIndexDb(async db=>{
  const policy=await resolveRegistryReadContext(db,{
   accountId:actor.id,role:actor.role
  },requestedTeamId);
  if(policy.version===28){
   const teamId=policy.team!.team_id;
   const item=await readTeamRegistryItem(db,{
    accountId:actor.id,role:actor.role
   },teamId,id);
   return {version:28 as const,teamId,item};
  }
  const r=await db.query<{id:string}>(`
   SELECT t.id FROM public.smn_team t
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE i.id='singleton' AND i.state='initialized'
    AND i.schema_version<=27 AND lower(i.mode) IN ('scrum','kanban')
   LIMIT 2`);
  return {version:27 as const,teamId:r.rows.length===1?r.rows[0].id:null};
 }).catch(()=>null);
 if(context?.version===28){
  const item=context.item;
  return <main className="smn-page smn-team-page container-fluid px-3 px-lg-4 py-4">
   <p><Link href={navigation.origin}>← {translate(locale,"memberTeamScope.back")}</Link></p>
   {!item?<p role="alert" className="alert alert-warning">
    Fiche introuvable dans l'équipe sélectionnée.
   </p>:<article className="smn-panel rounded-4 p-3 p-lg-4">
    <p className="text-secondary mb-2">Registre · Consultation seule</p>
    <h1 className="h3">{item.title}</h1>
    <dl className="row mb-0">
     <dt className="col-sm-3">Type</dt><dd className="col-sm-9">{item.type}</dd>
     <dt className="col-sm-3">Statut</dt><dd className="col-sm-9">{item.status}</dd>
     <dt className="col-sm-3">Date</dt><dd className="col-sm-9">{item.occurredOn}</dd>
     <dt className="col-sm-3">Échéance</dt>
     <dd className="col-sm-9">{item.dueOn??"—"}</dd>
     <dt className="col-sm-3">Description</dt>
     <dd className="col-sm-9">{item.description??"—"}</dd>
    </dl>
    <p className="text-secondary small mt-3 mb-0">
     Les relations, historiques, commentaires et modifications restent
     indisponibles jusqu'à leur isolation multiéquipes.
    </p>
   </article>}
  </main>;
 }
 return <main className="smn-page smn-team-page container-fluid px-3 px-lg-4 py-4">
  {context?.teamId?<RegistryDetail id={id} teamId={context.teamId}
   canManage={actor.role==="admin"} navigation={navigation}/>:
   <p role="alert">{translate(locale,"registryDetail.teamUnavailable")}</p>}
 </main>;
}
