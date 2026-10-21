# SMN-70 — Retirer après confirmation des Sprints jamais démarrés

Jira : https://lmn24.atlassian.net/browse/SMN-70

## Choix technique
Suppression logique (`deleted_at`, `deleted_by`) et audit `removed_from_planning`. Le Sprint reste en base avec ses identifiants et audits ; les parcours de planification (proposition, calcul de lot, renommage, liste) excluent les lignes retirées.

## Fonctionnel
- API POST /api/admin/sprints/delete : vérifie la sélection et retourne le récapitulatif sans modifier la base.
- API DELETE /api/admin/sprints/delete : seul l'Administrateur peut confirmer le retrait. Transaction, verrou sur les Sprints, validation finale de statut `planned` et `start_at > now()`, puis journalisation pour chacun. Refuse tout le lot si un seul Sprint est non éligible.
- Interface dédiée avec sélection multiple, revue, explication des conséquences, puis confirmation explicite ; fermeture du dialogue sans écriture.
- Les événements liés ne sont jamais supprimés automatiquement. Aucun schéma de rattachement de réunions à `smn_sprint` n'est encore implémenté dans le périmètre lu ; lorsque celui-ci existera, les références devront être analysées et le récapitulatif enrichi.

## Contrôles nécessaires avant validation
- Essayer un lot avec un Sprint démarré ou clôturé : aucune modification.
- Fermer le dialogue : aucune modification.
- Confirmer plusieurs Sprints futurs : uniquement ceux-ci masqués dans les parcours de planification, audits conservés.
- Vérifier une requête API avec compte Utilisateur : 403.
- Contrôler la concurrence au moment du démarrage d'un Sprint et les références externes.
- Exécuter migration PostgreSQL, compilation TypeScript, lint et recette sur environnement d'exécution.

Statut : implémentation en PR brouillon. GitHub Actions indisponible, tests locaux non exécutés.
