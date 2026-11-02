# SMN — Audit de préconditions v32 → v33 et contrats hérités (2 novembre 2026)

**Statut : audit statique réalisé ; correctifs ciblés publiés ; recette PostgreSQL réelle et suite I0 à confirmer en CI.**
**Références :** `scripts/db-upgrade.ts`, `scripts/db-upgrade-policy.ts`, `scripts/apply-smn-338-v33.ts`, `src/server/installation/diagnostic.ts`, `src/server/db/probe.ts`, `src/server/schema/compatibility.ts`.
**Base de comparaison :** dernière I0 terminée avant l'audit : GitHub Actions run 41412693530, commit ee193e395 ; Linux 2551 tests (2452 passés, 97 échoués, 2 ignorés).

## 1. Préconditions de migration vérifiées dans le code

| Vérification | Constat | Portée |
|---|---|---|
| Installation source | `applyV33` exige `schema_version=32` et `state='initialized'` | **Obligatoire** |
| Journal migration | Journal achevé et non annulé, nombre de lignes 1 (baseline native) ou 32 (historique) | **Obligatoire** ; contrôle de checksum complet par diagnostic préalable |
| Structure source | Tables `smn_team`, `smn_account`, `smn_sprint`, `smn_kanban_period` présentes | **Obligatoire** |
| Migration partielle | Les 8 tables d'indicateurs ne doivent pas préexister au passage v32 → v33 | **Refus** d'une migration partiellement présente |
| Sauvegarde | `--apply` nécessite `SMN_V33_BACKUP_VERIFIED=YES` ; un booléen d'environnement ne prouve **pas à lui seul** la restaurabilité | **Preuve externe** de `pg_dump/pg_restore` à conserver |
| Verrouillage | `BEGIN`, verrou transactionnel PostgreSQL, `FOR UPDATE`, `ROLLBACK` sur erreur | **Contrôle transactionnel** |
| Contrôle post-écriture | 8 tables et 4 triggers vérifiés avant `COMMIT`, passage à `schema_version=33` et ligne de migration | **Obligatoire** |
| Compatibilité | `CURRENT_SCHEMA_VERSION=33` ; versions supérieures refusées | **Fail closed** |
| Idempotence | v33 sain est `noop` dans le planificateur, pas une réapplication de DDL | **Obligatoire** |
| Bases vierges | Installation native v33 distincte de la migration d'une v32 existante | **Procédure distincte** |

## 2. Corrections de cette campagne

- Tests auth v27/v30 : plafond version 33, version 34 explicitement rejetée ; contrôles de structures toujours présents.
- Test baseline historique A-04 : diagnostic reconnaît v33 ; fichier/migration v32 conserve son contrat propre.
- Tests du module Liens : acceptent les schémas v29 à v33 avec refus des schémas futurs ; isolation équipe inchangée.
- API lecture `development-capacity` et `capacity-actual` : ajout de v33 dans la liste des schémas autorisés pour la **lecture contextualisée** ; écriture historique bloquée à partir de v28.
- Lecteur serveur `src/server/capacity/actual.ts` : extension du filtrage multiéquipes v28–v32 à v28–v33, en conservant exclusion des équipes archivées et filtrage `teamId`.
- Tests de lectures capacité : reflètent la lecture contextualisée v33 tout en conservant les assertions d'interdiction d'écriture.
- Nouveau contrat `tests/smn-v33-migration-preflight-audit.test.ts` : évalue la prévisualisation non destructive, l'installation initialisée, la complétude du journal, les relations minimales, la non-régression des versions futures et l'absence d'écriture pendant le préflight.
- Vérification de préflight ajoutée au job indépendant de `.github/workflows/verify-i0.yml`, pour obtenir une preuve même si `pnpm test` I0 échoue ailleurs.

## 3. Écarts non résolus / limites d'audit

1. Le test global `pnpm test` mélange contrats unitaires, tests v32 historiques, intégrations PG et tests nécessitant une base `/smn`. Le runner Linux I0 configure `/smn_ci`; plusieurs intégrations **refusent correctement** cette URI par leur précondition locale, au lieu d'être lancées dans leur cible isolée. Le runner Windows n'a pas PostgreSQL de service. La suite doit distinguer explicitement contrats universels, intégration PG en environnement autorisé et recette locale, sans supprimer les tests PG ni leurs garde-fous.
2. Les anciens tests encore en échec portent aussi sur UI Registres, absences, snapshots, comptages Sprint, rapports, interfaces et contrats de schéma. Ils ne sont **pas** réputés corrigés par le seul changement du plafond de version.
3. `applyV33` vérifie localement le nombre et l'achèvement du journal, mais pas à lui seul **tous les checksums** historiques ; la procédure `db:upgrade` exige au préalable le diagnostic `classifySnapshot`, qui contrôle structures/checksums. Ne pas contourner ce diagnostic avec une procédure artisanale.
4. Les vérifications de test en CI ne prouvent pas une restauration de sauvegarde réelle sur le poste Windows 11. Ne pas autoriser de migration utilisateur réelle sans sauvegarde restaurable et accord.
5. Un test conçu explicitement pour v32 peut **rester** limité à v32 : ne le modifier que si l'API ou la fonction testée est effectivement prise en charge en v33.

## 4. Vérification et clôture

Rejouer les commandes `pnpm typecheck`, `pnpm lint`, `pnpm exec tsx --test tests/smn-v33-migration-preflight-audit.test.ts tests/db-upgrade-v32-compatibility.test.ts tests/schema-compatibility.test.ts tests/auth-schema-v27.test.ts tests/auth-schema-v30.test.ts` sur les runners. Sur une **base de test isolée uniquement** : `pnpm db:check:smn-338` et `pnpm db:validate:smn-338`. Conserver les liens d'exécution et le résultat de chaque commande.

**Ne pas déclarer I0 verte ni la migration validée pour une base réelle sans ces preuves.**
