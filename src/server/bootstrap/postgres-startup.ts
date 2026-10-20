/**
 * Diagnostic public des erreurs de démarrage du PostgreSQL PRIVÉ à SMN.
 * Ne jamais transmettre le journal brut : il peut révéler des chemins du poste.
 * Le texte en entrée provient uniquement des nouveaux octets ajoutés au journal
 * entre la tentative pg_ctl start et son échec.
 */
export type PgStartupFailure =
  | "managed-pg-port-in-use"
  | "managed-pg-bind-denied"
  | "managed-pg-permission-denied"
  | "managed-pg-shared-memory"
  | "managed-pg-locked"
  | "managed-pg-runtime-incomplete"
  | "managed-pg-config-invalid"
  | "managed-pg-data-incompatible"
  | "managed-pg-start-failed";

export function classifyPostgresStartupLog(newLines: string): PgStartupFailure {
  const text = newLines.slice(-12000).toLowerCase();
  const bindIssue = /(n.a pas pu lier|could not bind|could not create (?:any )?tcp\/ip sockets|n.a pas pu créer.*socket tcp\/ip|n.a pas pu créer le socket d.écoute)/i.test(text);
  if (bindIssue && /(permission denied|access denied|access is denied|accès refusé)/i.test(text)) {
    return "managed-pg-bind-denied";
  }
  if (/(address already in use|could not bind.*address|only one usage of each socket|adresse.*déjà utilisée|port.*already in use)/i.test(text)) {
    return "managed-pg-port-in-use";
  }
  if (/(lock file.*already exists|postmaster\.pid.*already exists|is another postmaster.*running|postmaster\.pid.*exists)/i.test(text)) {
    return "managed-pg-locked";
  }
  if (/(could not create shared memory|shared memory segment|not enough shared memory)/i.test(text)) {
    return "managed-pg-shared-memory";
  }
  if (/(permission denied|access is denied|access denied|accès refusé|permission refusée)/i.test(text)) {
    return "managed-pg-permission-denied";
  }
  if (/(could not load library|could not find.*dll|dll.*not found|missing.*dll|could not access file.*dll)/i.test(text)) {
    return "managed-pg-runtime-incomplete";
  }
  if (/(configuration file contains errors|syntax error in file|invalid configuration parameter|unrecognized configuration parameter)/i.test(text)) {
    return "managed-pg-config-invalid";
  }
  if (/(database files are incompatible|data directory.*wrong version|control file.*invalid|database files are incompatible with server)/i.test(text)) {
    return "managed-pg-data-incompatible";
  }
  return "managed-pg-start-failed";
}
