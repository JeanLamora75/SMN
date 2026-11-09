# Epic 2 — Lot 4 : confidentialité, effacement et non-réintroduction

**Date :** 9 novembre 2026. **Branche :** main. **Statut :** protections et tests renforcés ; fonctionnalité d'effacement destructif non qualifiée et non activée. Aucune donnée de l'installation de travail n'a été modifiée.

## SMN-38 — Analyse d'impact

La prévisualisation conserve l'inventaire des fiches, associations, calendriers, historiques, textes libres, références indirectes, binaires PDF/TXT/OOXML, archives gérées et avertissements relatifs aux copies externes. Reçu d'analyse serveur HMAC expirant en dix minutes et revérification des empreintes. Les informations des images, PDF sans couche texte et objets incorporés ne sont pas réputées contrôlées. Le contrat conserve volontairement les marqueurs complete=false et canExecute=false.

Le test PostgreSQL 18 natif v33 isolé crée une équipe, un membre, son affectation et sa révision ; il détecte les relations, refuse une écriture dans la transaction READ ONLY et conserve la fiche. Les autres sources sont vérifiées par les tests de contrat existants. La preuve de non-réidentification dans les archives non inspectables n'est pas obtenue.

## SMN-39 — Infrastructure de registre externe

Nouveau module : src/server/backup/erasure-ledger.ts.

Trois variables opt-in : SMN_ERASURE_LEDGER_DIR, SMN_ERASURE_ANCHOR_DIR, SMN_ERASURE_LEDGER_KEY_HEX. Les deux dossiers doivent être absolus, indépendants et hors de SMN_BACKUP_DIR. La clé HMAC de 32 octets ne doit jamais être enregistrée dans GitHub ou les sauvegardes.

Initialisation explicitement demandée via initializeErasureLedger, qui fixe le début réel de couverture. Un fichier JSONL reçoit des marqueurs minimaux signés ; un second dossier contient un compteur et une tête signés indépendamment. appendCompletedErasure dispose d'un verrou exclusif, écrit et synchronise le journal et le point d'ancrage. readErasureLedger refuse une troncature, une altération, une discontinuité ou une publication partielle. Pas de réconciliation silencieuse des interruptions. Aucune identité, nom, e-mail ou texte personnel dans les marqueurs.

**Limites :** la chaîne HMAC et les dossiers séparés ne constituent pas une garantie matérielle WORM. Le moteur transactionnel d'effacement, le journal d'intention avant COMMIT, le retour arrière, la révocation des archives immuables et l'anonymisation sans réidentification restent à développer. Le registre n'est pas encore relié à une API destructive : il est volontairement impossible de déclencher un effacement réel à travers ce lot.

## SMN-40 — Barrière de restauration

currentErasureEvidence reçoit désormais la date de la sauvegarde contrôlée et lit les événements postérieurs depuis le registre externe. Le endpoint POST /api/admin/backups/restore/preflight utilise la vraie date du paquet ; aucune preuve cliente ne permet de contourner la barrière.

**Important :** completeHistory reste FAUX pour les preuves réelles, même lorsque les HMAC sont valides, tant que les suppressions ordinaires et exceptionnelles ne sont pas toutes raccordées au registre. Par conséquent, la restauration active reste bloquée, en plus des vérifications nécessaires SMN-34. Une archive antérieure au début du registre ne peut jamais être présentée comme sûre. La rétention des sauvegardes n'efface pas les archives PDF historiques.

## Qualification

Workflow : .github/workflows/epic2-lot4-erasure.yml.

Tests nouveaux :
- tests/epic2-lot4-erasure-ledger.test.ts : ancrage indépendant, signatures, altération, troncature, reprise bloquée et refus avant couverture.
- tests/epic2-lot4-postgres.test.ts : PostgreSQL 18 jetable, installation native v33 et requêtes READ ONLY.

Tests régressifs : backup-erasure-protection, exceptional-erasure-policy, erasure-impact-preview, erasure-impact-receipt, erasure-indirect-archives et erasure-ooxml-content. CI Windows/Linux, typecheck et i18n. La preuve d'exécution est le résultat réel des jobs GitHub Actions, pas la présence des fichiers.


## Preuve CI confirmée — 9 novembre 2026

**GitHub Actions : https://github.com/JeanLamora75/SMN/actions/runs/42625895661** ; commit testé 424dc1ee4bfcc2d70b096199c760afd8d2c7650b.

- privacy-contracts (windows-latest) : **success**, y compris tests du registre, contrats SMN-38/39/40, TypeScript et traductions.
- privacy-contracts (ubuntu-latest) : **success**, mêmes vérifications.
- postgres-18-impact : **success** ; installation native v33 et contrôle READ ONLY sur une base jetable.

**Jira :** commentaires de qualification ajoutés à SMN-38, SMN-39 et SMN-40. Stories conservées en cours ; la CI ne prouve ni effacement/destruction métier, ni absence de réidentification dans des archives non inspectées.

## Critères d'acceptation restant bloqués

- **SMN-38 :** revue manuelle des données sémantiques et binaires non inspectables ; arbitrage de conservation des indicateurs collectifs sans réidentification.
- **SMN-39 :** exécuteur serveur sûr, confirmation distincte, journaux d'intention avant mutation, compensation crash-safe, archivage de nouvelles versions expurgées sans modifier l'original, audit d'exécution final.
- **SMN-40 :** raccordement exhaustif des suppressions au registre, ancre protégée hors hôte, qualification d'une restauration expurgée sans réintroduction, ou refus systématique tant que la sécurité n'est pas démontrée.

