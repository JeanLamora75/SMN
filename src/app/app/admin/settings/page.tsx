import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import {withAuthDb} from "@/server/auth/database";
import {settingsCatalog} from "@/lib/settings-catalog";
export const dynamic="force-dynamic";
export default async function SettingsPortalPage(){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"settings",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 const t=(key:Parameters<typeof translate>[1])=>translate(locale,key);
 const mode=await withAuthDb(async db=>{
  const result=await db.query<{mode:string}>(`SELECT mode FROM public.smn_installation
   WHERE id='singleton' AND state='initialized' LIMIT 1`);
  const value=result.rows[0]?.mode;
  return value==="scrum"||value==="kanban"?value:null;
 }).catch(()=>null);
 const groups=settingsCatalog(mode,account);
 return <main className="smn-page smn-team-page container-fluid py-4 px-3 px-lg-4">
  <header className="mb-4">
   <h1 className="h3">{t("navigation.entries.settings")}</h1>
   <p className="text-secondary">{t("settingsPortal.subtitle")}</p>
  </header>
  {groups.map(group=><section key={group.id} className="mb-4" aria-labelledby={"settings-group-"+group.id}>
   <h2 className="h5 mb-3" id={"settings-group-"+group.id}>{t(group.label)}</h2>
   <div className="row g-3">
    {group.entries.map(entry=>{
     const label=t(entry.label),description=t(entry.description);
     const content=<><span className="fs-4 flex-shrink-0" aria-hidden="true">{entry.icon}</span>
      <span className="d-grid gap-1 flex-grow-1">
       <strong>{label}</strong>
       <span className="small text-secondary">{description}</span>
       <span className="small text-secondary">{t(("settingsCatalog.status."+entry.status) as "settingsCatalog.status.available")}</span>
      </span></>;
     return <div key={entry.id} className="col-12 col-md-6 col-xl-3">
      {entry.href?<Link href={entry.href} className="smn-panel rounded-4 p-3 h-100 d-flex gap-3 align-items-start text-decoration-none text-body" aria-label={label}>
       {content}
      </Link>:<div className="smn-panel rounded-4 p-3 h-100 d-flex gap-3 align-items-start" aria-label={label}>
       {content}
      </div>}
     </div>;
    })}
   </div>
  </section>)}
 </main>;
}
