import { NextResponse, type NextRequest } from "next/server";
import { canOfferPortable } from "@/server/bootstrap/portable";
import { bootstrapStatus, beginBootstrap, checkLocalCookie, localCookieValue, validateDatabaseChoice } from "@/server/bootstrap/job";
import { validateExpressInput } from "@/server/installation/contract";
export const dynamic = "force-dynamic";
function allowed(request: NextRequest): boolean {
  const host = request.headers.get("host") ?? "";
  const origin = request.headers.get("origin");
  return /^(localhost|127\.0\.0\.1):\d{2,5}$/.test(host) &&
    (!origin || origin === "http://" + host);
}
export async function GET(request: NextRequest) {
  if (!allowed(request)) return NextResponse.json({ status: "forbidden" }, { status: 403 });
  const response = NextResponse.json(bootstrapStatus(), { headers: { "Cache-Control": "no-store" } });
  {
    response.cookies.set("smn-local-setup", localCookieValue(), {
      httpOnly: true, sameSite: "strict", secure: false, path: "/api/bootstrap", maxAge: 1800,
    });
  }
  return response;
}
export async function POST(request: NextRequest) {
  if (!canOfferPortable() || !allowed(request) || request.headers.get("origin") !== "http://" + request.headers.get("host") ||
      !checkLocalCookie(request.cookies.get("smn-local-setup")?.value)) {
    return NextResponse.json({ status: "forbidden" }, { status: 403 });
  }
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ status: "invalid-input" }, { status: 400 }); }
  if (!body || typeof body !== "object" || (body as Record<string,unknown>).confirmed !== true ||
      !validateExpressInput(body) || !validateDatabaseChoice(body)) {
    return NextResponse.json({ status: "invalid-input" }, { status: 400 });
  }
  if (!beginBootstrap(body)) return NextResponse.json({ status: "invalid-input-or-running" }, { status: 409 });
  return NextResponse.json({ status: "working" }, { status: 202, headers: { "Cache-Control": "no-store" } });
}
