import Link from "next/link";
import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withSessionReadDb} from "@/server/auth/database";
import {readAccountDashboard} from "@/server/dashboard/read";
import {helpCatalog,type HelpSection,type HelpMode} from "@/lib/help-catalog";
import {settingsCatalog} from "@/lib/settings-catalog";
import {helpSetupSteps} from "@/lib/help-setup";
import HelpSetupChecklist from "./help-setup-checklist";
import {loadHelpContent} from "@/server/help-content";
import {searchHelp} from "@/server/help-search";
import {availableHelpArticleIds} from "@/server/help-available";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import BootstrapIcon from "../bootstrap-icon";
import {SafeHelpMarkdown} from "./safe-markdown";
import {helpArticleLabel} from "./help-article-labels";
import "./help-center.css";

export const dynamic="force-dynamic";

const sections:readonly {id:HelpSection;key:"gettingStarted"|"configuration"|"modules"|"troubleshooting";icon:"question-circle"|"sliders"|"list-ul"|"search"}[]=[
 {id:"getting-started",key:"gettingStarted",icon:"question-circle"},
 {id:"configuration",key:"configuration",icon:"sliders"},
 {id:"modules",key:"modules",icon:"list-ul"},
 {id:"troubleshooting",key:"troubleshooting",icon:"search"}
];