**Décision :** les exigences de sécurité empêchent de déclarer le lot 4 intégralement terminé ou de clôturer SMN-39/40. Mieux vaut conserver les opérations destructives désactivées que risquer une fausse anonymisation. Aucune installation utilisateur n'a été réinitialisée, restaurée ou effacée.

BMAD : les commandes uv du skill bmad-build n'ont pas été exécutées, faute d'environnement de travail BMAD local ; vérifications réalisées directement avec GitHub et GitHub Actions.


## Renforcement technique complémentaire — 9 novembre 2026

### SMN-38 : exploration relationnelle et contenus binaires
- Découverte des clés étrangères simples et composites dans pg_catalog ; les paires de colonnes ordonnées servent aux jointures des descendants de smn_member.
- Tout chemin tronqué par le budget ou la profondeur retourne un état unknown, jamais zéro.
- Un document Office contenant des images est non concluant, même si sa couche texte a été lue ; un PDF sans correspondance textuelle positive est non concluant tant que son contenu visuel n'est pas inspecté.
- Tests de contrats : tests/epic2-lot4-fk-coverage.test.ts ; test réel PostgreSQL : tests/epic2-lot4-postgres.test.ts.
- Les identifiants sémantiques et les images non inspectables demandent toujours une **revue humaine**, avec arbitrage de retrait, de production d'une version expurgée et de conservation des indicateurs collectifs.

### SMN-39 : protocole transactionnel de reprise
- src/server/backup/erasure-intent.ts : intention signée et persistée avant toute mutation, verrou exclusif, refus de transactions parallèles, suivi d'une intention interrompue.
- prisma/migrations/20261109_smn39_privacy_receipt/migration.sql : table additive smn_privacy_erasure_receipt, preuve de commit sans identité personnelle, refus SQL des UPDATE/DELETE de reçus.
- src/server/backup/erasure-transaction.ts : BEGIN, verrou PostgreSQL, mutation SQL contrôlée par le futur orchestrateur, insertion du reçu dans la transaction, COMMIT, puis clôture du journal.
- Une intention ne peut être clôturée que si le reçu PostgreSQL correspondant est présent avec identifiant, mode et révision identiques.
- Une panne avant ou pendant le commit laisse une intention en suspens et interdit toute restauration tant qu'un opérateur n'a pas démontré l'état réel.
- La clôture relancée après un événement déjà enregistré ne produit pas de doublon.
- La migration reste **additive et séparée** de la baseline native v33, qui ne doit pas être modifiée. Elle est appliquée sur la base jetable dans le test PostgreSQL 18 ; toute installation existante nécessite une procédure de migration qualifiée avant activation.
- Test PostgreSQL sur une table factice : vérification des reçus, impossibilité de les effacer, rollback après panne injectée, et maintien de l'intention de reprise.

### SMN-40 : anti-réintroduction
- Le précontrôle lit l'intention externe ainsi que le journal HMAC ; tout événement interrompu rend la preuve indisponible.
- Le journal et l'ancre sont interdits dans le dossier de sauvegarde par défaut Windows et les répertoires de données déclarés.
- Le résultat completeHistory reste volontairement FALSE tant que tous les chemins d'effacement métier ne sont pas intégrés. Les sauvegardes anciennes ne peuvent donc pas être approuvées sur la seule existence du registre.

### Conditions de libération non encore démontrées
- Aucun effacement réel de membre, retrait d'accès à une archive PDF/Office ou création de version expurgée n'a été activé ; le composant transactionnel est une primitive interne, pas une route destructrice.
- La preuve de non-réidentification dans des images, PDF scannés, objets Office et copies externes ne peut pas être automatisée intégralement.
- La reprise d'une installation reconstruite et expurgée, puis sa bascule active, doivent être démontrées au lot 5.

**Décision de sécurité :** ne pas déclarer les trois blocages résolus ni clôturer les Stories concernées tant que les vérifications ci-dessus manquent. Un test d'atomicité sur données factices n'est pas une recette d'effacement réel.


## Dernière qualification automatisée — 9 novembre 2026

**GitHub Actions : https://github.com/JeanLamora75/SMN/actions/runs/42634089907** (commit de code 2078a2bc2f0b700463e66b5e73ad4f38006f0d09). Résultat : **3 jobs sur 3 réussis**.

- Windows : contrats de confidentialité, intentions durables, signatures, contrôle de révision, TypeScript et traductions.
- Linux : mêmes contrôles, tous réussis.
- PostgreSQL 18 : installation native v33 isolée, inspection des FK directes et indirectes, transaction READ ONLY, migration additive de reçus sur base jetable, mutation sur table factice, COMMIT avec reçu, rejet de DELETE du reçu, panne injectée avec ROLLBACK, intention externe conservée et refus de restauration.

Les migrations restent séparées de la baseline native v33. Les opérations de test ne portent sur aucune donnée personnelle réelle.

**Qualification :** les mécanismes d'infrastructure sont testés. Le chantier demandé ne peut pas être certifié intégralement terminé à ce stade : aucune suppression de membre ou révocation d'archive en situation métier, ni vérification visuelle de tous les binaires, ni restauration active expurgée ne figure dans ces preuves.
