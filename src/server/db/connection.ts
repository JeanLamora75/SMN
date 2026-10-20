import "server-only";

// Garder le verrou server-only aux points d'entrée Next ; le probe technique
// est indépendant et exécuté directement par les tests intégrés PostgreSQL.
export { probePostgres } from "./probe";
