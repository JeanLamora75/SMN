import {connection} from "next/server";
import {redirect} from "next/navigation";
import {currentInstallationDiagnostic} from "@/server/installation/current";

/** Gate the entire setup subtree before React renders the setup form. */
export const dynamic="force-dynamic";
export const revalidate=0;
export const fetchCache="force-no-store";
export default async function WelcomeLayout({children}:{children:React.ReactNode}){
 const diagnostic=await currentInstallationDiagnostic();
 if(diagnostic.status==="initialized")redirect("/");
 await connection();
 return children;
}
