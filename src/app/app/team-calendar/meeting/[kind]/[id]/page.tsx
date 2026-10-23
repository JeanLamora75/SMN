import Link from "next/link";
import {requestLocale} from "@/i18n/locale.server";
import fr from "@/i18n/fr.json";
import en from "@/i18n/en.json";
import {redirect,notFound} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {translate,type TranslationKey} from "@/i18n/catalog";
import {ceremonyStatus} from "@/lib/sprint-ceremony-detail";
import {sprintDetailPath} from "@/lib/sprint-detail-path";
import {withAuthDb} from "@/server/auth/database";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type RecordRow={name:string;start_at:string;end_at:string;status:string;status_explicit:boolean|null;generation_source:string|null;sprint_id:string;team_id:string;time_zone:string};
export const dynamic="force-dynamic";
export default async function MeetingPage({params,searchParams}:{
 params:Promise<{kind:string;id:string}>;
 searchParams:Promise<{teamId?:string;cycleId?:string}>;
}){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"read",{type:"collective",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 const labels=(locale==="en"?en:fr).calendarUX;
 const reconstructedLabel=(locale==="en"?en:fr).sprintWizard.reconstructedLabel;
 const {kind,id}=await params;
 if(!["ceremony","template","exceptional"].includes(kind)||!UUID.test(id))notFound();
 const row=await withAuthDb(async db=>{
  const sql=kind==="ceremony"?
   `SELECT (s.name||' — '||c.kind) AS name,c.starts_at::text AS start_at,
    c.ends_at::text AS end_at,c.occurrence_status AS status,
    c.status_explicit,c.generation_source AS generation_source,
    s.id AS sprint_id,s.team_id AS team_id,s.time_zone
    FROM public.smn_sprint_ceremony c JOIN public.smn_sprint s ON s.id=c.sprint_id
    JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE i.id='singleton' AND s.deleted_at IS NULL AND c.id=$1`:
   kind==="template"?
   `SELECT o.name,o.starts_at::text AS start_at,o.ends_at::text AS end_at,
    COALESCE(o.status,'unknown') AS status,o.status_explicit,o.generation_source,
    s.id AS sprint_id,s.team_id AS team_id,s.time_zone
    FROM public.smn_scrum_template_occurrence o
    JOIN public.smn_sprint s ON s.id=o.sprint_id
    JOIN public.smn_team t ON t.id=s.team_id
    JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE i.id='singleton' AND s.deleted_at IS NULL AND o.id=$1`:
   `SELECT m.name,m.starts_at::text AS start_at,m.ends_at::text AS end_at,
    COALESCE(m.status,'unknown') AS status,m.status_explicit,
    NULL::text AS generation_source,
    s.id AS sprint_id,s.team_id AS team_id,s.time_zone
    FROM public.smn_sprint_exceptional_meeting m JOIN public.smn_sprint s ON s.id=m.sprint_id
    JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE i.id='singleton' AND s.deleted_at IS NULL AND m.id=$1`;
  const found=await db.query<RecordRow>(sql,[id]);
  return found.rows[0]??null;
 });
 if(!row)notFound();
 const requested=await searchParams;
 const dashboardHref=requested.teamId===row.team_id&&requested.cycleId===row.sprint_id?
  "/app?"+new URLSearchParams({teamId:row.team_id,cycleId:row.sprint_id}).toString():null;
 const format=(value:string)=>new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en-GB",{
  timeZone:row.time_zone,dateStyle:"full",timeStyle:"short"
 }).format(new Date(value));
 const status=ceremonyStatus(row.status);
 const statusKey:Record<ReturnType<typeof ceremonyStatus>,TranslationKey>={
  scheduled:"sprintDetail.ceremonyStatus.scheduled",
  held:"sprintDetail.ceremonyStatus.held",
  not_held:"sprintDetail.ceremonyStatus.notHeld",
  cancelled:"sprintDetail.ceremonyStatus.cancelled",
  unknown:"sprintDetail.ceremonyStatus.unknown"
 };
 const statusLabel=translate(locale,statusKey[status]);
 return <main className="smn-page container py-4 d-grid gap-3">
  <nav className="d-flex flex-wrap align-items-center gap-3">
   <Link href="/app/team-calendar" className="btn btn-link px-0">← {labels.backCalendar}</Link>
   <Link href={sprintDetailPath(row.sprint_id)+"?tab=ceremonies"}
    className="btn btn-outline-primary btn-sm">
    {translate(locale,"sprintDetail.ceremonyBackToSprint")}
   </Link>
   {dashboardHref&&<Link href={dashboardHref} className="btn btn-link btn-sm">
    {translate(locale,"dashboard.cockpit.backToDashboard")}
   </Link>}
  </nav>
  <section className="smn-panel p-4">
   <h1 className="h3">{row.name}</h1>
   <dl className="row mb-0">
    <dt className="col-sm-3">{labels.meetingStart}</dt><dd className="col-sm-9">{format(row.start_at)}</dd>
    <dt className="col-sm-3">{labels.meetingEnd}</dt><dd className="col-sm-9">{format(row.end_at)}</dd>
    <dt className="col-sm-3">{labels.meetingStatus}</dt>
    <dd className="col-sm-9">{statusLabel}
     {status==="held"&&row.status_explicit===false&&
      <span className="small text-secondary ms-2">
       ({translate(locale,"sprintDetail.ceremonyInferred")})
      </span>}
    </dd>
    {row.generation_source==="reconstructed"&&<><dt className="col-sm-3">{reconstructedLabel}</dt><dd className="col-sm-9">{reconstructedLabel}</dd></>}
   </dl>
  </section>
 </main>;
}
