# Epic 2 — SMN-34 / SMN-38 / SMN-39 / SMN-40 — Sortie des trois blocages restauration

**Date :** 10 novembre 2026 · **Agent :** Amelia (BMAD Dev) · **Périmètre :** restitution d'un paquet chiffré v4 sur PostgreSQL 18, fichiers Office/PDF/privés, sessions et reprise Windows 11.

## Verdict exécutable et preuve admissible

**Décision : NON-GO pour activation de la restauration sur une installation réelle.** Ce verdict ne provient pas d'un retard documentaire : il résulte d'éléments qui ne peuvent pas être simulés ni attestés depuis GitHub :
1. absence de preuve que les données supprimées avant l'enrôlement du registre externe ne pourront pas être réintroduites ;
2. absence d'exécuteur actif qualifié hors ligne stoppant réellement les processus et validant un checkpoint + une bascule atomiquement coordonnée entre PG18 et plusieurs répertoires ;
3. absence de recette de **l'installation Windows 11 indépendante réelle** avec coupures, redémarrage, archives inspectées et mesure de RPO/RTO.

**Ne jamais forcer** `completeHistory:true`, `restoreTested:true` ou `canRestore:true` pour rendre l'interface utilisable. La politique SMN-40 et les refus HTTP 409 restent obligatoires. Toutes les preuves CI sur noms `smn_restore_test_*` sont des preuves sur environnements jetables, **pas** une restauration réelle.

## Travaux techniques publiés pendant cette intervention

