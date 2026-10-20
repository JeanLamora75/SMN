import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import "./dashboard.css";
import type {Metadata} from "next";
import type {ReactNode} from "react";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import {LocaleProvider} from "@/i18n/client";

export async function generateMetadata():Promise<Metadata>{
  const locale=await requestLocale();
  return {title:"Scrum Master Notebook",description:translate(locale,"home.subtitle")};
}
export default async function RootLayout({children}:Readonly<{children:ReactNode}>){
  const locale=await requestLocale();
  return <html lang={locale}><body><LocaleProvider locale={locale}>{children}</LocaleProvider></body></html>;
}
