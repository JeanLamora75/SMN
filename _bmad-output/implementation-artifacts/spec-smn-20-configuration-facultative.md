---
story: SMN-20
status: in-review
implementation: code-published-on-feature-branch
tests: awaiting-execution
base: dev/smn-27-i18n-json-20261020
---
# SMN-20 — Implémentation BMAD

**Besoin :** FR-3 / FR-65 / FR-58, D-PRD-004/005/127.  
**Jira :** https://lmn24.atlassian.net/browse/SMN-20

## Critères d'acceptation
- AC1 : le registre distinct affiche uniquement les trois réglages déjà livrés, statut réel, lien utile, après Express/Guidé.
- AC2 : les trois états sont modifiables et persistés par un administrateur ; ignoré n'est pas terminé.
- AC3 : pays de référence et phrase de secours : la transition automatique se fait dans la transaction d'enregistrement effectif.
- AC4 : les préférences d'affichage restent manuelles ; `ignored` n'est jamais réactivé par un signal automatique.
- AC5 : la table, les routes et l'UI n'ont aucun lien d'écriture vers action, risque, événement ou rapport métier.

## Déploiement
Une migration additive v5 est appliquée par `ensureAccountsSchema` sur le schéma reconnu. Le probe et le diagnostic valident la migration additionnelle. En cas d'incohérence, refus strict ; jamais de réinstallation ou de purge.

## Suivi
Implémentation sur une branche dépendant de SMN-27 ; attendre tests/CI et revue indépendante avant fusion. Recette Windows à effectuer après synchronisation et intégration du socle i18n. Voir `docs/CONFIGURATION-FACULTATIVE-SMN-20.md`.
