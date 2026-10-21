import Link from "next/link";
import { notFound } from "next/navigation";
import { currentInstallationDiagnostic } from "@/server/installation/current";
import SetupWelcome from "./welcome-form";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
export const dynamic = "force-dynamic";
export default async function WelcomePage() {
  const state = await currentInstallationDiagnostic();
  if (state.status === "initialized") notFound();
  const locale=await requestLocale();
  return <main className="smn-page container py-5"><section className="smn-panel p-4 p-md-5">
    <h1 className="h3">{translate(locale,"welcome.title")}</h1>
    <p className="smn-subtitle">{translate(locale,"welcome.intro")}</p>
    <SetupWelcome/>
    <Link className="btn btn-link mt-3" href="/">{translate(locale,"welcome.back")}</Link>
  </section></main>;
}
