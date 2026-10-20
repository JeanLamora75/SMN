import { notFound, redirect } from "next/navigation";
import { currentInstallationDiagnostic } from "@/server/installation/current";
import { canVisitSetup } from "@/server/access-policy";

export const dynamic = "force-dynamic";
export default async function OldSetupPage() {
  const diagnostic = await currentInstallationDiagnostic();
  if (!canVisitSetup(diagnostic)) notFound();
  redirect("/welcome");
}
