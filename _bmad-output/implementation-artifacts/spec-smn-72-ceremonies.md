# SMN-72 — Cérémonies Scrum générées lors de la création des Sprints

Jira : https://lmn24.atlassian.net/browse/SMN-72

## Réalisation initiale
- Service `src/server/sprints/ceremonies.ts` : calcul et stockage de Planning, Daily, Review, Rétro.
- Durée 1–4 semaines : Planning 2/4/6/8 h, Review 1/2/3/4 h, Rétro 45/90/135/180 min, Daily 15 min. Marge 30 minutes avant la borne de fin.
- Daily sauf jour initial, samedi, dimanche et dates explicitement exclues par le moteur. Les indisponibilités individuelles ne sont jamais utilisées pour éliminer un Daily.
- Les créations unitaires et les confirmations de lots enregistrent les cérémonies dans **la même transaction** que les Sprints ; aucun enregistrement pour un Sprint historique après sa fin.
- Horaires locaux convertis par fuseau IANA pour chaque date. Planning à la borne de début ; les cérémonies finales sont accolées et sans chevauchement.

## Limites et recette
- Le paramétrage utilisateur des timeboxes et la sélection des jours collectifs fériés ne sont **pas encore reliés** à l'interface et au référentiel de disponibilité. Les durées restent des valeurs par défaut dans cette implémentation ; AC3 partiel.
- Vérifier la conversion IANA et DST, les exclusions des jours fériés collectifs, le cas d'un Sprint à courte durée et les chevauchements, les créations historiques.
- Compiler TypeScript, appliquer la migration PostgreSQL, exécuter la recette et vérifier rollback transactionnel.
- GitHub Actions indisponible. Aucun merge sur `main`.
