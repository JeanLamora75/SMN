# SMN — P2 : fiabilisation des contrats et consolidation CI

**Date :** 2026-11-04  
**Agent :** Amelia (adaptation GitHub du skill BMAD installé, pas d'exécution uv)  
**Périmètre :** recommandations P2 issues de l'audit TEA du 04/11/2026.  
**Statut :** changements publiés sur `main` ; recette CI complète **non encore confirmée**.

## Audit et constats

1. `scripts/validate-version.mjs` définit depuis la v33 un orchestrateur unique et des profils : `smn-348`, `smn-349`, `smn-350`, `smn-351`, `quality`, `migration-v33`.
2. Les quatre workflows spécialisés exécutaient chacun les contrôles communs `i18n:check`, `typecheck`, `lint` ; une anomalie partagée provoquait donc plusieurs jobs rouges. Le job Linux I0 appelle déjà `node scripts/validate-version.mjs --profile quality` et conserve les tests PG complets. Son job Windows reste indépendant.
3. Deux contrats Dashboard Builder lisaient des expressions littérales du code plutôt que de valider les fonctions de gestion de layout, les emplacements visibles et leur géométrie. Le moindre refactoring pouvait les invalider sans régression.

## Modifications apportées

### Orchestration CI

- Extension rétrocompatible de `scripts/validate-version.mjs` : `--scope feature`, réservé aux quatre profils spécialisés. Ce mode garde tous les tests fonctionnels et PostgreSQL, mais retire les trois étapes qualité communes. Sans option, **`--scope full` reste la valeur par défaut**, et les profils PG exigent toujours une URL dédiée.
- Mise à jour de `.github/workflows/smn-348-input.yml`, `smn-349-reporting.yml`, `smn-350-report-projection.yml`, `smn-351-cutover.yml` pour n'exécuter que les tests métiers de chaque profil. **Aucun test métier supprimé.**
- Maintien du profil `quality` sous I0, des jobs Windows/Linux et des garde-fous de migration. Le mode `feature` est interdit pour `quality` et `migration-v33`.
- Renforcement de `tests/version-validation-runner.test.mjs` pour vérifier profils complets et ciblés, refus des détournements, URL PostgreSQL obligatoire et propriété de la qualité commune dans I0.

### Tests du Dashboard Builder

- `tests/dashboard-header-cockpit.test.ts` : validation du comportement réel `createDefaultDashboardLayout` et du rejet d'un troisième bloc d'en-tête par `validateDashboardLayout`. Conservation des garde-fous de permissions et des éléments de navigation.
- `tests/smn-dashboard-slot-cockpit-modal.test.ts` : vérification de `visibleSlots` et `gridColumns` pour les emplacements vides, incomplets et renseignés. Conservation des garanties serveur `requireDashboardPermission`.

## Invariants

- Pas de modification des services métier v33, modèles PostgreSQL, droits, scripts de migration, fonctionnalités de production ou jeux de données.
- Les contrôles `lint`, `typecheck` et `i18n:check` restent obligatoires dans le pipeline I0. L'échec d'I0 reste bloquant pour conclure que la CI est verte.
- Les validations spécialisées **restent des jobs distincts**, pour conserver une lecture par Story, mais leurs échecs ne dupliquent plus ceux du contrôle qualité commun.
- Les profils par défaut restent complets et inchangés dans leurs étapes. Les rapports de validation mentionnent désormais le champ `scope` en plus des étapes, de la plateforme et du SHA.

## Contrôles et limites

Présence et cohérence des 8 fichiers modifiés vérifiées par relecture de `main` via GitHub. Les nouveaux scénarios de test et la configuration GitHub Actions ont été inspectés statiquement.

**Non effectués dans cet environnement :** exécution locale Node/pnpm, `pnpm test:validate-version`, `pnpm typecheck`, `pnpm lint`, tests unitaires TSX, tests PostgreSQL et build Next. Aucun statut vert global n'est présumé. Les exécutions GitHub Actions sur le dernier commit étaient encore en cours ou en attente au moment du bilan.

## Procédure de validation

```powershell
git pull origin main
pnpm test:validate-version
pnpm exec tsx --test tests/dashboard-header-cockpit.test.ts tests/smn-dashboard-slot-cockpit-modal.test.ts
pnpm typecheck
pnpm lint
```

Vérifier ensuite le job `quality` I0 et les jobs Windows / Linux sur **le même SHA**, et confirmer que les profils spécialisés n'exécutent plus `i18n:check`, `typecheck` et `lint` en double.

[GitHub Actions sur main](https://github.com/JeanLamora75/SMN/actions?query=branch%3Amain)
