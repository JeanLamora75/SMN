# SMN — Réorganisation UX des Registres, Paramètres et Reportings
_Date : 25/10/2026 • Branche : main • Agent : Amelia (BMAD Dev)_

## Demande validée par capture de l'utilisateur
La page « Registres » concentrait six blocs sans distinguer consultation métier, paramétrage et préparation des exports.

### Nouvelle répartition
| Écran | Ordre / contenu |
|---|---|
| Registres | 1. Points d’attention collectifs ; 2. Consulter les registres |
| Paramètres → Paramètres des registres | Catégories automatiques du journal ; Points d’attention — échéances |
| Préparation rapport Scrum | Sélection des faits pour les reportings ; Faits marquants automatiques, à proximité des autres options du rapport |
| Préparation rapport Kanban | Les deux mêmes blocs, en administration, dans la préparation du rapport |

La consultation des six registres, la recherche, les filtres, le fonctionnement des alertes, la provenance des faits, l'invalidation des faits et les choix de reportings continuent d'utiliser les **composants et API existants**.

## Traçabilité Jira
- SMN-90 : ordre de consultation sur la page Registres.
- SMN-109 : faits marquants automatiques dans la préparation des rapports.
- SMN-118 : sélection des faits pour les reportings.
- SMN-225 : entrée de configuration dédiée au catalogue des Paramètres.

## Fichiers impactés
- `src/app/app/admin/registries/page.tsx`
- `src/app/app/admin/settings/registries/page.tsx` (nouveau)
- `src/lib/settings-catalog.ts`
- `src/i18n/fr.json` et `src/i18n/en.json`
- `src/app/app/admin/sprints/[sprintId]/report/page.tsx`
- `src/app/app/admin/kanban-periods/[id]/report/prepare/page.tsx`

## Critères de recette
1. Registres affiche le cockpit collectif puis la liste des registres, sans anciens panneaux déplacés.
2. Paramètres présente une entrée « Paramètres des registres » fonctionnelle ; les catégories automatiques et le seuil d'échéance conservent leurs valeurs lors de la navigation.
3. Préparation des rapports Scrum et Kanban donne accès à la sélection des faits et aux faits marquants automatiques sans duplication dans Registres.
4. Vérifier les rôles Administrateur (édition) et Utilisateur (lecture selon la politique existante).
5. Vérifier l'affichage FR/EN, `pnpm lint`, `pnpm typecheck`, `pnpm build` et les tests métiers existants.

**Contrôles non exécutés dans l'environnement GitHub/ChatGPT :** aucun passage de lint/build ou de recette dans un navigateur local n'est revendiqué.
