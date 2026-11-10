import {redirect} from "next/navigation";
import Link from "next/link";
import {requestLocale} from "@/i18n/locale.server";
import {translate} from "@/i18n/catalog";
import {currentAccount} from "@/server/auth/session";
import CategoryAdmin from "./category-admin";
import LinksAdminInventory from "./links-admin-inventory";
import "./links-admin-cockpit.css";
export const dynamic="force-dynamic";
export default async function LinksAdminPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.role!=="admin")redirect("/app");
 const locale=await requestLocale();
 return <main className="smn-page smn-links-admin-cockpit container-fluid px-3 px-lg-4 py-4"><Link className="btn btn-link px-0 mb-2" href="/app/admin/settings">{translate(locale,"settingsCatalog.navigation.back")}</Link><LinksAdminInventory/><div className="smn-links-admin-panel mt-3"><CategoryAdmin/></div></main>;
}
