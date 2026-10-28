/** Activation explicitement demandée en environnement local.
 * Le code seul ne suffit pas à activer le multiéquipes : deux variables
 * indépendantes doivent être définies sur la machine.
 *
 * IMPORTANT : cette bascule est expérimentale tant que la recette à deux
 * équipes et les parcours transversaux ne sont pas validés.
 *
 * Revenir à false (ou supprimer la variable) désactive immédiatement
 * les nouveaux points d'entrée au prochain démarrage du serveur.
 */
export const MULTI_TEAM_CONTEXT_READY:boolean=
 process.env.SMN_MULTI_TEAM_CONTEXT_READY==="true"&&
 process.env.SMN_MULTI_TEAM_PILOT_ACK==="I_ACCEPT_UNVERIFIED_ISOLATION";
