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

## Critères d'acceptation restant bloqués

- **SMN-38 :** revue manuelle des données sémantiques et binaires non inspectables ; arbitrage de conservation des indicateurs collectifs sans réidentification.
- **SMN-39 :** exécuteur serveur sûr, confirmation distincte, journaux d'intention avant mutation, compensation crash-safe, archivage de nouvelles versions expurgées sans modifier l'original, audit d'exécution final.
- **SMN-40 :** raccordement exhaustif des suppressions au registre, ancre protégée hors hôte, qualification d'une restauration expurgée sans réintroduction, ou refus systématique tant que la sécurité n'est pas démontrée.

**Décision :** les exigences de sécurité empêchent de déclarer le lot 4 intégralement terminé ou de clôturer SMN-39/40. Mieux vaut conserver les opérations destructives désactivées que risquer une fausse anonymisation. Aucune installation utilisateur n'a été réinitialisée, restaurée ou effacée.

BMAD : les commandes uv du skill bmad-build n'ont pas été exécutées, faute d'environnement de travail BMAD local ; vérifications réalisées directement avec GitHub et GitHub Actions.
