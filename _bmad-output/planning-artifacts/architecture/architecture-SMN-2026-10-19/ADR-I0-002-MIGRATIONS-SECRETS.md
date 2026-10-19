# ADR-I0-002 — Migrations PostgreSQL et stockage des secrets

**Date :** 19 octobre 2026 à 22:32 (Europe/Paris).
**Statut :** principes explicitement validés par l'utilisateur ; mécanismes techniques et essais à réaliser.
**Complète :** [ADR-I0-001](ADR-I0-001-STACK.md), AD-10/25/28/29 et le [plan I0](../../preparation-technique-i0.md).

## Principes validés

1. Une base PostgreSQL dédiée à SMN, indépendante de LMN24 et des autres applications.
2. Des migrations versionnées dans GitHub, générées sur une base de développement séparée puis appliquées dans l'ordre. La base temporaire Prisma, si utilisée, est strictement distincte de la base métier.
3. Lorsqu'une mise à jour nécessite une migration, afficher son impact et obtenir la confirmation avant application. Une sauvegarde préalable est requise lorsque la migration touche des données existantes.
4. En cas de schéma incompatible ou d'échec de migration, ne pas ouvrir l'application métier ; afficher un diagnostic et une procédure de reprise. Ne pas promettre un retour arrière automatique pour toute migration.
5. Le runtime dispose de droits PostgreSQL limités ; les droits supplémentaires nécessaires aux migrations restent séparés et ne sont pas présumés disponibles. La base doit être précréée si le compte disponible ne peut pas la créer.
6. Identifiants PostgreSQL et secrets applicatifs conservés dans un dossier privé de l'installation, hors GitHub et des fichiers publics ; aucun secret dans les journaux.
7. Prévoir une copie de récupération protégée des clés servant au chiffrement des données individuelles : une restauration de base seule ne suffit pas si les clés sont perdues.

Le mécanisme de protection/export de la copie des clés est **à préciser séparément**. Aucun mot de passe de protection, format d'archive ou mécanisme cryptographique n'est adopté implicitement. Une récupération du compte administrateur D-PRD-139 ne doit pas être présentée comme une récupération automatique d'une clé perdue.

## Contrat technique à détailler pendant I0

- Séparer génération des migrations, application des fichiers validés et accès runtime. L'utilisateur ne doit pas lancer une commande de développement ou de réinitialisation sur ses données métier pour démarrer SMN.
- Identifier la version applicative et de schéma attendue ; détecter l'incompatibilité avant les routes métier. Le diagnostic de démarrage ne doit pas exposer des informations confidentielles.
- Présenter les impacts connus et les étapes de reprise de la migration effectivement livrée ; aucune promesse générique d'absence de risque.
- La confirmation d'une migration n'autorise pas à exposer anonymement l'administration après initialisation ; l'identité et le canal d'autorisation restent à spécifier.
- Un rôle migrateur séparé logiquement n'implique pas nécessairement l'installation de plusieurs services ou de nouveaux outils sur Windows. Les privilèges effectifs seront vérifiés sur le poste.
- Définir emplacement et permissions du dossier privé, traitement des chemins Windows, clé active et copie de récupération avant stockage de données chiffrées. Le simple fait d'être hors Git ne prouve pas la confidentialité du dossier.

## Critères de vérification à préparer, non exécutés

| Scénario | Résultat attendu |
| --- | --- |
| Base SMN dédiée | Aucune migration ne cible une base LMN24 ou celle d'une autre application |
| Installation vierge | Migrations versionnées appliquées dans l'ordre, état de schéma connu et diagnostic explicite |
| Schéma existant à modifier | Impact présenté, confirmation reçue et sauvegarde préalable avant toucher les données existantes |
| Confirmation refusée | Aucune migration confirmée à tort, application métier bloquée si son schéma reste incompatible |
| Échec ou interruption | Pas de faux succès ; accès métier bloqué sur incompatibilité ; diagnostic et reprise documentés |
| Runtime à privilèges limités | Opérations métier possibles sans droits de création de base ou administration serveur présumés |
| Secrets et diagnostics | Aucun secret dans le dépôt, les fichiers publics, les arguments visibles ou les journaux |
| Restauration de données chiffrées | Copie protégée de la bonne clé disponible et procédure réellement testée avant déclaration de réussite |

## Traçabilité et limites

Exigences FR-66/68/70/71/72/73 ; AD-10/25/27/28/29. [Démarrage et prérequis](https://lmn24.atlassian.net/browse/SMN-11) pour la compatibilité de schéma et le diagnostic ; [configuration privée](https://lmn24.atlassian.net/browse/SMN-19) pour les secrets ; capacités de sauvegarde/restauration de l'Epic 2 pour la continuité.

Ces obligations s'appliquent aux capacités concernées au moment de leur livraison, sans exiger que tout le système de restauration soit implémenté avant le premier diagnostic de démarrage. Les contrats et preuves complètent I0 progressivement.

**Aucun script, migration, sauvegarde, changement de droit, installation ou développement exécuté.** Numéro PostgreSQL précis, outillage, contrôle de récupération locale et protection des clés restent ouverts. CONCERNS maintenu ; suivi non généré ; PR non fusionnée.


## Complément validé — récupération des clés

[ADR-I0-003](ADR-I0-003-RECUPERATION-CLES.md) fixe le parcours : copie de la clé protégée par une phrase distincte choisie à la première sauvegarde complète, demandée pour restauration sur un autre PC ; clé locale utilisable au quotidien sans ressaisie de cette phrase. Format et mécanismes restent à qualifier ; aucun essai exécuté.
