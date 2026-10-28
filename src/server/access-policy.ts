import type { Diagnostic } from "./installation/diagnostic";
export function canVisitSetup(diagnostic: Diagnostic): boolean {
  return diagnostic.status === "database-missing" || (diagnostic.status === "virgin" && diagnostic.canEnterSetup);
}
export function canVisitPrivate(account?: {role: string; mustChangePassword: boolean} | null): boolean {
  return !!account && (account.role === "admin" || account.role === "user") && !account.mustChangePassword;
}

export type AccessAction = "read" | "write" | "generate" | "download";
export type AccessActor = Readonly<{ role: string; is_active?: unknown; must_change_password?: unknown }>;
/** Métadonnées de confiance résolues par le serveur, jamais depuis le JSON client. */
export type AccessResource = Readonly<{
  type: string;
  exists?: unknown;
  inScope?: unknown;
  format?: unknown;
  userAuthorized?: unknown;
  collection?: unknown;
}>;
const resourceTypes = ["collective", "individual", "accounts", "settings", "audit", "documents", "backups", "members", "companies"];
const actionTypes = ["read", "write", "generate", "download"];

export function canAccess(actor: AccessActor | null | undefined, action: string, resource: AccessResource): boolean {
  if (!actor || actor.is_active !== true || actor.must_change_password !== false ||
    (actor.role !== "admin" && actor.role !== "user") ||
    !actionTypes.includes(action) || !resourceTypes.includes(resource.type) ||
    resource.exists !== true || resource.inScope !== true) return false;
  if (resource.type === "companies") return action === "read" || (actor.role === "admin" && action === "write");
  if (resource.type === "audit") return actor.role === "admin" && action === "read";
  if (resource.type === "documents") {
    if (action === "generate") return actor.role === "admin" && resource.collection === true;
    if (action === "read" || action === "download") {
      return resource.collection !== true && (resource.format === "PDF" || resource.format === "TXT") &&
        (actor.role === "admin" || resource.userAuthorized === true);
    }
  }
  return actor.role === "admin" || (resource.type === "collective" && action === "read");
}

/** Le refus ne révèle ni contenu, ni existence, et n'exécute jamais le producteur. */
export async function protectedOperation<T>(actor: AccessActor | null | undefined, action: AccessAction,
  resource: AccessResource, operation: () => T | Promise<T>): Promise<{ allowed: false } | { allowed: true; data: T }> {
  if (!canAccess(actor, action, resource)) return { allowed: false };
  return { allowed: true, data: await operation() };
}
