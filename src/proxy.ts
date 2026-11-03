import {NextResponse,type NextRequest} from "next/server";
import {currentInstallationDiagnostic} from "./server/installation/current";

/** Prevent the setup form from streaming when the installation is already initialized. */
export async function proxy(_request:NextRequest){
 const installation=await currentInstallationDiagnostic();
 if(installation.status==="initialized")return new NextResponse("Accès indisponible",{
  status:404,headers:{"Cache-Control":"no-store"}
 });
 return NextResponse.next();
}
export const config={matcher:["/welcome"]};
