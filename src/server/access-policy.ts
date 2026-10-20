import type { Diagnostic } from "./installation/diagnostic";
export function canVisitSetup(diagnostic: Diagnostic): boolean {
  return diagnostic.status === "database-missing" || (diagnostic.status === "virgin" && diagnostic.canEnterSetup);
}
export function canVisitPrivate(): boolean { return false; }
