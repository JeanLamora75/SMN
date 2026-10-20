import type { Diagnostic } from "./installation/diagnostic";

// Aucun dispositif de session n'est livré dans SMN-11 : refus par défaut.
// L'autorisation réelle ne sera ouverte qu'après SMN-12/SMN-14.
export function canVisitSetup(diagnostic: Diagnostic): boolean {
  return diagnostic.status === "virgin" && diagnostic.canEnterSetup;
}

export function canVisitPrivate(): boolean {
  return false;
}
