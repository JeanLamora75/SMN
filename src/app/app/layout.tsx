import Link from "next/link";
import {redirect} from "next/navigation";
import type {ReactNode} from "react";
import {currentAccount} from "@/server/auth/session";
import {canAccess} from "@/server/access-policy";
import {withAuthDb} from "@/server/auth/database";
import {readCollectiveDashboard} from "@/server/dashboard/read";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import LogoutControl from "./logout-control";
import SessionActivity from "./session-activity";
import PrivateNavigation from "./private-navigation";
import type {PrivateRole} from "@/lib/private-navigation";

export const dynamic="force-dynamic";

/** Tous les écrans privés partagent le même menu et les mêmes contrôles de session. */
export default async function PrivateLayout({children}:{children:ReactNode}) {
  const account=await currentAccount();
  if(!account)redirect("/login");
  if(account.must_change_password)redirect("/change-password");
  if(!canAccess(account,"read",{type:"collective",exists:true,inScope:true}))redirect("/login");
  const locale=await requestLocale();
  // Une indisponibilité de la BDD n'invente jamais un produit ou une équipe.
  const dashboard=await withAuthDb(readCollectiveDashboard).catch(()=>null);
  const context=dashboard?.context??null;
  const role=account.role as PrivateRole;
  return <div className="smn-dashboard">
    <a className="visually-hidden-focusable smn-skip-link" href="#smn-main">{translate(locale,"navigation.skip")}</a>
    <header className="smn-dashboard-topbar">
      <div className="container-fluid smn-dashboard-width d-flex align-items-center justify-content-between gap-3">
        <Link href="/app" className="smn-brand" aria-label={translate(locale,"dashboard.back")}>
          <span className="smn-mark" aria-hidden="true">SMN</span>
          <span className="smn-brand-name">Scrum Master <strong>Notebook</strong></span>
        </Link>
        <div className="d-flex align-items-center gap-3">
          <span className="smn-account-pill"><span className="smn-account-dot" aria-hidden="true"/>
            <span className="d-none d-sm-inline">{account.username}</span>
            <span className="visually-hidden">{translate(locale,"dashboard.connected",{username:account.username})}</span>
          </span>
          <LogoutControl/>
        </div>
      </div>
    </header>
    <div className="container-fluid smn-dashboard-width">
      <div className="row g-4 smn-dashboard-columns">
        <PrivateNavigation mode={context?.mode??"scrum"} role={role}
          product={context?.product??null} team={context?.team??null}/>
        <main id="smn-main" className="col-12 col-lg-9 col-xl-10 pb-5">
          {children}
        </main>
      </div>
    </div>
    <SessionActivity/>
  </div>;
}
