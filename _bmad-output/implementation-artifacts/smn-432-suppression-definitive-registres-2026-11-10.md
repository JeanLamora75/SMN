# SMN-432 — Suppression définitive d'une fiche de registre

Date : 10 novembre 2026. Statut : **développement publié sur `main`, recette PostgreSQL et Windows non attestée**.

## Besoin et périmètre

L'Administrateur peut supprimer physiquement une fiche des registres (risque, obstacle, dépendance, décision, action ou fait marquant) depuis le menu d'actions de sa ligne dans la vue liste, depuis sa carte ou depuis sa fiche détaillée. La commande « Supprimer définitivement » est masquée en lecture seule.

La suppression doit impérativement être précédée d'une confirmation explicite contenant le titre et les conséquences. Annuler ne déclenche aucune écriture. Une confirmation validée envoie une requête HTTP DELETE et impose l'équipe et la révision courante.

## Contrat API

`DELETE /api/admin/registries/{id}` avec corps JSON `{ "teamId": "uuid", "revision": 1 }`.

* Écriture administrateur : politique d'autorisation identique aux modifications ; contexte d'équipe validé côté serveur.
* Codes : 200 (succès), 400 (entrée invalide), 403 (interdit), 404 (élément absent/inaccessible), 409 (conflit de révision ou dépendance non qualifiée), 503 (schéma ou service indisponible).
* Transaction explicite PostgreSQL et verrou `FOR UPDATE OF r` ; contrôle de l'équipe non archivée et de la révision. Suppression simultanée interdite en cas de conflit.
* Purge des commentaires et révisions, journaux associés, évaluations et données spécifiques, associations Scrum/Kanban, actions, relations sortantes **et entrantes**, demandes idempotentes liées, liens de réunions et signalements automatiques associés. Les références `replaces_id` de décisions restantes sont désassociées.
* Aucun `ON DELETE CASCADE` global ni écriture hors transaction ; toute nouvelle contrainte étrangère non traitée provoque un refus avec rollback plutôt qu'une suppression partielle.
* Aucune autre fiche principale n'est supprimée. Les liens des autres fiches vers la cible sont retirés, leurs contenus et données propres sont conservés.

## Portée et limites

La suppression efface les données vivantes du registre et leurs audits propres dans PostgreSQL ; elle **ne modifie pas** des sauvegardes, rapports déjà exportés, archives immuables ou snapshots de sprint clos. Une restauration d'ancienne sauvegarde peut réintroduire la fiche : la gouvernance de sauvegarde/effacement et les contrôles Epic 2 continuent de s'appliquer.

Le risque d'un historique de décision référençant un élément supprimé est limité en supprimant les relations courantes et en vidant `replaces_id`; **les exports et historiques gelés conservent leur contenu historique**. L'exhaustivité des dépendances doit être revalidée sur une base PostgreSQL v33 réelle avant clôture. Une migration SQL n'est pas nécessaire pour cette approche applicative.

## Vérification attendue

1. Créer une fiche de chaque type avec commentaire, association, relation entrante et sortante ; déclencher Annuler puis Confirmer depuis les trois surfaces.
2. Observer l'effacement physique, l'absence d'orphelins, l'actualisation liste/alertes et le retour à la liste depuis la fiche.
3. Rejouer avec un lecteur non administrateur, une équipe voisine, une équipe archivée, une révision périmée et une cible inconnue.
4. Simuler une contrainte FK non prise en charge et vérifier `409` / rollback intégral.
5. Vérifier les traductions FR/EN et la navigation clavier, ainsi que les snapshots gelés et les archives.
6. Exécuter `pnpm exec tsx --test tests/registry-permanent-deletion.test.ts` et les tests PostgreSQL pertinents sur l'environnement de validation, puis compléter les preuves de CI/recette.

**Adaptation BMAD :** le script `uv` du workflow n'est pas exécutable dans GitHub ni dans cet environnement ; la configuration Amelia est lue manuellement depuis `.agents/skills/bmad-agent-dev/SKILL.md`, `customize.toml`, `_bmad/custom/bmad-agent-dev.toml` et `_bmad/bmm/config.yaml`. Les tests non exécutés ne sont pas déclarés réussis.

Référence Jira : [SMN-432](https://lmn24.atlassian.net/browse/SMN-432).
