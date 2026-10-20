import "server-only";
import type { NextRequest } from "next/server";
import { canAccess, type AccessAction, type AccessResource } from "../access-policy";
import { SESSION_COOKIE, validLocalHost, validMutationOrigin } from "./guards";
import { sessionAccount } from "./session";

/** Acteur relu côté serveur. La ressource vient uniquement du code serveur appelant. */
export async function authorizeApi(request: NextRequest, action: AccessAction, resource: AccessResource) {
  if (!validLocalHost(request.headers.get("host"))) return null;
  if ((!["GET", "HEAD"].includes(request.method) || action === "write" || action === "generate") &&
    !validMutationOrigin(request.headers.get("host"), request.headers.get("origin"))) return null;
  const actor = await sessionAccount(request.cookies.get(SESSION_COOKIE)?.value);
  return canAccess(actor, action, resource) ? actor : null;
}
