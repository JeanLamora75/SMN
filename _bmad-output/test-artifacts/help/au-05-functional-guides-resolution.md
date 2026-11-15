# AU-05 — Enrichissement des guides Rapports, Membres et Paramètres généraux

**Agent responsable :** Camille — documentation utilisateur BMAD  
**Date de consultation :** 2026-11-15  
**Périmètre :** six guides Markdown FR/EN, deux index de recherche, suite de tests et CI dédiée  
**État CI :** [run final 43690693920](https://github.com/JeanLamora75/SMN/actions/runs/43690693920) — **success** ; index, contrats (dont AU-05), Chromium trois fois, TypeScript, i18n et build validés. Le [premier run 43690576483](https://github.com/JeanLamora75/SMN/actions/runs/43690576483) a échoué sur une assertion de test qui utilisait `template` au lieu de la clé réelle `model` ; assertion corrigée, sans changement des guides.

## Diagnostic

Les articles `reports`, `members` et `general-settings` étaient présents dans les deux langues, mais n'expliquaient presque pas les opérations réelles. Ils ont été enrichis en préservant leur identifiant canonique et leur source unique pour le Centre d'aide et les modales contextuelles.

## Sources fonctionnelles vérifiées dans GitHub

- **Rapports :** `src/app/app/reports/page.tsx`, `new-report-form.tsx`, `office-template-catalog.tsx`, `office-tag-configurator.tsx`. Quatre onglets `reports/templates/tags/archives`, filtres et lecture ; création conditionnée à l'administrateur, cycle, modèle, titre et langue ; génération Word/PPT en téléchargement ou enregistrement, styles, sélection des photographies tickets, confirmation d'écrasement.
- **Membres :** `src/app/app/admin/members/team-overview.tsx`, `src/app/app/admin/members/[id]/page.tsx`. Vue Cartes/Liste, préférences navigateur, filtres recherche/rôle/fonction/statut, deux sections actifs/inactifs, modale d'ajout et consultation des profils et affectations. Le catalogue `src/lib/help-catalog.ts` réserve le guide détaillé aux comptes administrateurs.
- **Paramètres généraux :** `src/app/app/admin/settings/general/page.tsx`, `src/app/app/admin/settings/settings-form.tsx`, `src/server/access-policy.ts`. Accès administratif, trois onglets Général/Langue/Apparence ; mode Agile et produit non éditables ; pays de référence, langue FR/EN, thème clair/sombre, quatre palettes ; brouillons, conflit de révision, rechargement et enregistrement.

## Modifications

| ID canonique | Fichiers FR/EN | Contenu ajouté |
|---|---|---|
| `reports` | `content/help/{fr,en}/reports.md` | Parcours par onglet, consultation, création conditionnelle, génération Office, téléchargement/enregistrement, tags et dépannage |
| `members` | `content/help/{fr,en}/members.md` | Navigation, vues, filtres, création et contrôles des profils/affectations, restriction des actions |
| `general-settings` | `content/help/{fr,en}/general-settings.md` | Champs réels des onglets, opérations de sauvegarde, conflits, erreurs et contrôle final |

Les index `content/help/.index/fr.json` et `en.json` ont été mis à jour avec l'algorithme existant de `scripts/build-help-index.mjs`, sans modifier le format.

## Contrats et recette

Nouveau test bloquant `tests/help-au05-functional-guides.test.ts` : comparaison des guides aux vrais composants, à leurs options et aux droits, lecture FR/EN et vérification d'index à jour. Inclus dans `.github/workflows/help-quality.yml` avec les tests antérieurs AU-01 à AU-04, Chromium, i18n, typecheck et build.

**Preuve CI :** [GitHub Actions run 43690693920](https://github.com/JeanLamora75/SMN/actions/runs/43690693920), conclusion **success**, exécution complète. Tests de fixtures Chromium, pas un parcours authentifié sur Windows.

## Hypothèses exclues et limites

- Aucune nouvelle fonction de reporting, aucun nouvel onglet, aucune autorisation supplémentaire, aucun accès à PostgreSQL ou API métier ajouté.
- L'existence d'un modèle Office n'atteste pas des valeurs nécessaires à sa génération. Les erreurs et données manquantes demeurent explicites dans les guides.
- Les noms des menus sont décrits à partir du code ; une recette navigateur réelle avec PostgreSQL reste nécessaire pour confirmer le rendu complet, les traductions affichées et les parcours de téléchargement.
- Les articles sont produits uniquement en FR/EN ; les futures langues seront ajoutées dans des fichiers séparés.
- Aucune User Story Jira modifiée ; aucun script `uv` exécuté.

**Suivi suggéré :** AU-06 (FAQ et lien de première configuration), AU-07 (documentation de maintenance), puis recette réelle des parcours Aide par Murat.
