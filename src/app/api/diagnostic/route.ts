import { NextResponse } from "next/server";
import { currentInstallationDiagnostic } from "@/server/installation/current";

export const dynamic = "force-dynamic";

export async function GET() {
  const diagnostic = await currentInstallationDiagnostic();
  return NextResponse.json(diagnostic, {
    headers: { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" },
  });
}
