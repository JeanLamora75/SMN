# SMN-114 — Composition des six sections standard du rapport

Jira : https://lmn24.atlassian.net/browse/SMN-114 — Story 6.3 selon le libellé Jira.

## Réalisation

- Service `src/server/reports/standard-composition.ts` : structure standard dans l'ordre exact Synthèse exécutive, Objectifs, Indicateurs et tendances, Événements Agile, Points d'attention, Décisions et actions.
- Sources strictement enregistrées : contexte équipe/Sprint, objectifs, SP/tickets, cérémonies et fiches explicitement liées au Sprint. Les périodes clôturées utilisent leur JSON de clôture Vn, sans relecture des fiches centrales.
- Les sections vides ou historiquement indisponibles sont indiquées sans inventer de KPI, de tendances ni de décision. Composition par SELECT sans mutation métier.
- La page de préparation SMN-113 affiche les sections dans l'ordre avec traductions FR/EN ; liens directs vers les fiches lorsque disponibles.
- Tests de contrat : `tests/smn-114-standard-report.test.ts`.

## Limites et dépendances

- Le code ne calcule pas encore de courbes ni de synthèse narrative automatique ; « tendances » représente pour le moment les valeurs fiables connues.
- La lecture des quatre registres autres que risques/dépendances demeure limitée par la couverture des associations SMN-111. Les faits marquants et les données d'autres cérémonies sources ne sont pas encore consolidés.
- Le PDF et les options personnalisées dépendront des Stories suivantes. Aucun test, typecheck, build, recette navigateur ou PostgreSQL exécuté depuis ChatGPT ; Jira ne doit pas être clôturée sans recette.
- Le numéro Jira SMN-114 porte le libellé **Story 6.3**, ce qui implique de vérifier la couverture de la Story 6.2 séparément.

## Vérifications Windows

```powershell
git pull
pnpm typecheck
pnpm exec tsx --test tests/smn-114-standard-report.test.ts
pnpm i18n:check
pnpm build
```
