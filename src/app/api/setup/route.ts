import { NextResponse, type NextRequest } from "next/server";
import { installExpress, setupAuthorized } from "@/server/installation/install";

export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const origin = request.headers.get("origin") ?? "";
  if (!/^((localhost|127\.0\.0\.1):\d{2,5})$/.test(host) ||
      origin !== `http://${host}`) {
    return NextResponse.json({ status: "forbidden" }, { status: 403 });
  }
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ status: "invalid-input" }, { status: 400 });
  }
  const token = body && typeof body === "object" ? (body as Record<string, unknown>).setupToken : undefined;
  if (!setupAuthorized(process.env.SMN_SETUP_TOKEN, token)) {
    return NextResponse.json({ status: "forbidden" }, { status: 403 });
  }
  const confirmed = body && typeof body === "object" && (body as Record<string, unknown>).confirmed === true;
  if (!confirmed) return NextResponse.json({ status: "confirmation-required" }, { status: 400 });
  const outcome = await installExpress(body, process.env.SMN_DATABASE_URL);
  return NextResponse.json(outcome, {
    status: outcome.ok ? 201 : 400,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
