# SMN-83 — Objectifs du Sprint et évaluation individuelle

Jira : https://lmn24.atlassian.net/browse/SMN-83

## Implémentation
- Plusieurs objectifs par Sprint, identifiants UUID durables, état initial obligatoire `not_evaluated`.
- Quatre statuts possibles, commentaires facultatifs, édition par objectif avec révision optimiste et audit avant/après.
- API GET/POST /api/admin/sprints/goals ; bloc d'administration avec sélection du Sprint, nom et dates et objectifs.
- Contrôle serveur interdisant toute édition des objectifs d'un Sprint `closed`.
- Aucune écriture sur les autres objectifs, les autres blocs du bilan, les capacités ou les PDF.

## Réserves
- Le bloc est placé sur la page d'administration des Sprints ; une page de bilan complète, avec bloc Objectifs en première position, reste à raccorder. AC1 partiel.
- Le workflow effectif de réouverture des Sprints clôturés est hors de cette réalisation ; seule la protection est appliquée.
- Vérifier les droits, les corrections concurrentes, les quatre statuts, les audits et la non-régression des anciens PDF.
- Compilation TypeScript, validation Prisma, migration PostgreSQL et tests locaux non exécutés. GitHub Actions indisponible.

Statut : implémentation partielle en PR brouillon, non fusionnée sur main.
