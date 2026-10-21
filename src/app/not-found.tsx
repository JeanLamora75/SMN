import Link from "next/link";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
export default async function NotFoundPage(){
  const locale=await requestLocale();
  return <main id="smn-main" className="smn-page container py-5">
    <div className="smn-panel p-4">
      <h1 className="h3">{translate(locale,"notFound.title")}</h1>
      <p>{translate(locale,"notFound.message")}</p>
      <Link href="/" className="btn btn-outline-primary">{translate(locale,"notFound.home")}</Link>
    </div>
  </main>;
}
