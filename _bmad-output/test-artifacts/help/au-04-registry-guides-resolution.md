# AU-04 — Guides Registres FR/EN : couverture des six types

**Agent :** Camille (maintenance documentaire BMAD)
**Date de consultation :** 2026-11-15
**Périmètre :** `content/help/fr/registries.md`, `content/help/en/registries.md`, deux index de recherche et tests documentaires.
**CI :** [GitHub Actions — AU-04](https://github.com/JeanLamora75/SMN/actions/runs/43652331201) — consulter la conclusion terminale ; ne pas déduire le succès du déclenchement.

## Diagnostic initial

Le guide Registres ne documentait explicitement que risques, obstacles et dépendances. Pourtant, `src/lib/registry-types.ts` définit également `decision`, `action` et `highlight`. La page `src/app/app/admin/registries/registry-list.tsx` n'expose que trois catégories principales (`risk`, `obstacle`, `dependency`) : promettre six onglets aurait été une erreur.

## Sources consultées

- `src/lib/registry-types.ts` : types et statuts canoniques.
- `src/app/app/admin/registries/registry-list.tsx` : catégories, filtres, vue lecture seule, création.
- `src/app/app/admin/registries/registry-create-modal.tsx` : champs communs, spécificités risque/dépendance/décision, types autorisés selon contexte et validation.
- `src/lib/registry-linked-creation.ts` : création associée à un journal, limitée à actions/décisions/faits marquants.
- `src/app/app/admin/registries/registry-detail.tsx` : fiche, détails métier, relations, journal, permissions d'édition et suppression.
- `src/app/app/admin/registries/registry-delete-action.tsx` : suppression réelle et motifs de refus.
- `content/help/{fr,en}/registries.md` et `scripts/build-help-index.mjs`.

## Modifications documentaires

| Type canonique | Couverture ajoutée en français et anglais | Statuts du modèle |
|---|---|---|
| `risk` | Probabilité, impact, ROAM | `open`, `resolved` |
| `obstacle` | Suivi d'un obstacle rencontré | `open`, `in_progress`, `resolved`, `abandoned` |
| `dependency` | Demandeur, contributeur, partie externe, situation à risque et cohérence des parties | `open`, `in_progress`, `satisfied`, `cancelled` |
| `decision` | Justification et remplacement d'une décision antérieure | `active`, `replaced`, `cancelled` |
| `action` | Suivi et relations entre entrées | `todo`, `in_progress`, `completed`, `cancelled` |
| `highlight` | Information notable, accès via journaux liés | `recorded` |

Les guides expliquent les trois catégories de la liste principale et les usages des autres types via les fiches/journaux, sans inventer de nouveaux onglets. Ils décrivent la consultation, les droits d'administration, la création, l'édition, la suppression et le dépannage.

## Sécurité et limites

- Aucune modification du catalogue canonique, des rôles, des API ou de PostgreSQL.
- Les liens utilisateur restent uniquement vers `/app/admin/registries`, déjà autorisé à la lecture selon le contexte.
- Les articles FR/EN réutilisent les mêmes identifiants et le même moteur du Centre d'aide/modale.
- La suppression peut échouer en raison de protections ou d'éléments liés ; le guide ne propose aucun contournement.
- Cette revue du code ne prouve pas un parcours utilisateur complet sur une vraie installation Windows/PostgreSQL.

## Preuves automatisées

`tests/help-au04-registry-documentation.test.ts` vérifie que les six types, leurs statuts, les champs réellement présents, la séparation des catégories, le journal lié, les droits et la synchronisation des deux index correspondent au code. Ce test est bloquant dans `.github/workflows/help-quality.yml`.

**Qualité à confirmer :** lire la [conclusion de la CI](https://github.com/JeanLamora75/SMN/actions/runs/43652331201) et compléter ultérieurement les essais authentifiés avec des comptes admin et utilisateur, les droits réels de suppression, et la consultation dans les deux langues.

Aucun script `uv` exécuté, aucun ticket Jira créé/modifié.
