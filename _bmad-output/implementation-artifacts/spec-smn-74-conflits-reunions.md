# SMN-74 — Alertes non bloquantes de conflits de réunions

Jira : https://lmn24.atlassian.net/browse/SMN-74

## Implémentation initiale
- Détection de recouvrement réel entre segments de cérémonies de la même équipe : les intervalles qui se touchent sans durée commune ne sont pas signalés.
- Signalement des cérémonies se déroulant pendant une fermeture collective de l'équipe, sans déplacer ni supprimer automatiquement les cérémonies.
- API GET /api/admin/sprints/meeting-conflicts, accessible selon les permissions administrateur.
- Consultation des alertes sur /app/admin/sprints avec traductions FR et EN.
- Aucun enregistrement ni modification des réunions à la simple consultation. Les avertissements sont non bloquants.

## Réserves fonctionnelles importantes
- Le référentiel actuel des cérémonies ne couvre pas l'intégration des réunions personnelles ou exceptionnelles. Leur croisement (AC2) doit être raccordé au futur référentiel d'événements.
- Le parcours de création et de modification manuelle d'événements ne propose pas encore un choix explicite de persister malgré l'alerte (AC3 incomplet).
- Les alertes ne sont pas encore intégrées dans l'aperçu d'un lot avant création, mais uniquement dans la consultation des cérémonies persistées (AC1 partiel).
- Les dates de fermeture collective sont contrôlées ; les jours fériés nationaux et autres journées collectives non travaillées restent à intégrer (AC5 partiel).
- Compilation TypeScript, recette PostgreSQL et vérification des fuseaux, des segments et des droits non exécutées. GitHub Actions indisponible.

## Tests de recette
1. Deux segments partiellement superposés : avertissement avec bornes communes.
2. Deux segments contigus sans recouvrement : aucune alerte.
3. Deux réunions de deux équipes différentes : aucune alerte.
4. Cérémonie sur fermeture collective : alerte sans déplacement.
5. Lecture API par utilisateur non autorisé : refus 403.
6. Vérifier les événements personnels/exceptionnels et le parcours de confirmation manuelle quand ces tables seront disponibles.

État : implémentation partielle en branche dédiée, PR brouillon, non fusionnée sur main.
