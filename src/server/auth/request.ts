import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_SECONDS, cookieSecure, validMutationOrigin } from "./guards";
export function allowMutation(request: NextRequest): boolean {
  return validMutationOrigin(request.headers.get("host"), request.headers.get("origin"));
}
export function jsonResult(content: object, status = 200): NextResponse {
  return NextResponse.json(content, {
    status,
    headers: { "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff" },
  });
}
export function setSessionCookie(response: NextResponse, request: NextRequest, token: string): NextResponse {
  response.cookies.set(SESSION_COOKIE, token, {
    path: "/", httpOnly: true, sameSite: "strict", secure: cookieSecure(request.nextUrl.protocol),
    maxAge: SESSION_SECONDS,
  });
  return response;
}
export function clearSessionCookie(response: NextResponse, request: NextRequest): NextResponse {
  response.cookies.set(SESSION_COOKIE, "", {
    path: "/", httpOnly: true, sameSite: "strict", secure: cookieSecure(request.nextUrl.protocol), maxAge: 0,
  });
  return response;
}
export async function readJsonObject(request: NextRequest, maxBytes = 4096): Promise<Record<string, unknown> | null> {
  const size = Number(request.headers.get("content-length") || "0");
  if (size > maxBytes || request.headers.get("content-type")?.split(";")[0]?.trim() !== "application/json") return null;
  try {
    const body = await request.text();
    if (!body || Buffer.byteLength(body,"utf8") > maxBytes) return null;
    const result: unknown = JSON.parse(body);
    return result && typeof result === "object" && !Array.isArray(result) ? result as Record<string, unknown> : null;
  } catch { return null; }
}
