import {redirect} from "next/navigation";
import {currentAccount} from "@/server/auth/session";
import CategoryAdmin from "./category-admin";
import LinksAdminInventory from "./links-admin-inventory";
export const dynamic="force-dynamic";
export default async function LinksAdminPage(){
 const actor=await currentAccount();
 if(!actor)redirect("/login");
 if(actor.role!=="admin")redirect("/app");
 return <main className="smn-page container-fluid px-3 px-lg-4 py-4"><LinksAdminInventory/><div className="mt-4"><CategoryAdmin/></div></main>;
}
