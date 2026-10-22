# SMN-82 — Replanifier les bornes d'un Sprint

Jira : https://lmn24.atlassian.net/browse/SMN-82

## Réalisation initiale
- Proposition de nouvelles bornes UTC pour un Sprint existant, dans son équipe Scrum.
- Refus des dates invalides, des périodes clôturées et des chevauchements avec un Sprint actif d'une même équipe.
- Option « Conserver les dates des événements » appliquée par défaut ; événements standards, personnalisés et exceptionnels jamais réécrits.
- Aperçu des événements hors des nouvelles bornes, sans déplacement automatique.
- Confirmation explicite avec jeton d'aperçu lié aux bornes précédentes ; transaction PostgreSQL et audit ancien/nouveau début et fin.
- Aucune modification des valeurs de capacité, des déclarations manuelles, des événements tiers ni des PDF historiques.
- UI et API administrateur FR/EN.

## Limites de conformité
- L'option de recalcul explicite n'est pas livrée : une tentative est refusée avec `recalculation-not-supported`. AC2 et AC3 partiels.
- Le formulaire utilise provisoirement un identifiant UUID de Sprint plutôt qu'une liste conviviale.
- Le jeton d'aperçu ne protège que les bornes initiales et non un instantané complet de tous les événements ; le serveur revalide le chevauchement lors de la confirmation mais pas les changements concurrents sur les événements.
- La correspondance au calendrier collectif, les capacités et les politiques complètes de verrouillage de périodes nécessitent une recette.
- Compilation TypeScript, validation Prisma, migration PostgreSQL et tests non exécutés. GitHub Actions indisponible.

État : développement partiel en PR brouillon, à ne pas fusionner sur main avant correction/recette.