export default async function HelpPage({searchParams}:{searchParams:Promise<{article?:string|string[];q?:string|string[]}>}){
 const account=await currentAccount();
 if(!account)redirect("/login");
 if(account.must_change_password)redirect("/change-password");
 if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))redirect("/app");
 const locale=await requestLocale();
 const t=(name:"title"|"subtitle"|"gettingStarted"|"configuration"|"modules"|"troubleshooting"|"empty"|"articleUnavailable"|"articleNotFound"|"back"|"open"|"upcoming"|"searchUpcoming"|"searchLabel"|"searchPlaceholder"|"searchButton"|"clearSearch"|"noResults"|"resultsCount"|"indexError"|"retrySearch"|"fallback"|"firstSetup"|"firstSetupComing"|"overview"|"tickets")=>
  translate(locale,(`helpCenter.${name}`) as Parameters<typeof translate>[1]);
 // This is an existing read-only SMN projection; help itself never mutates business data.
 const context=await withSessionReadDb(db=>readAccountDashboard(db,
  {accountId:account.id,role:account.role})).catch(()=>null);
 const rawMode=context?.context?.mode;
 const mode:HelpMode|null=rawMode==="scrum"||rawMode==="kanban"?rawMode:null;
 const permitted=helpCatalog(account,mode);
 const setupSteps=helpSetupSteps(permitted,mode);
 const available=await availableHelpArticleIds(locale);
 const visible=permitted.filter(item=>available.has(item.id));
 const params=await searchParams;
 const requested=params.article;
 const rawQuery=typeof params.q==="string"?params.q:"";
 const query=rawQuery.trim().slice(0,120);
 const searchResult=!requested&&query?await searchHelp(query,locale,account,mode):null;
 const articleId=typeof requested==="string"?requested:null;
 const selected=articleId?visible.find(item=>item.id===articleId):null;
 const result=selected?await loadHelpContent(selected.id,locale,account,mode):null;
 const titleFor=(id:string)=>helpArticleLabel(id,locale);
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
    <section className="smn-panel rounded-4 p-4 mb-4 smn-help-search">
     <form method="get" action="/app/help" role="search" className="smn-help-search-form">
      <label htmlFor="smn-help-query" className="form-label fw-semibold">{t("searchLabel")}</label>
      <div className="d-flex gap-2 flex-wrap">
       <input id="smn-help-query" name="q" type="search" className="form-control flex-grow-1"
        defaultValue={query} placeholder={t("searchPlaceholder")} maxLength={120}/>
       <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2">
        <BootstrapIcon name="search"/>{t("searchButton")}
       </button>
       {query&&<Link className="btn btn-outline-secondary" href="/app/help">{t("clearSearch")}</Link>}
      </div>
     </form>
     {searchResult&&<div className="mt-3" aria-live="polite">
      {searchResult.status==="unavailable"?
       <div role="alert"><p>{t("indexError")}</p>
        <Link className="btn btn-outline-primary" href={`/app/help?q=${encodeURIComponent(query)}`}>{t("retrySearch")}</Link>
       </div>:
       searchResult.hits.length===0?<p className="mb-0">{t("noResults")}</p>:
       <div><p className="text-secondary">{t("resultsCount")} : {searchResult.hits.length}</p>
        <ul className="list-unstyled mb-0">
         {searchResult.hits.map(item=><li key={item.id} className="mb-2">
          <Link className="smn-help-article-link" href={`/app/help?article=${encodeURIComponent(item.id)}`}>
           {item.title}<BootstrapIcon name="arrow-right"/>
          </Link>
         </li>)}
        </ul>
       </div>}
     </div>}
    </section>
    <div className="smn-help-grid mb-4">
     {([["getting-started","modules"],["troubleshooting","configuration"]] as const).map((column,index)=><div className="smn-help-column" key={index}>
      {column.map(id=>sections.find(section=>section.id===id)!).map(section=>{
      const items=visible.filter(item=>item.section===section.id);
      return <section key={section.id} className="smn-panel rounded-4 p-4 smn-help-family">
       <h2 className="h5 d-flex gap-2 align-items-center mb-3">
        <BootstrapIcon name={section.icon}/>{t(section.key)}
       </h2>
       {section.id==="configuration"?(()=>{
        const map:Readonly<Record<string,string>>={
         preferences:"general-settings",languages:"general-settings",appearance:"general-settings",
         teams:"teams",companies:"companies",cadence:"cadence-settings",
         ceremonies:"ceremonies-settings",capacity:"capacity-settings",
         indicators:"indicator-settings",registries:"registry-settings",links:"link-settings",
         jira:"jira-settings",workingDays:"working-days-settings",
         holidays:"holidays-settings",closures:"closures-settings",absences:"absence-settings",
         chartStyles:"chart-styles-settings",users:"users-settings",
         security:"security-settings",maintenance:"maintenance-settings"
        };
        const allowed=new Set(items.map(item=>item.id));
        const seen=new Set<string>();
        const groups=settingsCatalog(mode,account).map(group=>({
         ...group,articles:group.entries.flatMap(entry=>{
          const id=map[entry.id];
          if(!id||!allowed.has(id)||seen.has(id))return [];
          seen.add(id);
          return [{id,status:entry.status}];
         })
        })).filter(group=>group.articles.length>0);
        return groups.length?<div className="smn-help-settings-groups">
         {groups.map(group=><div key={group.id} className="smn-help-settings-group">
          <h3 className="smn-help-settings-group-title">{translate(locale,group.label)}</h3>
          <ul className="list-unstyled mb-0">
           {group.articles.map(article=><li key={article.id} className="mb-2">
            <Link href={`/app/help?article=${encodeURIComponent(article.id)}`} className="smn-help-article-link">
             <span>{titleFor(article.id)}{article.status==="planned"||article.status==="not-applicable"?
              <small className="smn-help-settings-status">{translate(locale,article.status==="planned"?"settingsCatalog.status.planned":"settingsCatalog.status.not-applicable")}</small>:null}</span>
             <BootstrapIcon name="arrow-right"/>
            </Link>
           </li>)}
          </ul>
         </div>)}
        </div>:<p className="text-secondary mb-0">{t("empty")}</p>;
       })():items.length?<ul className="list-unstyled mb-0">
        {items.map(item=><li key={item.id} className="mb-2">
         <Link href={`/app/help?article=${encodeURIComponent(item.id)}`} className="smn-help-article-link">
          {titleFor(item.id)}<BootstrapIcon name="arrow-right"/>
         </Link>
        </li>)}
       </ul>:<p className="text-secondary mb-0">{t("empty")}</p>}
      </section>;
      })}
     </div>)}
    </div>
    <HelpSetupChecklist steps={setupSteps}/>
   </>
  }
 </main>;
}
