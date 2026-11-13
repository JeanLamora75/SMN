import type {ReactNode} from "react";
import Link from "next/link";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import "./settings-page-shell.css";

type Props={
 title:string;
 description:string;
 eyebrow:string;
 children:ReactNode;
 constrained?:boolean;
 action?:ReactNode;
};

export default async function SettingsPageShell({title,description,eyebrow,children,constrained=false,action}:Props){
 const locale=await requestLocale();
 return <main className="smn-page smn-team-page smn-settings-detail-page container-fluid px-3 px-lg-4 py-4">
  <header className="smn-settings-detail-hero mb-4">
   {action&&<div className="smn-settings-detail-hero-action">{action}</div>}
   <Link href="/app/admin/settings" className="text-secondary text-decoration-none d-inline-block mb-2">{translate(locale,"settingsCatalog.navigation.back")}</Link>
   <p className="smn-settings-detail-eyebrow">{eyebrow}</p>
   <h1>{title}</h1>
   <p className="smn-settings-detail-description">{description}</p>
  </header>
  <div className={constrained?"smn-settings-detail-content smn-settings-detail-content-narrow":"smn-settings-detail-content"}>
   {children}
  </div>
 </main>;
}
