# SMN — Correction de l'édition des réunions dans le tableau de bord

**Date :** 26 octobre 2026

## Incident et constat vérifié dans le code

Dans la modale « Modifier : Daily Scrum », un enregistrement affichait :
« La fiche a été modifiée ou la période est protégée. Rechargez le tableau de bord. »

La capture présente une réunion du **27/10/2026 09:30 Europe/Paris**
avec statut enregistré **Tenue**, alors que le jour courant est le **26/10/2026**.

Le service `src/server/dashboard/event-edit.ts` rejetait **toute**
requête `PATCH` concernant une réunion future si le statut proposé était
`held` ou `not_held`, même lorsque celui-ci était **strictement inchangé**
et que l'utilisateur modifiait uniquement la durée réelle ou une autre donnée.
Le retour `not-yet-due` (HTTP 409) était traduit par le message générique
de conflit dans `src/app/app/operational-edit.tsx`.

La capture et le code rendent cette cause **fortement probable** ; la
base PostgreSQL locale n'a pas été interrogée pour vérifier le code exact
reçu lors de l'enregistrement initial.

## Règle de correction

1. Une édition d'une réunion qui porte **déjà** `held`/`not_held`
   sur une date future ne crée aucune nouvelle déclaration de présence ;
   elle reste enregistrable si la version, les limites du Sprint et les
   autres règles métier sont respectées.
2. Passer un statut `scheduled` (ou autre) à `held`/`not_held`
   pour une réunion à venir reste interdit avec `not-yet-due`.
3. Déplacer une réunion déjà tenue du passé vers le futur reste interdit,
   afin de ne pas contourner la règle de déclaration de présence.
4. Les protections de Sprint **clos**, de bornes de dates, de validation,
   de version concurrente et d'audit sont préservées.
5. Côté interface, les codes `not-yet-due`, `outside-sprint`,
   `closed-period` et `conflict` ont des messages contextualisés
   et localisés FR/EN, sans masquer les vrais problèmes d'accès aux données.

## UX

Les boutons **Enregistrer** et **Annuler** sont dans une **même rangée**
flexible, à droite, avec espace constant et retour à la ligne sur écran
étroit. L'ancien bouton Annuler situé hors du formulaire est supprimé
**uniquement pour la modale d'édition des réunions**, afin d'éviter le doublon
et de conserver le comportement des notes, registres et configurations.
Le bouton de sauvegarde reste désactivé pendant l'enregistrement.

## Vérifications

- Tests de décision `futureAttendanceTransitionForbidden` : état futur
  inchangé autorisé, nouvelle déclaration future interdite, déplacement
  passé → futur interdit, édition au passé conservée.
- Test transactionnel avec double SQL simulé : édition du réel d'un Daily
  futur marqué `held`, écriture et audit ; rejet d'une nouvelle déclaration
  `held` future.
- Tests statiques de la modale et des libellés FR/EN.
- **Non exécutés à distance :** `pnpm lint`, `pnpm typecheck`,
  `pnpm test`, `pnpm build` et recette navigateur sur Windows/PG local.

**Recette Windows :** mettre à jour `main`, ouvrir un Sprint non clos,
éditer la durée réelle d'une réunion déjà marquée Tenue (sans changer le
statut), puis enregistrer. Vérifier aussi qu'une réunion prévue à une
date future et encore Planifiée ne peut pas être marquée Tenue en avance.
Contrôler enfin l'alignement horizontal des deux boutons et les messages
précis en cas de véritable conflit.
