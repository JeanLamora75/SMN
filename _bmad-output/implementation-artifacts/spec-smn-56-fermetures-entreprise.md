# SMN-56 — Story 3.15 — Administrer les jours de fermeture de l'entreprise

[Jira SMN-56](https://lmn24.atlassian.net/browse/SMN-56) · Epic 3 · Dépendances : SMN-49, 53, 54 et 55. Une équipe Scrum/Kanban pour le MVP.

## Correspondance avec les critères d'acceptation

- **AC1** : fermeture collective autonome dans `smn_company_closure`, par équipe MVP. Nom, dates inclusives, activation, révision, acteur. Aucune création dans les tables d'absence personnelle ni de jours fériés nationaux.
- **AC2** : `resolveDayAvailability` fait l'union des demi-journées indisponibles par national OU absence OU fermeture. Une date ne retire jamais plus que les deux demi-journées habituellement travaillées. Une fermeture avérée permet de conclure que les créneaux sont indisponibles même si la couverture nationale est partielle ; sans trame de travail, disponibilité inconnue.
- **AC3** : `GET /api/team-calendar` renvoie les événements de fermeture actifs avec nom et période pour les deux rôles. Le calendrier collectif les affiche textuellement. La vue Utilisateur ne révèle toujours aucun motif ou détail individuel. Aucune absence nominative n'est dupliquée.
- **AC4** : correction, annulation (`is_active=false`) ou réactivation avec révision optimiste et historique `smn_company_closure_history` (avant/après, acteur, date, numéro de version). Les clichés initiaux figés et les PDF archivés restent inchangés : aucune écriture dans leurs tables.
- **AC5** : refus explicite des dates impossibles, périodes inversées, champs non prévus et dates hors 1900–2200 avant toute transaction. Refus 409 des révisions dépassées ou fermetures actives qui se chevauchent. Les transactions échouées ne changent rien.

## Réalisation

Migration additive **v19 → v20** dans `src/server/closures/migration.ts` et miroir `prisma/migrations/20261021_smn56_company_closures/migration.sql`. Tables `smn_company_closure` et `smn_company_closure_history`, intégration aux scripts de migration, sonde, diagnostic, contrat d'installation et modèles Prisma. Lien à une équipe (pas à une personne), références protégées `ON DELETE RESTRICT`.

Service `src/server/closures/service.ts` : validation serveur, verrouillage transactionnel sur l'équipe, refus de chevauchement, historique avant/après, lecture du catalogue. API Administrateur `GET/POST /api/admin/company-closures`, via `authorizeApi` pour la ressource `settings`, avec contrôle d'origine des écritures. Page `/app/admin/company-closures` pour création, correction, annulation et réactivation.

Le calendrier SMN-55 charge les fermetures actives de la période et les présente comme événements collectifs. SMN-54 lit aussi la fermeture applicable par membre et date. Des textes français/anglais sont ajoutés dans les catalogues i18n.

## Périmètre, risques et qualification

Une fermeture porte sur des **journées entières** (pas de demi-journée d'entreprise définie par cette Story). Les corrections d'une période historique affectent seulement les lectures dynamiques : aucune régénération silencieuse de PDF ou de capacité figée.

Tests de contrat et non-régression écrits : `tests/company-closures.test.ts`, `tests/team-calendar.test.ts`, `tests/member-regional-absence.test.ts`. **Aucune exécution réelle** des tests pnpm, TypeScript, PostgreSQL ou navigateur n'est attestée. GitHub Actions n'est pas utilisé. Conserver Jira **En cours** et BMAD **review** en attendant recette Windows locale. Le workflow BMAD natif `uv` n'a pas été lancé faute de checkout local ; adaptation manuelle depuis les skills lus sur GitHub.
