# SMN-122 — Modèle Standard protégé

Jira : https://lmn24.atlassian.net/browse/SMN-122 — Story 6.10.

## Publication main
- Modèle `standard` défini en code, immuable, six rubriques actives et options de contenu par défaut.
- Lecture de catalogue sans écriture ni besoin de migration préalable.
- API administrateur `/api/admin/reports/templates` : liste et duplication transactionnelle du modèle Standard sous un nouvel UUID ; refus explicite de suppression de `standard` avant toute interrogation de base, avec contrainte SQL interdisant cet ID dans les copies.
- Panneau Bootstrap FR/EN de visualisation et duplication depuis la préparation du rapport.
- Tests unitaires préparés dans `tests/smn-122-report-templates.test.ts`.

## Limites
- Les copies sont enregistrées avec leur identité et leurs options propres, mais **l'édition et la sélection d'une copie comme modèle de préparation ne sont pas encore raccordées**. Ce point limite AC4 (« copie personnalisable »).
- Aucun export PDF disponible ; la prévisualisation existante emploie le modèle standard.
- Aucune exécution de tests, de `pnpm typecheck`, de `pnpm build` ou de recette PostgreSQL/navigateur n'a été réalisée ici. Jira reste ouverte.

Validation Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-122-report-templates.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
