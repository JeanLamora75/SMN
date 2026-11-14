import Link from "next/link";
import path from "node:path";
import {readdir} from "node:fs/promises";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withSessionReadDb} from "@/server/auth/database";
import {readAccountDashboard} from "@/server/dashboard/read";
import {helpCatalog,type HelpSection,type HelpMode} from "@/lib/help-catalog";
import {loadHelpContent} from "@/server/help-content";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import BootstrapIcon from "../bootstrap-icon";
import {SafeHelpMarkdown} from "./safe-markdown";
import "./help-center.css";

export const dynamic="force-dynamic";

const sections:readonly {id:HelpSection;key:"gettingStarted"|"configuration"|"modules"|"troubleshooting";icon:"question-circle"|"sliders"|"list-ul"|"search"}[]=[
 {id:"getting-started",key:"gettingStarted",icon:"question-circle"},
 {id:"configuration",key:"configuration",icon:"sliders"},
 {id:"modules",key:"modules",icon:"list-ul"},
 {id:"troubleshooting",key:"troubleshooting",icon:"search"}
];

async function availableArticleIds(locale:string):Promise<ReadonlySet<string>>{
 const dir=path.join(process.cwd(),"content","help");
 const list=async(lang:string)=>readdir(path.join(dir,lang)).catch(()=>[] as string[]);
 const [localized,french]=await Promise.all([list(locale),locale==="fr"?Promise.resolve([] as string[]):list("fr")]);
 return new Set([...localized,...french].filter(file=>/^[a-z][a-z0-9-]*\.md$/.test(file)).map(file=>file.slice(0,-3)));
}

export default async function HelpPage({searchParams}:{searchParams:Promise<{article?:string|string[]}>}){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 const t=(name:"title"|"subtitle"|"gettingStarted"|"configuration"|"modules"|"troubleshooting"|"empty"|"articleUnavailable"|"articleNotFound"|"back"|"open"|"upcoming"|"searchUpcoming"|"fallback"|"firstSetup"|"firstSetupComing"|"overview"|"tickets")=>
  translate(locale,(`helpCenter.${name}`) as Parameters<typeof translate>[1]);
 // This is an existing read-only SMN projection; help itself never mutates business data.
 const context=await withSessionReadDb(db=>readAccountDashboard(db,
  {accountId:account.id,role:account.role})).catch(()=>null);
 const rawMode=context?.context?.mode;
 const mode:HelpMode|null=rawMode==="scrum"||rawMode==="kanban"?rawMode:null;
 const permitted=helpCatalog(account,mode);
 const available=await availableArticleIds(locale);
 const visible=permitted.filter(item=>available.has(item.id));
 const requested=(await searchParams).article;
 const articleId=typeof requested==="string"?requested:null;
 const selected=articleId?visible.find(item=>item.id===articleId):null;
 const result=selected?await loadHelpContent(selected.id,locale,account,mode):null;
 const titleFor=(id:string)=>id==="overview"?t("overview"):id==="tickets"?t("tickets"):id;
 return <main className="smn-page smn-team-page smn-help-center container-fluid px-3 px-lg-4 py-4">
  <header className="smn-help-hero mb-4">
   <p className="smn-help-eyebrow">SMN</p>
   <h1>{t("title")}</h1>
   <p>{t("subtitle")}</p>
  </header>
  {articleId?
   <section className="smn-panel rounded-4 p-4 smn-help-article">
    <Link href="/app/help" className="d-inline-flex align-items-center gap-2 mb-3">
     <BootstrapIcon name="arrow-left"/>{t("back")}
    </Link>
    {result?.status==="ready"?
     <>
      {result.isFallback&&<p role="status" className="alert alert-info">{t("fallback")}</p>}
      <SafeHelpMarkdown markdown={result.markdown}/>
     </>:
     <p role="status" className="text-secondary">{selected?t("articleUnavailable"):t("articleNotFound")}</p>}
   </section>:
   <>
    <p className="smn-help-search-notice text-secondary mb-4"><BootstrapIcon name="search"/> {t("searchUpcoming")}</p>
    <div className="smn-help-grid mb-4">
     {sections.map(section=>{
      const items=visible.filter(item=>item.section===section.id);
      return <section key={section.id} className="smn-panel rounded-4 p-4 smn-help-family">
       <h2 className="h5 d-flex gap-2 align-items-center mb-3">
        <BootstrapIcon name={section.icon}/>{t(section.key)}
       </h2>
       {items.length?<ul className="list-unstyled mb-0">
        {items.map(item=><li key={item.id} className="mb-2">
         <Link href={`/app/help?article=${encodeURIComponent(item.id)}`} className="smn-help-article-link">
          {titleFor(item.id)}<BootstrapIcon name="arrow-right"/>
         </Link>
        </li>)}
       </ul>:<p className="text-secondary mb-0">{t("empty")}</p>}
      </section>;
     })}
    </div>
    <section className="smn-panel rounded-4 p-4 smn-help-onboarding">
     <h2 className="h5">{t("firstSetup")}</h2>
     <p className="text-secondary mb-0">{t("firstSetupComing")}</p>
    </section>
   </>
  }
 </main>;
}
