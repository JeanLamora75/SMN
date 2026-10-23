# SMN-113 — Préparation du rapport depuis la fiche Sprint

Jira : https://lmn24.atlassian.net/browse/SMN-113

## Livraison sur main

- Action « Générer un rapport » visible uniquement pour l'Administrateur depuis l'entête de la fiche Sprint.
- Page de préparation `/app/admin/sprints/[sprintId]/report`, avec identité exacte récupérée en base : Sprint, équipe, produit, dates, fuseau et statut ; aucune ressaisie du Sprint.
- Lecture seule de données fiables : objectifs courants pour les cycles non clôturés, objectifs de la dernière version de clôture pour un Sprint clôturé. Source historique indisponible explicitement affichée sans inventer d'objectifs.
- Modèle standard proposé, alerte de caractère provisoire pour tout Sprint non clôturé, retour à la fiche sans écriture ni export.
- Contrôle Admin sur page et endpoint GET `/api/admin/reports/sprints/[id]/prepare`. Aucun endpoint d'export n'est introduit dans cette Story ; le refus d'une URL forgée est assuré pour cet endpoint.
- FR/EN ; tests de contrat dédiés préparés.

## Limites et validations

- Le modèle standard est proposé, mais le PDF et le formulaire de personnalisation sont prévus dans les prochaines Stories Epic 6.
- L'intégration de toutes les métriques et sections du rapport reste à développer. Les objectifs fiables disponibles constituent le premier contenu.
- Aucun test, typecheck, build ni recette PostgreSQL/navigateur exécuté sur l'environnement de l'utilisateur. GitHub Actions indisponibles ; Jira reste ouverte.

Validation Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-113-sprint-report-preparation.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
