# SMN-77 — Générer les occurrences des modèles actifs

Jira : https://lmn24.atlassian.net/browse/SMN-77

## Réalisation
- Le moteur introduit dans SMN-76 est appelé lors des créations unitaires et par lot, au sein de la transaction de génération du Sprint.
- Génération suivant la fréquence : quotidienne du lundi au vendredi, hebdomadaire selon le jour ISO, une fois par Sprint selon la position début/fin.
- Application de l'heure locale IANA et de la durée ; conservation de l'identifiant et de la révision du modèle utilisé.
- Seuls les modèles actifs sont lus au moment de créer le Sprint. Les modèles désactivés n'effacent aucune occurrence.
- Aucune occurrence générée pour un Sprint dont la fin réelle est antérieure à la création.
- Protection contre les doublons par contrainte `UNIQUE(template_id,sprint_id,starts_at)` ; compteur de créations corrigé pour ne compter que les INSERT effectifs.
- API GET /api/admin/sprints/template-occurrences et liste de consultation des occurrences versionnées, y compris celles issues d'un modèle devenu inactif. Interface FR/EN.

## Limites et vérifications
- Les occurrences demeurent dans `smn_scrum_template_occurrence`, sans intégration complète au calendrier central ni au mécanisme des conflits.
- Les jours collectifs chômés, jours fériés et exceptions de calendrier n'ont pas encore été reliés à la génération quotidienne.
- Le traitement IANA des horaires ambigus/inexistants et l'application des règles de positionnement près des bornes nécessitent une recette.
- Tests attendus : les 3 fréquences, absence de doublons, désactivation, modification après création, rétrosaisie historique, rollback du lot, permissions et affichage des occurrences anciennes.
- Compilation TypeScript, validation Prisma, migration PostgreSQL et tests locaux non exécutés. GitHub Actions indisponible.

**Statut : implémentation partielle, PR en brouillon, non fusionnée sur main.**
