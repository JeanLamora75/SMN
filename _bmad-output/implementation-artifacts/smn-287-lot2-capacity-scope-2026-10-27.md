# Lot 2 — Audit capacité et historique du tableau de bord

## Défaut corrigé

Dans `src/server/dashboard/cycle-reader.ts`, `readCapacity` appelait `readActualCapacity` avec `{externalTransaction:true}` sans préciser `teamId`. Le lecteur refusait alors la v29 ou risquait une interprétation monoéquipe. Il reçoit désormais `{externalTransaction:true,teamId}` provenant du contexte du Sprint préalablement contrôlé.

## Contrats examinés

- `readInitialSnapshot` filtre par équipe, dates de début et fin.
- `readDevelopmentCapacity` prend en charge `teamId` et borne les membres à cette équipe.
- `readActualCapacity` filtre en v28/v29 et répercute le `teamId` au calculateur de développement.
- Les instantanés historiques et les indicateurs manuels de Sprint utilisent des clés `sprint_id`, protégées en entrée par le contrôle `sprint.id / teamId`. Les routes indépendantes restent à examiner.
- Les opérations historiques d'ouverture/écriture de capacité restent à sécuriser séparément avant activation.

Lecture statique uniquement : tests d'isolation A/B, compilation et recette PostgreSQL restent à réaliser. Aucun verrou, migration ou branche `main` modifié.