- Conservation et renforcement du préflight SMN-34, avec vérification des champs `scopeComplete`, `archive.id` et tous les avertissements bloquants de prévisualisation.
- [Tests fail-closed SMN-34](../../tests/smn-34-live-restore-safety.test.ts) : démontrer que des sauvegardes vérifiées, des checkpoints simulés et des drapeaux de préparation tous vrais n'autorisent pas une restauration sans historique complet ; interdire les sauvegardes antérieures à la couverture ou précédant un effacement ; vérifier que l'API n'exécute aucune bascule.
- [Workflow Lot 5](../../.github/workflows/epic2-lot5-cutover.yml) : ajout des tests anti-réintroduction aux contrats Windows et Linux (aucun script `uv`).
- Correction de deux défauts TypeScript transversaux observés dans de vraies CI avant la dernière qualification : API Cérémonies SMN-433 et carte Registres SMN-432.
- Référence de qualification antérieure : [run 42889889471](https://github.com/JeanLamora75/SMN/actions/runs/42889889471), SHA `7842fc0`, **3 jobs SUCCESS** Windows/Linux/PG18. **Attention** : une modification postérieure exige de nouvelles preuves sur le SHA final.

## Blocage 1 — SMN-40 : historique et archives

### Ce qui est objectivement automatisable

- Vérifier la chaîne HMAC et l'ancre externe du registre, les intentions ouvertes, les reçus SQL et le garde PostgreSQL.
- Rejeter les restaurations dont la date précède `coverageStart` ; rejeter les sauvegardes contenant une identité effacée depuis leur capture.
- Comparer les identifiants pseudonymisés des membres effacés, les fichiers PDF/Office/privés et les références PostgreSQL ; refuser un inventaire absent, modifié ou non inspectable.
- Ne pas accorder `completeHistory` à partir de l'absence de marqueurs après la date de la sauvegarde.

### Preuves impossibles à inventer

- **Inventaire et revue humaine de l'authentique installation Windows**, comprenant fichiers PDF scannés, objets OOXML, images et noms dans des textes libres.
- Qualification des suppressions antérieures au démarrage de la piste HMAC : seules des attestations extérieures indépendantes et suffisantes peuvent réduire cet inconnu, pas un test unitaire.
- Décision sur les métriques collectives historiques selon l'Option A validée : conserver **uniquement** si l'absence de réidentification est démontrée ; sinon expurger ou retirer avec preuve ; ne pas modifier silencieusement les métriques figées.
- Sauvegarde **nouvelle** après expurgation réellement validée, puis reconstruction isolée et vérification de l'absence d'anciennes identités et versions.

**Critère de sortie** : preuve externe vérifiée de couverture totale, aucune intention irrésolue, aucun accès aux versions interdites, archive v4 post-effacement qualifiée, contrôle `completeHistory` rendu déterminable sans valeur codée en dur et suivi d'un test de refus d'une archive pré-effacement. Tant qu'un de ces points manque : NO-GO.

## Blocage 2 — SMN-34 : exécuteur hors ligne

Un simple endpoint `POST /restore` ne satisfait pas la sûreté. L'application elle-même ne peut pas arrêter ses propres processus de manière fiable, détenir un verrou hors processus, remplacer des bases PostgreSQL tout en acceptant du trafic et certifier l'invalidation durable des sessions.

**Séquence requise**, uniquement sur poste de validation séparé :

1. Déconnecter le navigateur ; sauvegarder et vérifier le paquet v4 courant ainsi qu'une seconde copie non modifiable indépendamment. Vérifier identité, mot de passe de récupération et références.
2. Créer le marqueur `SMN_RESTORE_MAINTENANCE_MARKER` hors du répertoire SMN/sauvegardes, avec fsync, puis arrêter complètement le serveur, toutes les tâches, connexions et producteurs.
3. Inspecter une preuve d'arrêt effectif du trafic HTTP, des jobs, des connexions PG18 et des écrivains externes. Aucun bouton navigateur ne peut se déclarer opérateur de confiance.
4. Reconstruire le candidat sur une **base neuve isolée** et des répertoires de staging ; mesurer les empreintes, vérifier les versions, migrations v33, FKs, documents et tableaux.
5. Créer, attester et protéger un checkpoint indépendant PostgreSQL + tous répertoires gérés ; le retour arrière doit conserver les octets originaux.
6. Écrire avant mutation une intention persistée et signée ; effectuer une bascule coordonnée. Une panne avant promotion peut autoriser un rollback démontré ; après promotion ou état ambigu : maintenance maintenue, intervention manuelle obligatoire.
7. Vérifier les données restaurées, les fichiers et les accès (Dashboard Builder, indicateurs, liens, rapports Office/PDF). Révoquer aussi les sessions **persistées**, puis redémarrer et vérifier le service en navigateur.
8. Publier le diagnostic et l'audit sans secrets, conserver le rollback et retirer la maintenance seulement après décision formalisée.

**Critère de sortie** : un programme extérieur au serveur SMN et aux chemins de travail respecte la totalité de ces étapes, est prouvé par injection de panne et refuse toute donnée non qualifiée. Aucune activation de l'installation de travail avant preuve.

## Blocage 3 — Recette Windows end-to-end

### Banc obligatoire

- Un ordinateur ou une VM **Windows 11 isolé**, répertoire de travail et installation de SMN séparés ; PostgreSQL 18 portable, aucun besoin d'administrateur ni d'IDE.
- Deux équipes distinctes, sprints ouverts/clos, indicateurs dynamiques v33, liens transverses et équipes, registres, Dashboard Builder, modèles et rapports Office, PDF, documents privés.
- Sauvegardes v4 vérifiées, données synthétiques pour automatisation et **inspection humaine d'archives réelles** dans une enceinte privée.

### 14 essais à faire témoigner

Utiliser **REC-01 à REC-14** du [PV Epic 2](epic2-etape4-proces-verbal-recette.md) : inventaire, sauvegarde, altération, PG18, UI, identité historique, archives, agrégats non réidentifiants, protection anti-réintroduction, quatre points de panne, sessions, installation native, RPO/RTO, audit transversal.

### Dossier de preuves

Pour chaque REC, enregistrer date UTC, SHA Git du code, version PG18, machine de validation non nominative, résultat, hash du jeu de données, témoins de la reprise, statut `PASS/FAIL/BLOCKED` et éventuelle issue Jira. Ne publier **aucun** nom, secret, archive privée ou sauvegarde chiffrée sur GitHub/Jira. Les mesures RPO/RTO doivent partir de l'interruption **réelle** et de la dernière donnée réellement durable ; le seul temps d'un cutover sur CI ne les représente pas.

### Refus obligatoires

- Répertoire de données identique à celui de l'installation de travail : REFUS.
- Historique d'effacement non qualifié ou archives non inspectables : REFUS.
- Session ouverte, écrivain actif ou état de bascule ambigu : REFUS.
- Comparaison de hachages manquante, chemin PDF/Office omis : REFUS.
- Une recette `tsx --test` sur runner GitHub, même Windows, ne remplace **pas** les essais de l'installation réelle.

## État de livraison et prochaines validations

| Condition | Automatisation disponible | Exécution réelle manquante | Statut |
|---|---|---|---|
| SMN-40 anti-réintroduction | Chaîne HMAC, contrôle de couverture, garde DB, tests fail-closed | Qualification des antécédents, archives et agrégats | **BLOQUÉ** |
| Exécuteur actif | Reconstruction et cutover sur `smn_restore_test_*` | Orchestrateur production indépendant et contrôle d'arrêt Windows | **BLOQUÉ** |
| Recette Windows | Jobs Windows de contrats, PostgreSQL isolé, scénario de reprise | Banc Windows 11 représentatif, redémarrage et revue humaine | **BLOQUÉ** |

**Aucune suppression, aucune restauration active et aucune écriture sur la base personnelle n'a eu lieu. Aucun résultat de recette réelle n'est revendiqué.** Les Stories SMN-34, 38, 39, 40 doivent rester ouvertes jusqu'à une preuve conforme.


## Incrément suivant — diagnostic opérateur read-only (10 novembre 2026)

**Implémentation publiée sur GitHub main :**
- `src/server/backup/restore-audit.ts` : rapport de qualification non nominatif, trois blocages distingués (historique des effacements, exécuteur hors ligne, recette Windows). `canActivate:false` est une constante de sécurité, indépendamment des chiffres de l'inventaire.
- `src/server/backup/restore-audit-preview.ts` : lecture indépendante depuis Node de l'archive chiffrée, de la version PostgreSQL et du schéma v33, et de l'inventaire de documents, dans une transaction SQL lecture seule. Le module n'importe pas la sentinelle `server-only` de Next.js.
- `scripts/smn-34-audit-readonly.ts` : CLI `--archive UUID --audit-only`, lancement `pnpm restore:audit --archive UUID --audit-only` ou `pnpm exec tsx scripts/smn-34-audit-readonly.ts --archive UUID --audit-only`. Il ne déplace aucun fichier, ne lance pas `pg_restore`, ne modifie ni la base ni les archives. Les résultats affichés sont uniquement les codes des blocages et les effectifs d'archives par catégorie, **sans nom ni chemin**.
- `tests/smn-34-audit-readonly.test.ts` : couverture de l'état « archives non inspectables », inventaire vide sans fausse preuve, absence de permission malgré un registre local `completeHistory:true` simulé, absence d'écriture dans le code CLI, et route SQL en transaction `READ ONLY`.
- `docs/SMN-34-RECETTE-WINDOWS.md` : protocole exécutable sous Windows 11, sans installation d'IDE ni droits administrateur, et matrice REC-01 à REC-14 à remplir depuis **un banc indépendant**.

**CI :** [Lot 5 — exécution 42893233552](https://github.com/JeanLamora75/SMN/actions/runs/42893233552) : **SUCCESS Linux + Windows + PostgreSQL 18 isolé**, SHA `6a314447e367d4654864f0fd0e73ff9b76724000`. La suite générale I0 sur le commit documentaire suivant était en cours au moment de la consultation ; une CI verte spécialisée **ne vaut pas** une restauration active.

**Limite explicite :** un audit de lecture seule sur des données réelles et une recette complète sur Windows ne peuvent pas être exécutés sur GitHub depuis la session de l'agent. Les trois blocages demeurent **NO-GO** jusqu'aux attestations indépendantes. Aucun secret ni backup transféré à GitHub/Jira.


## Incrément supplémentaire — diagnostic écrivains et matrice de recette

Le diagnostic `pnpm restore:audit --archive <UUID> --audit-only` relève désormais **le nombre des connexions PostgreSQL concurrentes à l'instant T**, via `pg_catalog.pg_stat_activity`, sans émettre PID, contenu de requêtes ni identifiants. Une erreur ou un manque de permission produit `unverifiable` ; le constat « zéro autre session » produit `none-observed` avec `provesOffline:false`. La mesure n'atteste **jamais** l'arrêt du serveur HTTP, des tâches planifiées, des connexions futures ou des écrivains externes. **Aucune autorisation de restauration n'en découle.**

Une grille de recette contrôlable depuis Windows a été publiée : `scripts/windows/smn-34-recette-contract.mjs` et `scripts/windows/smn-34-recette-check.mjs` ; ils exposent les 14 scénarios REC-01 à REC-14, leur état PASS / FAIL / BLOCKED et une référence SHA-256/horodatage UTC pour chaque PASS. Le contrôle de cohérence ne lit aucun contenu des preuves et **retourne toujours `canActivate:false`**, y compris pour 14 PASS déclarés. Voir [le guide](../../docs/SMN-34-RECETTE-WINDOWS.md). Les tests `tests/smn-34-audit-readonly.test.ts` et `tests/smn-34-recette-checklist.test.ts` sont intégrés au workflow Lot 5.

Les données historiques, les archives réelles et les sessions de l'installation personnelle n'ont pas été consultées. Aucune restauration réelle n'a été tentée. Statut des trois conditions : **NON LEVÉES**, avec diagnostic et collecte de preuves facilités.


## Incrément opérateur hors ligne — 10 novembre 2026 (suite)

**Nouveau précontrôle externe, sans bascule** : `src/server/backup/restore-offline-operator-preflight.ts` et `scripts/smn-34-offline-preflight.ts`. Il exige des noms de bases `smn_restore_test_*` sur un serveur PG18 local, trois dossiers frères jetables situés sous le dossier temporaire du système, et renvoie un rapport lisible sans URL SQL ni chemins privés.

**Vérifications** : PG18, bases source/candidate présentes et rollback absente, nombre de connexions concurrentes, empreintes des arbres de fichiers, présence d'une candidate non vide. Toutes les opérations de diagnostic sont en lecture seule ; aucune mutation de DB, fichiers, sessions ou maintenance. Même un résultat « ready » est associé à `canActivate:false`.

**Tests** : `tests/smn-34-offline-operator-preflight.test.ts` (refus production/serveur distant/CLI) et `tests/smn-34-offline-operator-preflight-pg.test.ts` (bases PostgreSQL 18 jetables, blocage en présence d'une connexion concurrente, contrôle du non-renommage).

**Preuve CI exécutée :** [Epic 2 Lot 5 run 42896293055](https://github.com/JeanLamora75/SMN/actions/runs/42896293055), SHA `ffce862d168eeb18f9d91aca2220220c9d8a180f`, conclusion **SUCCESS** sur Linux, Windows et PostgreSQL 18 jetable. Aucun script `uv` ni restauration de données personnelles.

**Reste NO-GO** : orchestration effective de l'arrêt des écrivains et de la révocation des sessions persistantes, qualification historique des archives SMN-38/39/40, recette indépendante Windows 11 REC-01 à REC-14. Le précontrôle jetable ne prouve ni un arrêt HTTP réel ni un basculement de production sûre.


## Nouveau jalon — répétition coordonnée via processus Node autonome

**Code publié :** `scripts/smn-34-offline-cutover-sandbox.ts` (exécuté hors Next.js), `tests/smn-34-offline-cutover-sandbox.test.ts`, `tests/smn-34-offline-cutover-cli-pg.test.ts`.

Le lanceur utilise le moteur `rehearseCoordinatedOfflineCutover` déjà présent pour opérer une **bascule réelle de deux bases PostgreSQL 18 jetables et de deux arbres de fichiers de test**. Il contrôle les noms `smn_restore_test_*`, les quatre répertoires temporaires distincts, le dossier parent et la clé de journal HMAC. Il ne peut viser ni la base `smn` de production ni les répertoires en dehors de l'espace temporaire. En cas de résultat ambigu, la récupération manuelle reste nécessaire ; aucun bypass.

**Preuve effective :** [workflow Lot 5 #42897034123](https://github.com/JeanLamora75/SMN/actions/runs/42897034123), commit `de8ecb8014e07c831d5caf8dec309633de87e396`, conclusion **SUCCESS** : tests Windows, Linux et test de lancement du CLI contre PostgreSQL 18 isolé. La vérification PG constate la promotion de la candidate, la conservation de l'original dans le rollback et les contenus de fichiers respectifs. La sortie du script indique explicitement `productionRestoreEnabled:false`.

**Périmètre strictement limité :** il ne vérifie pas l'exhaustivité des données effacées avant le registre SMN-40, n'arrête pas les processus réels SMN, ne révoque pas les sessions persistantes et n'a pas été testé sur une installation Windows 11 indépendante du client avec ses propres données. Les trois conditions restent donc **non clôturables**, malgré la réussite du banc de test. Aucun script `uv`, aucune modification de données personnelles.


## Jalon — persistance du verrou de maintenance entre processus

Le superviseur **strictement jetable** `scripts/smn-34-sandbox-maintenance.ts` a été ajouté. Il permet, depuis un processus Node indépendant du serveur SMN, de créer (`--begin`) un marqueur `maintenance.lock` dans un répertoire `smn_restore_test_*` réellement situé sous le dossier temporaire Windows/Linux, ou de constater sa présence (`--inspect`) depuis un autre processus. Il refuse une deuxième création et un marqueur endommagé, sans automatiser son retrait.

Le test `tests/smn-34-sandbox-maintenance-process.test.ts` lance de vrais processus Node séparés et prouve la persistance du fichier après terminaison du premier processus. Le composant réutilise `restore-maintenance.ts` qui bloque l'accès aux sessions pendant l'état de maintenance. **Aucun arrêt de serveur HTTP, job de fond ou écrivain PostgreSQL n'est certifié par ce test.** Les sessions actuelles SMN sont stockées en mémoire dans `SessionStore`, et non dans un magasin partagé durable. Une recette sur plusieurs processus réellement connectés reste requise.

Le test initial a révélé une erreur de commentaire TypeScript puis un nom de répertoire de test non déterministe (caractères majuscules aléatoires). Ces deux défauts ont été corrigés sans assouplir la règle de sécurité sur les noms `smn_restore_test_*`. Aucune restauration de production n'a été activée et aucun marqueur réel n'a été créé.
