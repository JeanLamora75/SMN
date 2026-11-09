# Epic 2 — Lot 6 : réinitialisation contrôlée de l'installation (SMN-37)

**Date :** 9 novembre 2026. **Dépôt :** main. **Statut :** parcours d'impact enrichi et mécanisme de création d'installation vierge indépendante développé. La réinitialisation destructive de l'installation active demeure interdite.

## Besoin et critères

Story Jira : https://lmn24.atlassian.net/browse/SMN-37

- **AC1 — mesurer les impacts :** GET /api/admin/installation/reset, accessible uniquement à l'Administrateur, exécute une analyse en transaction PostgreSQL REPEATABLE READ READ ONLY. Il compte chaque ligne des tables SMN, présente les quinze tables contenant le plus d'enregistrements et inventorie les documents privés, PDF archivés et les rapports/modèles Office. Les fichiers PDF sont vérifiés contre leurs références et SHA-256, les Office contre leurs bytes ; une erreur ne devient jamais « zéro ». Le nombre de paquets de sauvegardes existants n'atteste pas qu'ils sont restaurables.
- **AC2 — annulation :** fermer l'aperçu, le réouvrir ou quitter la page ne mutent aucune donnée. Une requête POST ne déclenche aucune commande SQL destructive, même si la phrase de confirmation est exacte.
- **AC3 — confirmation et traitement :** la politique de confirmation exige la phrase REINITIALISER MON INSTALLATION mais retourne toujours reset-blocked. Le moteur neuf de préparation hors ligne permet de générer une installation native v33 indépendante avec un nouveau compte Administrateur, puis de vérifier la présence d'une seule installation et l'absence de données métier. Il ne change ni la connexion active ni les répertoires personnels. La bascule et son retour arrière ne sont exercés que sur des bases nommées smn_restore_test_* et isolées.
- **AC4 — autorisations :** le contrôle serveur authorizeApi vérifie la session, le rôle Administrateur, l'origine et l'autorisation d'écriture ; utilisateur simple et anonyme sont refusés.
- **AC5 — nouvelle installation indépendante :** src/server/installation/reset-independent.ts accepte uniquement une base PostgreSQL locale, vide, distincte, précréée et jetable. Il réutilise le programme d'installation native v33, vérifie l'état neuf, calcule un hash de toutes les lignes source avant/après et prouve la non-altération. Il ne détruit aucun fichier, sauvegarde ou historique d'effacement externe.

## Réutilisation des protections des lots 4 et 5

La politique src/server/installation/reset-policy.ts conserve les blocages tant que le rollback, les journaux de confidentialité SMN-40 et la coordination des fichiers ne sont pas qualifiés sur installation active. Il est interdit d'effacer une base en place sous prétexte qu'une installation vierge existe ailleurs.

Les modules de répétition du lot 5 fournissent la procédure cible hors ligne : arrêt complet du serveur et des jobs, sauvegarde chiffrée v4 vérifiée, checkpoint SQL + fichiers, contrôle exhaustif des effacements, marqueur de maintenance externe, bascule PostgreSQL + répertoires, conservation de rollback, reprise des sessions et audit après vérification. La simple présence du marqueur ne stoppe pas une écriture SQL déjà en cours : l'arrêt complet est indispensable.

Le registre d'effacement externe et les anciennes sauvegardes ne sont pas détruits pendant les répétitions. Attention : il n'est pas acceptable de déclarer une restauration conforme de données effacées tant que completeHistory global reste faux ; SMN-40 continue de bloquer la restauration active.

## Compatibilité v33, UI et données

Les anciennes estimations de lignes PostgreSQL (« reltuples ») pouvaient sous-estimer les données ; elles ont été remplacées par des COUNT(*) exacts avec transaction cohérente. L'écran Cockpit Agile affiche séparément les quantités PDF, rapports Office et modèles, sans jamais présenter un chemin absent comme une archive vide vérifiée.

La baseline native v33 de l'installation reste inchangée ; l'ajout d'une installation indépendante passe par l'installateur existant, y compris les migrations de confidentialité qui lui sont raccordées. Les secrets et mots de passe ne doivent être ni écrits dans Jira ni dans les journaux GitHub.

## Tests et preuve

Workflow : .github/workflows/epic2-lot6-reset.yml.

- tests/smn-37-installation-reset-policy.test.ts : confirmation invalide, rôle incorrect, refus avec phrase exacte, risques.
- tests/epic2-lot6-reset-pg.test.ts : sur PostgreSQL 18 local et jetable, création de la source v33, enregistrement d'une équipe, impact SQL exact, contrôle de l'inventaire, création d'une nouvelle installation v33, vérification du compte Administrateur et de l'absence d'équipe/sprint/membre, hashes source avant/après, puis promotion hors ligne sur bases jetables et conservation intacte de la source sous nom de rollback.
- Contrats Windows et Linux : pnpm typecheck, pnpm i18n:check, tests de politique. Contrat PostgreSQL 18 : test de création et de bascule ; aucune base de l'utilisateur n'est utilisée.

Les URLs des runs réels seront indiquées après exécution et contrôle des résultats.

## Limites non résolues

L'AC3 de la Story **n'est pas achevé pour une installation active** : aucun endpoint d'effacement ni système de promotion en production n'est publié. La préparation d'une installation indépendante et les répétitions jetables sont qualifiables séparément, mais ne prouvent pas encore une réinitialisation complète suivie du redémarrage sur le poste Windows réel.

Le prérequis de couverture des suppressions de données personnelles du lot 4 et la validation des fichiers non inspectables restent ouverts. Tant que la restauration active n'est pas qualifiée, une réinitialisation de la base active serait un risque de perte irréversible de données : elle reste bloquée, même avec une confirmation.

**Décision :** garder SMN-37 En cours. Ne pas considérer une CI verte sur bases jetables comme une autorisation d'effacement de données réelles.

## Qualification finale — 9 novembre 2026

**GitHub Actions :** https://github.com/JeanLamora75/SMN/actions/runs/42654491272 ; commit vérifié `367b5cd6e97c60e2466b9f044f5ac8b7eb23280d`. **Trois jobs réussis sur trois :** Windows (contrats, TypeScript et i18n), Linux (mêmes contrôles), PostgreSQL 18 (installation v33 indépendante, analyse de l'existant en lecture seule, compte Administrateur de la nouvelle installation, bascule de DB et répertoires vides jetables, conservation et vérification des anciens fichiers et de la base de rollback).

La capacité technique de repartir avec une installation indépendante est démontrée **sans effacer l'origine**. Cette CI n'autorise pas de remise à zéro de l'installation personnelle ; le POST d'administration continue de retourner 409 et le statut de SMN-37 doit rester En cours jusqu'à la qualification des critères destructifs AC3 et du redémarrage opérationnel.

**Sécurité :** la comparaison avant/après porte sur l'ensemble des lignes de chaque table source, sous une empreinte SHA-256. Les fichiers de l'ancienne installation sont conservés dans un répertoire de rollback distinct. Les bases et les dossiers manipulés dans les tests portent exclusivement des noms `smn_restore_test_*` et ne sont pas ceux de l'utilisateur.
