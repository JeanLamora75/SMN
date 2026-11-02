import {NextResponse} from "next/server";
import {currentInstallationDiagnostic} from "./server/installation/current";

/**
 * Refuser /welcome avant le rendu React : Next.js peut streamer un ancien
 * formulaire puis envoyer un notFound, avec un statut HTTP déjà fixé à 200.
 * Le diagnostic reste basé sur la base réellement installée, jamais sur un cookie.
 */
export async function proxy(){
 const installation=await currentInstallationDiagnostic();
 if(installation.status==="initialized")return new NextResponse("Accès indisponible",{
  status:404,
  headers:{"Cache-Control":"no-store"}
 });
 return NextResponse.next();
}
export const config={matcher:["/welcome"]};
