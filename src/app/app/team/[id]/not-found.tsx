import Link from "next/link";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";

/** 404 commun aux identifiants inconnus, archivés et interdits : aucune donnée privée. */
export default async function TeamUnavailable(){
  const locale=await requestLocale();
  return <div className="smn-page py-4">
    <section className="smn-panel p-4" role="alert">
      <h1 className="h4">{translate(locale,"detail.missingTitle")}</h1>
      <p className="text-secondary">{translate(locale,"detail.missingDescription")}</p>
      <Link className="btn btn-outline-primary" href="/app">{translate(locale,"detail.back")}</Link>
    </section>
  </div>;
}
