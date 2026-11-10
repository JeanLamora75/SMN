# SMN-434 — Paramètres V2, six familles et i18n exhaustive

Date : 10 novembre 2026. Epic Jira [SMN-223](https://lmn24.atlassian.net/browse/SMN-223) ; Story [SMN-434](https://lmn24.atlassian.net/browse/SMN-434).

## Périmètre et contrat BMAD

Contrat de Sally validé : `_bmad-output/planning-artifacts/ux-designs/ux-parametres-reorganisation-2026-11-10/` (DESIGN, EXPERIENCE, CATALOGUE-ET-ROUTES, RECETTE-UX, CONTRAT-DEVELOPPEMENT). Six groupes et 19 entrées canoniques, préservation du mode Scrum/Kanban, des permissions et des URL de chaque écran. Un accueil, pas de nouveaux réglages métiers.

**Contrainte utilisateur bloquante** : tous les textes visibles des composants nouveaux ou modifiés doivent être internationalisés en français et anglais : titres, familles, descriptions, placeholders, boutons, états, résultats, aides, liens Retour, textes d'accessibilité, en-têtes et mots-clés de recherche. Aucune nouvelle chaîne UI en dur dans ces composants. Les fichiers `src/i18n/fr.json` et `src/i18n/en.json` sont les sources de vérité.

## Fichiers mis à jour

- `src/lib/settings-catalog.ts` : six familles et 19 entrées, ancien contenu de `showCompanies` intégré au registre, permission `adminOnly` pour Indicateurs, Entreprises, Liens, Styles de graphiques, Maintenance, maintien des ressources `settings/accounts/backups/audit`. Cadence contextuelle Scrum/Kanban, capacité non cliquable.
- `src/lib/settings-catalog-search.ts` : filtre pur local, sans API, accent/casse insensibles, ET entre mots, titres/description/alias localisés, groupes vides masqués et aucun accès aux données métier.
- `src/app/app/admin/settings/settings-catalog-view.tsx` : vue unifiée Cartes/Liste, icônes du composant `BootstrapIcon`, recherche, remise à zéro, état vide, compteur localisé, adaptation responsive, préférence `smn-settings-catalog-view` préservée.
- `src/app/app/admin/settings/page.tsx` : passage du catalogue unifié au composant, suppression du prop `showCompanies` et de ses sections annexes.
- `src/i18n/fr.json` et `src/i18n/en.json` : nouveaux titres et descriptions, six groupes, 19 familles de mots-clés, recherche, navigation et en-têtes des écrans correspondants.
- `src/app/app/admin/settings/links/page.tsx`, `links/links-admin-inventory.tsx`, `indicators/page.tsx`, `reports/charts/page.tsx` : liens Retour et libellés de présentation désormais localisés, sans texte utilisateur de remplacement en dur.

## Tests et CI

- Contrats préexistants adaptés : `tests/smn-224-settings-portal.test.ts`, `smn-225-settings-catalog.test.ts`, `smn-226-settings-view.test.ts`, `smn-227-settings-navigation.test.ts`, `settings-cockpit-ux.test.ts`, `smn-282-team-settings.test.ts`.
- Nouveau `tests/smn-434-settings-v2-i18n.test.ts` : 19 entrées uniques, six groupes, autorisations, contexte Scrum/Kanban, navigation des ancres, recherche FR/EN, diacritiques, alias, textes affichés via traduction.
- Workflow GitHub Actions ciblé `.github/workflows/smn-434-settings-v2.yml` : `pnpm install --frozen-lockfile`, `pnpm i18n:check`, tests `tsx --test`, `pnpm typecheck`. Aucun script `uv` invoqué.

### Grille de qualification

| Contrôle | Résultat à la publication |
|---|---|
| Existence réelle des fichiers/commits sur `main` | Vérifiée par lecture GitHub |
| Inventaire et clés FR/EN | Inspection statique — à confirmer par la CI |
| Workflow ciblé GitHub | Créé ; résultat réel à consulter |
| `pnpm i18n:check` | Non exécuté localement |
| Contrats `tsx` | Non exécutés localement |
| `pnpm typecheck` et build | Non exécutés localement |
| Recette navigateur Windows et 30 critères Sally | Non exécutée |

**Attention** : aucun script `uv` n'a été exécuté. Ne pas déclarer la Story `Done` avant preuve d'une CI réellement verte et recette fonctionnelle. Ce document distingue la publication de l'exécution.
