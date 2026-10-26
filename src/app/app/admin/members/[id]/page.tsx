import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {readTeamAssignmentHistory} from "@/server/members/team-assignment-history";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import MemberDetail from "./member-detail";
import MemberTeamReadOnly from "./member-team-read-only";

export const dynamic="force-dynamic";
type PageContext=Readonly<
 {kind:"legacy"}|
 {kind:"denied"}|
 {kind:"missing"}|
 {kind:"team";teamId:string;teamName:string;memberName:string;
  versions:Awaited<ReturnType<typeof readTeamAssignmentHistory>>["versions"]}
>;

export default async function MemberPage({params,searchParams}:{
 params:Promise<{id:string}>;
 searchParams:Promise<{teamId?:string|string[]}>;
}){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(!canAccess(actor,"read",{type:"members",exists:true,inScope:true}))redirect("/app");
 const {id}=await params;
 const query=await searchParams;
 const explicitTeamId=typeof query.teamId==="string"?query.teamId:
  Array.isArray(query.teamId)?"":null;
 // Une erreur d'accès ne doit jamais retomber sur la fiche v27, qui
 // chargerait des données personnelles non contextualisées en v28.
 let context:PageContext;
 try{
  context=await withAuthDb(async db=>{
   const version=await db.query<{schema_version:number}>(`
    SELECT schema_version FROM public.smn_installation
    WHERE id='singleton' AND state='initialized'`);
   if(version.rows.length!==1) return {kind:"denied"} as const;
   const schema=version.rows[0].schema_version;
   if(schema>=1&&schema<=27)return {kind:"legacy"} as const;
   if(schema!==28||actor.role!=="admin")return {kind:"denied"} as const;
   if(explicitTeamId==="")return {kind:"missing"} as const;
   try{
    const team=await resolveAdminTeam(db,{
     accountId:actor.id,role:"admin"
    },explicitTeamId);
    const history=await readTeamAssignmentHistory(db,{
     accountId:actor.id,role:"admin"
    },id,team.team_id);
    const person=await db.query<{display_name:string}>(`
     SELECT m.display_name FROM public.smn_member m
     WHERE m.id=$1 AND m.installation_id='singleton'
      AND EXISTS(SELECT 1 FROM public.smn_member_assignment a
       JOIN public.smn_team t ON t.id=a.team_id
       WHERE a.member_id=m.id AND a.team_id=$2
        AND t.installation_id=m.installation_id)
     LIMIT 2`,[id,team.team_id]);
    if(person.rows.length!==1)return {kind:"missing"} as const;
    return {kind:"team",teamId:team.team_id,teamName:team.team,
     memberName:person.rows[0].display_name,versions:history.versions} as const;
   }catch{return {kind:"missing"} as const;}
  });
 }catch{
  context={kind:"denied"};
 }
 if(context.kind==="legacy")
  return <main className="smn-page smn-member-page"><MemberDetail id={id}/></main>;
 const locale=await requestLocale();
 const back=context.kind==="team"
  ?"/app/admin/members?"+new URLSearchParams({teamId:context.teamId})
  :"/app/admin/members";
 return <main className="smn-page container-fluid py-4 px-3 px-lg-4">
  <Link href={back} className="btn btn-link px-0 mb-3">
   ← {translate(locale,"memberTeamScope.back")}
  </Link>
  {context.kind==="team"?<MemberTeamReadOnly
   key={id+"-"+context.teamId} memberId={id}
   teamId={context.teamId} teamName={context.teamName}
   memberName={context.memberName} versions={[...context.versions]}/>:
   <p role="alert" className="alert alert-warning">
    {translate(locale,context.kind==="missing"?
     "memberTeamScope.notFound":"memberTeamScope.unavailable")}
   </p>}
 </main>;
}
