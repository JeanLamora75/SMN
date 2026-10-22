# SMN-88 — Métriques et objectifs à réexaminer après replanification

Jira : https://lmn24.atlassian.net/browse/SMN-88

## Implémentation initiale
- Enrichissement de l'aperçu SMN-82 par un bilan des données susceptibles d'être affectées : nombre d'objectifs, présence des SP persistés, capacité initiale retenue, capacité réelle manuelle, nouvelle référence calculée provisoire et sources de capacité manquantes.
- Les sources enregistrées restent inchangées lors de la modification des dates. Aucun recalcul de SP, évaluation d'objectif, donnée manuelle ou PDF.
- Le moteur conserve le refus de replanifier un Sprint clôturé, et une réouverture explicite demeure nécessaire pour toute correction métier.
- Affichage des avertissements dans l'interface administrateur, FR/EN.

## Réserves
- La capacité théorique nouvelle est calculée à titre d'aperçu mais la réévaluation persistée des seules références réelles calculables ne fait pas encore partie de la transaction de confirmation. AC3 partiel.
- Le calcul de référence s'appuie sur la période UTC extraite des bornes, à valider avec la date locale et les exceptions de calendrier.
- L'audit de replanification préexistant journalise les modifications acceptées ; les tentatives refusées et le détail des sources de l'aperçu ne sont pas encore persistés. AC5 partiel.
- Le mode recalcul des cérémonies de SMN-82 reste indisponible.
- Les contrôles de renommage sur Sprint clôturé sont hors du périmètre modifié ici, à vérifier séparément.
- Compilation TypeScript, validation Prisma, tests PostgreSQL et recettes non exécutés ; GitHub Actions indisponible.

État : implémentation partielle en PR brouillon, non fusionnée sur main.
