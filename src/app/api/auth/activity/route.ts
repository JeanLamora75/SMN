import { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/server/auth/guards";
import { markUserActivity } from "@/server/auth/session";
import { allowMutation, jsonResult } from "@/server/auth/request";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  if (!allowMutation(request)) return jsonResult({ error: "forbidden" }, 403);
  // Le client n'appelle ce point qu'en réaction à un clavier/clic réellement détecté.
  // Les GET, les polls et les vérifications de session ne touchent jamais au timeout.
  const ok = await markUserActivity(request.cookies.get(SESSION_COOKIE)?.value);
  return jsonResult(ok ? { ok: true } : { error: "unauthorized" }, ok ? 200 : 401);
}
