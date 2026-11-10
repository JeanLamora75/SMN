# SMN-433 — Commandes de création et suppression globale des cérémonies du sprint

Date : 10 novembre 2026. Story Jira : [SMN-433](https://lmn24.atlassian.net/browse/SMN-433) — Epic 4.

## Règles UX

Dans la **fiche d'un sprint**, onglet **Cérémonies** :

- si le total des cérémonies vaut zéro, afficher **Créer les cérémonies** ;
- si au moins une cérémonie existe, afficher **Supprimer toutes les cérémonies** ;
- s'il manque une source de données, si le résultat n'est pas disponible, si le sprint est clôturé ou si l'utilisateur ne peut pas gérer le sprint, n'afficher aucune action destructive ni génératrice ;
- la condition porte sur le total (toutes pages), et non sur les 25 événements visibles sur la page courante ;
- après succès, actualiser la fiche, sans navigation forcée.

La suppression requiert une confirmation préalable indiquant le nombre de cérémonies et le caractère irréversible. Les erreurs de modification concurrente et les refus sont affichés. Messages FR/EN.

## Service et sécurité

Route : `POST /api/admin/sprints/{sprintId}/ceremonies-bulk` ; corps `{teamId, operation:"create"|"delete", expectedCount}`.

- Permission d'écriture administrateur, résolution stricte de l'équipe Scrum, contrôle de l'identité du sprint, contrôle de l'équipe non archivée, protection des sprints `closed`.
- Transaction PostgreSQL et verrou sur le sprint ; validation du compteur avant écriture.
- La génération réutilise `saveTemplateOccurrences` et les modèles actifs de la bonne équipe avec les règles de créneaux, jours fériés et jours fermés. Pour un sprint passé non clôturé, génération de type `reconstructed`. Si zéro cérémonie est générée, rollback et information utilisateur.
- La suppression efface les trois sources de l'onglet : `smn_sprint_ceremony`, `smn_scrum_template_occurrence`, `smn_sprint_exceptional_meeting` ; elle purge segments, audits, historiques d'état, participants, historiques de capacité et liens de réunion, sans effacer les fiches de registre ni les modèles de cérémonie.
- Si une source obligatoire manque ou une contrainte FK inconnue interdit une suppression, retour en erreur et rollback. Aucun effacement implicite hors sprint.
- Un snapshot d'un sprint clôturé n'est jamais modifié ; les fichiers de rapport et sauvegardes préexistants ne sont pas réécrits.

## Critères de recette

1. Aucun événement : seul « Créer les cérémonies » apparaît, la génération des modèles actifs produit des occurrences.
2. Un ou plusieurs événements, y compris différentes sources : seul « Supprimer toutes les cérémonies » apparaît. Annuler la confirmation ne change rien.
3. Confirmer : suppression de toutes les occurrences appartenant uniquement à ce sprint, et bouton « Créer » au rafraîchissement.
4. Sprint clôturé : aucune commande ; aucune modification du snapshot.
5. Autre équipe, lecteur, équipe archivée, compteur périmé : refus sans écriture.
6. Absence de modèles actifs, source manquante ou FK bloquante : refus clair et rollback.
7. Tester le tout sur PostgreSQL v33 avec des événements, des commentaires/relations de registre et des participations ; vérifier les métriques de capacité après suppression.
8. Vérifier FR/EN et clavier.

## État de qualification

Implémentation et tests de garde-fous ajoutés à GitHub `main`. Lecture statique des fichiers réalisée ; tests Node et intégration PostgreSQL/Windows **non exécutés** à ce stade. Ne pas clôturer la Story avant preuves.

**Adaptation BMAD :** le workflow est réalisé manuellement via les fichiers de skill, sans script `uv`. Référence : `.agents/skills/bmad-agent-dev/SKILL.md` et `_bmad/bmm/config.yaml`.
