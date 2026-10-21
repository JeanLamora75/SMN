import "bootstrap/dist/css/bootstrap.min.css";
import "./dashboard.css";
import "./globals.css";
import type {Metadata} from "next";
import type {ReactNode} from "react";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import {LocaleProvider} from "@/i18n/client";
import {requestTheme} from "@/server/theme/current";

export async function generateMetadata():Promise<Metadata>{
  const locale=await requestLocale();
  return {title:"Scrum Master Notebook",description:translate(locale,"home.subtitle")};
}
export default async function RootLayout({children}:Readonly<{children:ReactNode}>){
  const [locale,theme]=await Promise.all([requestLocale(),requestTheme()]);
  return <html lang={locale} data-bs-theme={theme}><body><a className="smn-skip-link visually-hidden-focusable" href="#smn-main">{translate(locale,"navigation.skip")}</a><LocaleProvider locale={locale}>{children}</LocaleProvider></body></html>;
}
