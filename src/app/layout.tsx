import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import "./dashboard.css";
import "./appearance.css";
import "./modal-cockpit.css";
import type {Metadata} from "next";
import type {ReactNode} from "react";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import {LocaleProvider} from "@/i18n/client";
import {requestAppearance} from "@/server/settings/appearance.server";

export async function generateMetadata():Promise<Metadata>{
  const locale=await requestLocale();
  return {title:"Scrum Master Notebook",description:translate(locale,"home.subtitle")};
}
export default async function RootLayout({children}:Readonly<{children:ReactNode}>){
  const [locale,appearance]=await Promise.all([requestLocale(),requestAppearance()]);
  return <html lang={locale} data-bs-theme={appearance.theme} data-smn-palette={appearance.palette}><body><a className="smn-skip-link visually-hidden-focusable" href="#smn-main">{translate(locale,"navigation.skip")}</a><LocaleProvider locale={locale}>{children}</LocaleProvider></body></html>;
}
