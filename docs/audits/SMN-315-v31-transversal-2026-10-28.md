# Audit transversal SMN-315 (SMN-316 à SMN-325) — 28 octobre 2026

## Portée et méthode
Inspection à distance des sources de `main` via connecteur GitHub et des critères Jira SMN-324/325. **Aucun build, test automatisé, navigateur ou base PostgreSQL n'a été exécuté.** Cette PR contient une correction confirmée et des tests statiques, et ne prouve pas la conformité globale de l'Epic.

## Constat confirmé et correction
**P0 — Protection incomplète des corrections manuelles de capacité réelle.** `src/server/capacity/company-recalc-worker.ts` excluait les périodes avec `smn_capacity_period_override.manual_jh` mais pas celles où la saisie se trouve dans `smn_capacity_actual_override.manual_jh`. Le worker recalculait et historisait alors une référence pour ces périodes. Correction : exclusion de ces périodes dans la sélection initiale et la sous-requête `protected`. Ajout du test de garde `tests/smn-315-v31-audit.test.ts`.

## Points nécessitant encore des vérifications/corrections
| Priorité | Fait observé | Suite requise |
|---|---|---|
| P0 | La migration v31 refuse les anciennes fermetures et historiques non vides, puis supprime `team_id` dans `smn_company_closure`. | Inventaire SQL complet et plan de reprise contrôlée avant application ; ne pas désactiver le garde-fou. |
| P0 | Aucune page trouvée à `src/app/app/admin/companies/page.tsx` (chemin courant attendu). | Localiser l'éventuelle autre interface et vérifier les parcours CRUD/archives de SMN-323 ; absence sur ce chemin n'établit pas seule une absence totale. |
| P1 | `src/server/capacity/company-recalc-worker.ts` traite les périodes enregistrées et déduites des cycles, mais le traitement périodique `--watch` doit être lancé séparément. | Décider et vérifier le démarrage supervisé et la récupération des jobs après coupure. |
| P1 | Le calendrier v31 refuse les comptes non administrateurs via `/api/team-calendar`. | Confirmer ce choix de droits, puis tester la séparation multiéquipes et les données nominatives. |
| P1 | Les résultats de recalcul sont sauvegardés dans l'outbox ; les écrans relisent la capacité courante. | Valider la cohérence après panne, fermeture et changement de période. |
| P1 | Les tests `tests/company-*.test.ts` et la recette SMN-325 sont présents mais non exécutés. | Lancer le runner Windows, lint, typecheck, build, puis tests de base v31 et recette visuelle. |
| P2 | Le calendrier affiche une fermeture et sa modale sur l'écran équipe, mais une revue FR/EN, thèmes et responsive est nécessaire. | Recette UI sur les vues Cartes et Agenda ; vérifier les traductions et labels accessibles. |

## Vérifications transversales minimales
1. `pnpm exec tsx --test tests/smn-315-v31-audit.test.ts`.
2. `powershell -ExecutionPolicy Bypass -File scripts/validate-smn-325.ps1 -IncludeBuild`.
3. Auditer tous les SQL conservant `smn_company_closure.team_id` ou `schema_version IN (28,29,30)` et vérifier qu'ils ne sont pas utilisés en v31.
4. Préparer sauvegarde, restauration et contrôle du SQL v31 sur une base de recette isolée avant l'opération locale.
5. Jouer les parcours CRUD, équipe avec deux entreprises, absence d'entreprise, chevauchement, corrections manuelles, calendrier, droits, FR/EN, clair/sombre, mobile.

## Décision de livraison
**Ne pas fusionner automatiquement cette PR.** La revue doit examiner la correction et les points P0 avant décision ; la migration PostgreSQL n'est pas appliquée. Les états Jira ne doivent pas être marqués « Terminé » avant tests réels et recette.
