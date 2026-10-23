import Link from "next/link";
import {requestLocale} from "@/i18n/locale.server";
import fr from "@/i18n/fr.json";
import en from "@/i18n/en.json";
import {redirect,notFound} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type RecordRow={name:string;start_at:string;end_at:string;status:string;generation_source:string};
export const dynamic="force-dynamic";
export default async function MeetingPage({params}:{params:Promise<{kind:string;id:string}>}){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.must_change_password)redirect("/change-password");
 if(!canAccess(actor,"read",{type:"collective",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 const labels=(locale==="en"?en:fr).calendarUX;
 const reconstructedLabel=(locale==="en"?en:fr).sprintWizard.reconstructedLabel;
 const {kind,id}=await params;
 if(!["ceremony","exceptional"].includes(kind)||!UUID.test(id))notFound();
 const row=await withAuthDb(async db=>{
  const sql=kind==="ceremony"?
   `SELECT (s.name||' — '||c.kind) AS name,c.starts_at::text AS start_at,
    c.ends_at::text AS end_at,'unknown' AS status,c.generation_source AS generation_source
    FROM public.smn_sprint_ceremony c JOIN public.smn_sprint s ON s.id=c.sprint_id
    JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE i.id='singleton' AND s.deleted_at IS NULL AND c.id=$1`:
   `SELECT m.name,m.starts_at::text AS start_at,m.ends_at::text AS end_at,
    COALESCE(m.status,'scheduled') AS status,'standard' AS generation_source
    FROM public.smn_sprint_exceptional_meeting m JOIN public.smn_sprint s ON s.id=m.sprint_id
    JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE i.id='singleton' AND s.deleted_at IS NULL AND m.id=$1`;
  const found=await db.query<RecordRow>(sql,[id]);
  return found.rows[0]??null;
 });
 if(!row)notFound();
 const format=(value:string)=>new Date(value).toLocaleString("fr-FR",{dateStyle:"full",timeStyle:"short"});
 return <main className="smn-page container py-4 d-grid gap-3">
  <Link href="/app/team-calendar" className="btn btn-link px-0 justify-self-start">← {labels.backCalendar}</Link>
  <section className="smn-panel p-4">
   <h1 className="h3">{row.name}</h1>
   <dl className="row mb-0">
    <dt className="col-sm-3">{labels.meetingStart}</dt><dd className="col-sm-9">{format(row.start_at)}</dd>
    <dt className="col-sm-3">{labels.meetingEnd}</dt><dd className="col-sm-9">{format(row.end_at)}</dd>
    <dt className="col-sm-3">{labels.meetingStatus}</dt><dd className="col-sm-9">{row.status==="unknown"?labels.statusUnknown:row.status}</dd>
    {row.generation_source==="reconstructed"&&<><dt className="col-sm-3">{reconstructedLabel}</dt><dd className="col-sm-9">{reconstructedLabel}</dd></>}
   </dl>
  </section>
 </main>;
}
