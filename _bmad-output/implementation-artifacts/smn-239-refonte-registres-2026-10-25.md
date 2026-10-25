# SMN-239 — Registres globaux : compte rendu d'incrément (non validé)

**Date :** 25 octobre 2026. **Branche :** `feat/smn-239-registres-transverse`.
**Jira :** https://lmn24.atlassian.net/browse/SMN-239.
**Revue :** https://github.com/JeanLamora75/SMN/pull/126 (brouillon).
**Contrats :** `_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/`.

## Implémentation réelle

- `src/server/registries/list.ts` : périmètre équipe, catégorie `all`, recherche, statut, responsable restreint aux admins, état à suivre/final, tri explicite, filtrage par cycle **avant** décompte et pagination. Associations multiples filtrées par `EXISTS`, sans multiplication des lignes.
- **Scrum :** réutilisation de `smn_registry_cycle_link` + `smn_sprint`.
- **Kanban :** réutilisation de `smn_kanban_registry_link` + `smn_kanban_period`, déjà existantes dans `src/server/kanban/qualitative.ts`. Aucune création ou mutation du modèle.
- `src/app/api/admin/registries/cycles/route.ts` : inventaire de cycles de l'équipe installée, soumis à l'autorisation collective.
- `src/app/app/admin/registries/page.tsx` et `registry-list.tsx` : affichage transversal, catégories exclusives, recherche, filtres, cycle facultatif, tri, pagination et relances en cas de panne.
- `src/i18n/fr.json`, `en.json` : libellés.
- `tests/smn-239-registry-transverse.test.ts` : 10 scénarios écrits, **non exécutés** ; `tests/smn-90-registry-list.test.ts` : assertions historiques adaptées, **non exécutées**.

## Règles protégées

- `highlight.recorded` reste **non classé** entre les filtres « À suivre » et « États finaux », sans inventer une nouvelle transition.
- Le registre global conserve la lecture collective admin/user ; le propriétaire n'est ni filtrable ni renvoyé au rôle user.
- Un cycle hors équipe ne produit aucune fiche ; une table de liaison absente signale **indisponible** au lieu de renvoyer zéro.
- Les enregistrements, audits, snapshots de clôture, exports et réunions existants **ne sont pas modifiés** par cet incrément.
- Aucune règle de suppression, extension d'autorisation d'historique ou seuil d'alerte n'a été introduit.

## État de validation (preuves distinctes)

| Contrôle | Résultat |
|---|---|
| Lecture des sources, contrats UX et Jira | Réalisée via connecteurs |
| Contrôles statiques ciblés des fichiers GitHub | **19/19 positifs** (inspection de structure seulement) |
| Parité des clés `registryList` FR/EN | Vérifiée par parsing JSON |
| Tests ciblés des fichiers TypeScript | **Non exécutés** |
| `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` | **Non exécutés** |
| Recette navigateur 320/375/768/1024/1440, thèmes, clavier, droits | **Non exécutée** |
| GitHub Actions / CI | Aucun statut de test positif disponible |

**Limitation d'environnement :** pas de checkout SMN sur le conteneur d'exécution et accès réseau GitHub DNS indisponible ; Node v22 présent mais le projet exige Node v24 et pnpm 12. Cette différence empêche d'attester le build/test. Aucun script BMAD `uv run` n'a été exécuté.

## Prochain contrôle local possible (Windows, sans nouvelle installation)

Sur une copie existante du dépôt et après récupération de la branche via GitHub Desktop :

```powershell
pnpm exec tsx --test tests/smn-90-registry-list.test.ts tests/smn-239-registry-transverse.test.ts
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Consigner les sorties, corriger tout échec avant fusion et avant SMN-240.

**Statut : travaux implémentés sur branche, non fusionnés, Story non terminée au sens de sa Definition of Done.**
