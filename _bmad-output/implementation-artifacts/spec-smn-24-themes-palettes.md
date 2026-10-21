# SMN-24 — Story 1.15 : personnalisation visuelle

**Source :** Jira SMN-24, FR-63/72, D-PRD-001/127, F-112..115, AD-4/28/31 et UX-DR13/14.

**Périmètre implémenté :** thème global clair/sombre, palettes prédéfinies Océan/Forêt/Violet, protections sur préférences et audit, variables CSS Bootstrap et navigation conservant le thème.

**Arbitrages :** les palettes sont fixes, validées côté serveur et en PostgreSQL (pas de choix de couleurs arbitraires), pour garantir un contraste contrôlé. L'état sûr est clair/Océan. Conserver les deux profils admin et utilisateur sans privilège délégué ; seul l'Administrateur modifie l'apparence. Aucun changement métier.

**Migration :** additive v5 → v6, rétrocompatibilité des anciennes requêtes PATCH et de l'ensemble des paramètres existants. Cf. [Documentation technique](../../docs/APPARENCE-SMN-24.md).

**Tests créés/élargis :** `tests/appearance.test.ts`, `tests/general-settings.test.ts`, `tests/installation-diagnostic.test.ts`, `scripts/verify-http-ci.mjs`.

**Statut BMAD :** développement intégré à `main` par les [PR #19](https://github.com/JeanLamora75/SMN/pull/19) et [PR #20](https://github.com/JeanLamora75/SMN/pull/20) ; qualification CI, tests réels et recette Windows toujours en attente.
