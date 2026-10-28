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


## Suite sur main — 28 octobre 2026

Après fusion de la PR #226 (commit `c7d28258`), trois corrections ont été publiées directement sur `main` à la demande de l'utilisateur :

- `src/app/app/admin/company-closures/company-closures-admin.tsx` : sélection d'entreprise active et appels à l'API v31, avec repli vers l'API historique pré-v31.
- `src/app/app/admin/companies/page.tsx` et `companies-admin.tsx` : nouveau catalogue administratif permettant création, édition, archivage et réactivation.
- `src/app/app/admin/company-closures/page.tsx` : lien vers le catalogue.

**Statut de validation : non exécuté.** Ces modifications sur `main` ne constituent pas une recette. L'intégration de l'entreprise dans la fiche membre, la robustesse des traductions FR/EN, l'ensemble des références anciennes au schéma, les tests PostgreSQL v31 et le démarrage autonome du worker restent à vérifier. La migration v31 n'a pas été exécutée.


## Vérifications GitHub Actions — 28 octobre, complément
Les runs associés au commit d'audit `09114902` ont été effectivement consultés (les résultats **ne sont pas ceux des derniers commits sur main**) :
- `Vérification I0` run `40772943995` : Linux/PostgreSQL échoue sur lint, avec une erreur de syntaxe dans `scripts/verify-multi-team-stage2.mjs` ligne 8. Windows smoke échoue aussi ; ses étapes suivantes sont ignorées.
- `SMN — Paquet Windows pilote` run `40772944043` : compilation Next réussie, mais TypeScript échoue sur `src/app/app/admin/links/links-cockpit.tsx:77`, icône `people` non reconnue.
- `SMN — Diagnostic consolidation Pays` run `40772944047` : job de validation en échec et tests historiques non passants, plusieurs assertions de contrat obsolètes ou incompatibles. Ne pas interpréter les tests non exécutés comme réussis.

Correctifs publiés sur `main` :
- remplacement de l'icône invalide par `people-fill` ;
- suppression des séquences de retour à la ligne littérales corrompant le script de vérification multiéquipes.

**Validation des correctifs en attente :** aucune nouvelle exécution GitHub Actions n'est actuellement associée au dernier commit vérifié `1395ac23`. Un vrai rerun sur ce SHA ou une nouvelle PR de validation CI est nécessaire pour confirmer la correction des deux erreurs. Les autres échecs des scénarios historiques restent à qualifier individuellement. Le code n'a pas été téléchargé localement : le clone GitHub est inaccessible dans ce conteneur (résolution DNS), et le runtime Node trouvé ici est v22, non conforme à l'exigence Node 24 du projet. Aucun test local n'a été exécuté.

## Nouveau contrôle CI
Relance demandée sur l'état courant de `main` ; les résultats doivent être vérifiés sur le nouveau SHA. Les tests PostgreSQL v31 réels restent distincts des tests statiques.

## Cycle de corrections CI — PR #228, 28 octobre 2026
Exécutions réellement consultées :
- [Vérification I0](https://github.com/JeanLamora75/SMN/actions/runs/40775679171) : Linux + PostgreSQL : **lint réussi**, étape tests échouée, 2070 tests / 1935 pass / 133 fail / 2 autres ; étapes Prisma, typecheck, build et HTTP non exécutées car CI arrêtée.
- Même workflow, Windows Smoke : tests de langage/ports/contrats échoués ; typecheck/build Windows non exécutés.
- [Diagnostic consolidation Pays](https://github.com/JeanLamora75/SMN/actions/runs/40775679215) : baseline-tests réussi, validation échouée.

### Liste des familles d'échecs observées
1. **Moteur de capacité v31** : le test « la fermeture d'une entreprise ne s'applique qu'à ses membres » échouait et le moteur utilisait `closureForMember` sans définition retrouvée. **Corrigé sur main** : fonction explicite filtrant membre et date, sans retrait additionnel.
2. **Tests de contrats v28/v30 devenus strictement dépendants d'anciennes chaînes** : assertions exigeant `schema_version IN (28,29,30)` incompatibles avec introduction v31. À réécrire selon les comportements attendus, sans masquer de régressions.
3. **Interfaces historiques et refontes** : tableaux de bord, navigation, registre, modales, calendrier et cycle Scrum présentent des assertions de structure et de rendu échouées. Chaque cas demande qualification produit.
4. **Métier capacité / affectations** : plusieurs tests sur le rôle développeur, le calcul des J/H, périodes historiques, jours fériés et affectations échouent. Priorité forte : vérifier les résultats et les mocks, ne pas simplement modifier les tests.
5. **Scripts de validation et schémas** : tests migration v30 refusant versions au-delà de 30, diagnostic et contrats multiéquipes doivent accepter v31 explicitement, tout en refusant >=32.
6. **Tests FR/EN et responsive** : plusieurs assertions sur libellés, menus et accessibilité échouent ; un audit écran par écran est encore requis.

### État de vérification
La correction de `closureForMember` a été publiée **après** le run #228. Elle n'est pas validée par ce run. Aucune migration v31 réelle n'a été exécutée dans ces pipelines (le job est arrêté avant les étapes de migration/intégration correspondantes). L'Epic reste non validée.

## Nouveau cycle PR #229 (28 octobre, seconde vérification)
- Linux/PostgreSQL run [40776160281](https://github.com/JeanLamora75/SMN/actions/runs/40776160281) : lint terminé avec succès ; tests : **2070 tests, 1946 réussis, 122 échoués, 2 ignorés**. Pipeline bloqué à l'étape tests, donc validation PostgreSQL v31 et build de production non démontrés.
- Windows Smoke du même run : **2059 tests, 1934 réussis, 123 échoués, 2 ignorés** ; pipeline échoué à l'étape de tests.
- Consolidation Pays run [40776160284](https://github.com/JeanLamora75/SMN/actions/runs/40776160284) : comparaison baseline réussie ; validation à confirmer selon son résultat final.
- Comparativement au précédent Linux (133 échecs sur 2070), le nouveau Linux compte 122 échecs. La régression de fermeture de membre n'apparaît plus parmi les premiers échecs du nouveau run. Les échecs persistants concernent les contrats v28–v30, la navigation, le dashboard, les cycles, le calendrier, la capacité et les contrôles historiques.
- Correction UX supplémentaire publiée sur main : changement d'entreprise dans la modale des fermetures requiert désormais confirmation si saisie non enregistrée, pour éviter toute perte silencieuse.
**Ne pas confondre les tests statiques des garde-fous v31 et une migration réellement exécutée sur une base de test : cette dernière n'est pas certifiée.**

## Correction CI complémentaire sur main
- Le test `tests/capacity-actual.test.ts` exigeait littéralement `IN (28,29,30)`, tandis que `src/server/capacity/actual.ts` accepte volontairement `IN (28,29,30,31)`. Assertion et intitulé corrigés pour inclure explicitement la version 31 (sans élargir aux versions futures).
- Le passage précédent #229 demeure la référence des résultats : 122 échecs Linux, 123 Windows. Le correctif ci-dessus n'a pas encore été exécuté par un pipeline sur son commit.
- Les autres échecs historiques ne doivent pas être supprimés ou ignorés en bloc : une partie correspond à des contrats obsolètes, d'autres à des écarts de comportement qu'il faut diagnostiquer.
