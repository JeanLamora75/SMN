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
