import type { Diagnostic } from "./installation/diagnostic";
export function canVisitSetup(diagnostic: Diagnostic): boolean {
  return diagnostic.status === "database-missing" || (diagnostic.status === "virgin" && diagnostic.canEnterSetup);
}
export function canVisitPrivate(account?: {role: string; mustChangePassword: boolean} | null): boolean {
  return !!account && (account.role === "admin" || account.role === "user") && !account.mustChangePassword;
}
