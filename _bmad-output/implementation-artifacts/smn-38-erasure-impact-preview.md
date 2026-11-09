# SMN-38 — Prévisualiser un effacement ou une anonymisation exceptionnelle

**Date : 09 novembre 2026. Statut : développement partiel, lecture seule.**
Jira : https://lmn24.atlassian.net/browse/SMN-38 (Epic 2).

## Parcours disponible
Administration → Sauvegardes → Prévisualisation d'un effacement exceptionnel.

Un Administrateur connecté peut sélectionner **un membre existant**, choisir Effacement ou Anonymisation et demander une analyse. Le serveur vérifie les droits (Administrateur, session, origine pour POST), recherche le membre dans l'installation courante et exécute des lectures PostgreSQL dans une transaction **READ ONLY**. Aucune opération `DELETE`, `UPDATE`, `pg_restore` ou mutation de documents privés n'est déclenchée.

Le résultat affiche les neuf catégories SMN-39, les comptages de relations **directes reconnues** dans les tables membre, affectation, versions, calendrier, localisation, absences, identité, ainsi que les catégories dont l'exhaustivité est inconnue. Le nom du membre est réservé à la session Administrateur ; aucune donnée individuelle n'est inscrite dans un journal applicatif.

## Couverture réelle et limites
- Le nombre de fiches personnelles dans `smn_member` est directement identifié ; les liens directs des autres tables sont comptés et montrés avec le nom technique de la table.
- Les associations transitives (`assignment_id`, `absence_id`, etc.) ne sont **pas** entièrement résolues ; elles restent « à approfondir ».
- Les textes libres, rapports et PDF/TXT archivés (y compris les documents externes), métriques agrégées, commentaires, références indirectes et copies exportées restent **indéterminés**. Un « 0 » n'est jamais présenté pour une catégorie non entièrement inspectée.
- Les archives immuables ne sont pas réécrites. Le retrait d'accès ou la création d'une version expurgée distincte relèvent de SMN-39, après une analyse complète.
- Les sauvegardes peuvent contenir les données personnelles visées ; les copies externes sont hors du contrôle de suppression automatique de SMN. Le blocage SMN-40 reste actif.
- L'analyse est une **photographie informative**, pas une preuve complète, ni une décision juridique, ni un plan approuvé pour une exécution destructive.
- Aucune confirmation d'effacement n'est proposée et le champ `canExecute` est toujours `false`.

## Réalisation
- `src/server/backup/erasure-preview.ts` — sélecteur et comptages par tables autorisées, sans SQL d'écriture.
- `src/app/api/admin/erasure/preview/route.ts` — GET des cibles et POST d'analyse, réservés aux Administrateurs.
- `src/app/app/admin/backups/erasure-impact-admin.tsx` — UI responsive avec sélection, mode, tableau et avertissements.
- `src/app/app/admin/backups/page.tsx` — intégration dans Administration.
- `src/i18n/fr.json` / `src/i18n/en.json` — parité des textes et avertissements.
- `tests/erasure-impact-preview.test.ts` — test de contrat couvrant les catégories et le refus d'effacement si l'impact est incomplet.

## Critères d'acceptation
| Critère | État |
|---|---|
| AC1 : données et relations | **Partiel** : membre et tables directes ; chemins indirects et toutes les sources non exhaustifs |
| AC2 : statistiques collectives | **Partiel** : signalement des risques, pas d'évaluation de réidentification réelle |
| AC3 : archives PDF/TXT | **Partiel** : avertissement correct, pas de détection fiable du contenu |
| AC4 : sauvegardes et copies | **Partiel** : limite explicitée, pas de comptage spécifique des copies exportées |
| AC5 : fermeture sans action | **Implémenté en conception** : la page ne comporte aucune action destructive |

## Vérifications à effectuer
`pnpm exec tsx --test tests/erasure-impact-preview.test.ts`, `pnpm i18n:check`, `pnpm typecheck`, `pnpm test`, `pnpm build`, recette Windows/PostgreSQL sur base isolée. **Ces commandes et la recette n'ont pas été exécutées dans la session GitHub** : pas de succès attesté.

## Prochaines étapes pour clore SMN-38
Étendre le graphe des relations à partir du schéma v33 réel, analyser les contenus libres et les archives autorisées dans un périmètre défini, recenser les sauvegardes, évaluer les statistiques et déterminer les dispositions de conservation avec justification. Rejouer une inspection au moment de la confirmation dans SMN-39, sous contrôle de révision. Aucun marqueur d'effacement complet ne peut être produit pour SMN-40 sur la base de cet aperçu.

## Adaptation BMAD
Le `uv run ... render_skill.py` du skill `bmad-build` n'est pas exécutable depuis GitHub. Adaptation via connecteurs GitHub/Jira, sans prétendre à l'exécution officielle du workflow.
