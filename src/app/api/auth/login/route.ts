import { NextRequest } from "next/server";
import { authenticate } from "@/server/auth/credentials";
import { withAuthDb } from "@/server/auth/database";
import { authLimiter, issueSession } from "@/server/auth/session";
import { allowMutation, jsonResult, readJsonObject, setSessionCookie } from "@/server/auth/request";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  if (!allowMutation(request)) return jsonResult({ error: "forbidden" }, 403);
  const body = await readJsonObject(request);
  const identity = typeof body?.identity === "string" ? body.identity.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!identity || identity.length > 200 || !password || password.length > 256) {
    return jsonResult({ error: "invalid-credentials" }, 401);
  }
  const limiter = authLimiter();
  if (limiter.blocked(identity)) return jsonResult({ error: "too-many-attempts" }, 429);
  try {
    const account = await withAuthDb(client => authenticate(client, identity, password));
    if (!account) {
      limiter.failure(identity);
      return jsonResult({ error: "invalid-credentials" }, 401);
    }
    limiter.success(identity);
    const token = issueSession(account);
    return setSessionCookie(jsonResult({
      ok: true, mustChangePassword: account.must_change_password,
    }), request, token);
  } catch (error) {
    // Journal technique uniquement : ne jamais enregistrer identité, mot de passe ou jeton.
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code : "AUTH_DB_CHECK_FAILED";
    console.error("smn-auth-login-unavailable", code);
    return jsonResult({ error: "service-unavailable" }, 503);
  }
}
