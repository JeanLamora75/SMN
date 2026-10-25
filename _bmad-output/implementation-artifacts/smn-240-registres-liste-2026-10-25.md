# SMN-240 — Vue Liste enrichie et signalétique métier

**État :** implémentation sur branche, **non validée / non fusionnée**.
**Jira :** https://lmn24.atlassian.net/browse/SMN-240
**Base incrémentale :** `feat/smn-239-registres-transverse`, [PR #126](https://github.com/JeanLamora75/SMN/pull/126), toujours brouillon au moment du développement.
**Branche :** `feat/smn-240-registres-liste`.
**Contrats :** `_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/{DESIGN,EXPERIENCE,CONTRAT-DEVELOPPEMENT,RECETTE-UX}.md`.

## Modifications

- `src/server/registries/list.ts` : description persistée incluse dans les résultats déjà filtrés/paginés, sans élargir l'autorisation de lecture des responsables.
- `src/app/app/admin/registries/registry-list-row.tsx` : nouvelle ligne compacte, six icônes Bootstrap SVG réutilisées de la fiche Sprint, titre cliquable, description complète dans le DOM et tronquée **visuellement** à deux lignes, statut textuel distinct et signal SMN-104 textuel distinct ; date métier et échéance enregistrée sans heure inventée, propriétaire admin seulement, menu natif `<details><summary>` au clavier.
- `src/app/app/admin/registries/registry-list.tsx` : intégration du composant, chargement distinct et contrôlé des points d'attention `/api/admin/registries/attention`, refus d'une réponse invalide, panne signalée ; vide initial distingué d'aucun résultat filtré.
- `src/app/globals.css` : présentation desktop compacte, description 2 lignes, palette SMN, reflow des lignes sous 992 px sans scroll horizontal imposé.
- `src/i18n/fr.json`, `en.json` : libellés supplémentaires du registre.
- `tests/smn-240-registry-enriched-list.test.ts` : sept tests ciblés ajoutés (**écrits mais non exécutés**).

## Critères Jira et preuve

| Critère | État code | Preuve manquante |
|---|---|---|
| AC1 | Icône/type, lien, description, statut, propriétaire/échéance, actions — implémentés | Rendu navigateur + clavier |
| AC2 | Six SVG Bootstrap Icons existants, type/statut/attention distincts — implémentés | Inspection visuelle clair/sombre |
| AC3 | Signaux exclusivement issus de l'API SMN-104, aucune criticité calculée dans la ligne | Test producteur indisponible / risque non évalué |
| AC4 | Champ propriétaire SQL et cellule UI seulement pour admin | Tests d'API authentifiés admin/user |
| AC5 | Index/pagination de SMN-239 réutilisés, JSON FR/EN ajoutés et états vides distincts | Scénarios fonctionnels avec base persistée |

**Contrôles statiques réellement réalisés via connecteur GitHub : 18 sur 18 positifs.** La parité des clés FR/EN a été vérifiée en parsant les deux fichiers JSON.
**Tests `node:test` : non exécutés.** Aucun résultat de `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` ou `pnpm build` n'est disponible. Aucun test réel mobile/clavier/thème n'a été exécuté, aucune migration appliquée (pas de migration nécessaire).

## Vérification à réaliser sur le checkout Windows SMN

```powershell
pnpm exec tsx --test tests/smn-90-registry-list.test.ts tests/smn-239-registry-transverse.test.ts tests/smn-240-registry-enriched-list.test.ts
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Tester également les réponses `/api/admin/registries` et `/api/admin/registries/attention` avec comptes admin et user, source indisponible, 0/1/25/26 fiches, description longue, échéance absente, thèmes et petits écrans. Vérifier la non-régression de la fiche Sprint SMN-234 et des snapshots Vn.

**Note BMAD :** le workflow `uv run` et les tests locaux n'ont pas été exécutés faute d'un checkout SMN accessible dans l'environnement de cette session. L'implémentation via connecteur ne vaut pas validation ni fusion. L'étape suivante SMN-241 ne doit pas être déclarée validée tant que les contrôles requis ne sont pas exécutés.
