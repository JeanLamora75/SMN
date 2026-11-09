# SMN-35 — Atomicité métier et immuabilité des archives

**Date :** 9 novembre 2026  
**Jira :** https://lmn24.atlassian.net/browse/SMN-35  
**État :** code et tests publiés sur `main`, installation/validation PostgreSQL non effectuées. La Story reste **En cours / à qualifier**, pas « Terminée ».

## Code existant vérifié avant intervention
- La clôture des sprints `src/server/sprints/closure.ts` écrit le snapshot de clôture et l'audit dans une même transaction PostgreSQL.
- Les rapports PDF finaux `src/server/reports/pdf-archive-store.ts` sont créés en fichier exclusif `wx`, contrôlés par SHA-256 puis indexés en transaction avec leur éventuel snapshot Studio ; échec avant validation ⇒ nettoyage du fichier en cours.
- Les briefs IA finaux et snapshots Studio disposent déjà de triggers d'immuabilité dans la baseline v33 ; ils sont conservés sans modification de leur DDL de référence.
- `src/server/backup/runner.ts` publie les paquets dans un dossier `.partial` puis par renommage. La rétention de sauvegardes supprime volontairement des paquets selon la politique ; **cela ne doit jamais devenir une suppression de PDF ou de TXT métier**.
- Les trois blocs d'un bilan conservent leur autonomie de sauvegarde. Le mécanisme commun ne doit jamais envelopper plusieurs actions utilisateur indépendantes dans une transaction artificielle.

## Implémentation livrée
1. `src/server/backup/atomic-unit.ts` : mécanisme `withAtomicBusinessUnit` pour un seul lot métier PostgreSQL. Une erreur ou un refus d'opération annule la transaction ; les données et l'audit ne peuvent être validés qu'ensemble. **Ne pas employer avec des fichiers externes** ou à l'intérieur d'une transaction déjà ouverte.
2. `src/server/backup/retention.ts` : le cas réel de modification de la politique de rétention et de son audit est raccordé à ce mécanisme. Conflit de révision ⇒ ROLLBACK. Exception entre `UPDATE` et `INSERT audit` ⇒ ROLLBACK. Succès ⇒ COMMIT après audit.
3. `src/server/backup/archive-immutability.ts` : garde additive PostgreSQL `BEFORE UPDATE OR DELETE` sur `smn_sprint_closure_snapshot` et `smn_report_pdf_archive`. Les `INSERT` de nouvelles versions restent possibles. Le code contrôle nom, fonction, état et événements des triggers existants.
4. `scripts/smn-35-archive-guards.ts` : commande explicite de vérification ou d'installation **transactionnelle et idempotente** des triggers, limitée à une URL PostgreSQL locale et une base `smn`/`smn_*`. Aucune migration n'est appliquée au démarrage et la baseline v33 n'est **pas modifiée**.
5. `tests/smn-35-atomicity-immutability.test.ts` : tests rédigés pour succès données+audit, panne métier, panne entre écriture et audit, conflit, indépendance de trois opérations, contrat de trigger.

## Commandes Windows — **à exécuter**, pas exécutées depuis GitHub

Dans PowerShell à la racine du dépôt, après contrôle de la base visée et sauvegarde :

```powershell
pnpm exec tsx scripts/smn-35-archive-guards.ts --check
pnpm exec tsx --test tests/smn-35-atomicity-immutability.test.ts
pnpm typecheck
pnpm i18n:check
pnpm test
pnpm build
```

Si le diagnostic renvoie `UNPROTECTED`, installer **sur une base de test isolée d'abord**, puis seulement après recette et autorisation appropriée sur l'installation de travail :

```powershell
pnpm exec tsx scripts/smn-35-archive-guards.ts --apply --confirm=INSTALL_ARCHIVE_GUARDS
pnpm exec tsx scripts/smn-35-archive-guards.ts --check
```

La commande peut lire `.env.local` si `SMN_DATABASE_URL` ou `DATABASE_URL` n'est pas déjà définie. Elle ne montre jamais l'URL ni les secrets. La base PostgreSQL cible doit être contrôlée explicitement par l'opérateur ; la chaîne de connexion doit viser uniquement une base locale.

## Critères d'acceptation
| AC | Couverture | Qualification manquante |
|---|---|---|
| AC1 — changement et audit atomiques | Mécanisme commun et cas métier réel (rétention) intégrés ; la clôture avait déjà son transactionnel | Test PostgreSQL réel de succès |
| AC2 — panne entre deux écritures | Injection de panne dans un client SQL simulé, ROLLBACK attendu | Panne en base isolée, crash du processus et récupération |
| AC3 — archives et snapshots immuables | Triggers existants Studio/briefs ; nouveaux triggers additifs pour clôtures/PDF préparés | Application et tests `UPDATE/DELETE` refusés dans PostgreSQL ; vérifier les copies de fichiers hors DB |
| AC4 — indépendance des trois blocs | Le mécanisme s'applique à une seule opération ; test contractuel de trois transactions distinctes | Recette UI des trois blocs réels |
| AC5 — cas réel sans fausse promesse | Politique de rétention effectivement raccordée | Tests locaux et recette |

## Points de vigilance
- **L'installation des nouveaux triggers n'a PAS été effectuée**, donc la protection de `smn_sprint_closure_snapshot` / `smn_report_pdf_archive` n'est pas attestée sur la base réelle.
- Aucune opération destructive sur les données, aucune restauration, et aucune modification du SQL figé de la baseline native v33.
- L'atomicité PostgreSQL ne couvre **pas** le système de fichiers : un protocole durable de reprise est encore nécessaire pour les opérations hybrides (notamment la restauration SMN-34 et l'effacement SMN-39).
- Les erreurs après publication d'un paquet de sauvegarde ne doivent pas faire passer le paquet complet pour corrompu ; ce comportement est déjà prévu dans le code de sauvegarde.
- L'immuabilité des archives PDF sur disque dépend également de la vérification SHA-256 lors de la lecture et de l'absence de réécriture volontaire ; les triggers ne protègent que les lignes PostgreSQL.
- La rétention des sauvegardes est un **cas exceptionnel de suppression voulue** : ne pas étendre le trigger d'immuabilité à `smn_backup_retention_audit` ou aux paquets supprimés sans analyse spécifique.

## Adaptation BMAD
Le skill `.agents/skills/bmad-build/SKILL.md` demande `uv run ... render_skill.py`, indisponible depuis GitHub ; intervention via connecteurs GitHub/Jira sans revendiquer ce workflow ni des tests non exécutés.
