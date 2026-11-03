import {NextRequest,NextResponse} from "next/server";
import {currentInstallationDiagnostic} from "@/server/installation/current";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/** A route handler can set the HTTP status before React renders any setup content. */
export async function GET(request:NextRequest){
 const state=await currentInstallationDiagnostic();
 if(state.status==="initialized")return new NextResponse("Accès indisponible",{
  status:404,headers:{"Cache-Control":"no-store"}
 });
 return NextResponse.redirect(new URL("/welcome/form",request.url),{
  status:307,headers:{"Cache-Control":"no-store"}
 });
}
