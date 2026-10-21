# SMN-24 — Story 1.15

Règle BMAD : thèmes clair/sombre prévalidés uniquement ; `data-bs-theme` sur HTML et couleurs fondées sur variables Bootstrap et SMN.

Source normative : Jira SMN-24 ; FR-63/72, D-PRD-001/127, F-112–115, AD-4/28/31, UX-DR13/14.

Choix : réutiliser le paramètre général existant, sans migration ni changement des API métiers. Application après sauvegarde via `router.refresh()` ; lecture serveur avec repli light. Les couleurs métier restent accompagnées de textes/états.

Tests : `tests/theme.test.ts`, plus les tests existants `tests/general-settings.test.ts` et `tests/authorization.test.ts`. Recette CI et PC non encore attestée. Voir [documentation](../../docs/THEMES-SMN-24.md).

Intégration : [PR #19](https://github.com/JeanLamora75/SMN/pull/19) fusionnée dans `main` le 21/10/2026. Tests et recette Windows non attestés.
