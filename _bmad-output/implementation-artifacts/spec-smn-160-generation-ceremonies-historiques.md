# SMN-160 — Génération facultative des cérémonies lors d'une reprise historique

**Référence Jira :** https://lmn24.atlassian.net/browse/SMN-160  
**Epic :** SMN-8 — Reconstituer les Sprints passés  
**Date de décision :** 23/10/2026  
**État :** spécification mise à jour ; développement et recette non réalisés.

## Décision fonctionnelle
Lors de la création d'un Sprint **historique**, le Scrum Master choisit explicitement s'il souhaite **générer les cérémonies de l'équipe telles que configurées dans SMN**. Le choix est **désactivé par défaut**. Il s'applique aux cérémonies Scrum standards et aux modèles de réunions personnalisées actifs, selon les règles et paramètres de l'équipe.

Si le choix est désactivé, aucune cérémonie n'est créée. Si le choix est activé, les événements produits sont signalés comme **reconstitués à partir de la configuration**, et non comme des réunions réellement tenues. Aucune transition automatique vers « Tenue », « Non tenue » ou « Annulée » n'est autorisée par cette opération.

## Contrat d'acceptation
1. Choix explicite de génération pendant le parcours de reprise historique, désactivé par défaut.
2. Aucun événement standard ou personnalisé généré si le choix est désactivé.
3. Si activé, génération cohérente avec la configuration de l'équipe et absence de doublons.
4. Mention de la provenance « reconstituée » dans calendriers et reportings, sans faux statut réel.
5. Audit du choix et des paramètres/modèles utilisés ; impossibilité de prétendre que la configuration actuelle prouve les pratiques passées.
6. Création et génération atomiques et idempotentes, y compris après échec ou répétition.
7. Aucune modification des règles de création ordinaire d'un Sprint courant ou futur.

## Dépendances
- **SMN-159** : parcours explicite de création d'un Sprint historique.
- **SMN-65 / SMN-66** : cadence de l'équipe et création des Sprints.
- **SMN-72 / SMN-77** : cérémonies standards et modèles personnalisés.
- **SMN-211** : recette des reprises historiques et transparence sur les données reconstituées.

## Conséquences techniques pour Amelia
- Ajouter un booléen métier explicite au parcours historique (valeur par défaut : `false`).
- Adapter la création du Sprint et des cérémonies en une unité transactionnelle (ou orchestration offrant la même garantie de non-duplication).
- Garantir que les calculs rétrospectifs sont exécutables même pour des périodes dont la fin est passée : les protections contre l'invention automatique d'événements ne doivent être levées **que** par ce choix explicite.
- Enregistrer la provenance, la version ou un instantané des paramètres ayant servi à la reconstitution et l'identité de l'initiateur.
- Distinguer les données théoriques reconstituées des déclarations de tenue réelle, jusqu'aux API, aux vues calendrier et aux exports.
- Prévoir les tests « option désactivée », « option activée », « modèle personnalisé », « configuration manquante », « échec transactionnel », « rejouer la demande », « calendrier/rapport », « création ordinaire inchangée ».
- Ne pas inventer une configuration historique si elle n'est pas disponible ; indiquer les limites de provenance.

## Cohérence documentaire
Le fichier `_bmad-output/planning-artifacts/epics.md` a été aligné sur cette décision : Story 8.2 (SMN-160), AC5 de Story 4.8 (SMN-72) et AC1 de Story 10.13 (SMN-211). Les validations globales antérieures du 19/10/2026 sont historiques et ne valent pas recette de cette évolution.

**Ce document est uniquement une spécification. Aucune modification du code ou de la base n'est prétendue.**
