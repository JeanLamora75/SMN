# SMN-46 — Calendrier hebdomadaire individuel

[Story Jira](https://lmn24.atlassian.net/browse/SMN-46) · [Contrat BMAD](../_bmad-output/implementation-artifacts/spec-smn-46-calendrier-hebdomadaire-individuel.md)

## Utilisation — Administrateur

Dans **Administration → Membres de l'équipe → Calendrier individuel**, sélectionner un membre. Sa fiche reste centrale : tous les changements sont rattachés à **son identifiant stable**, pas à une affectation ou à une deuxième équipe.

### Trame hebdomadaire

Le modèle **proposé** est lundi au vendredi, matin et après-midi travaillés ; samedi et dimanche non travaillés. Il faut cliquer sur **Enregistrer la trame** pour qu'il devienne une donnée réellement confirmée. Tant qu'aucune trame enregistrée n'est applicable, SMN affiche « disponibilité inconnue » et ne traite pas les cases suggérées comme des jours de travail prouvés.

Chaque jour accepte : journée entière, matin seulement, après-midi seulement ou aucun créneau. La **date d'effet** d'une nouvelle version doit être aujourd'hui ou plus tard, et ne peut précéder la dernière version. Une version future ne change pas les dates antérieures.

Le **taux contractuel** reste un paramètre séparé, géré avec les affectations.

### Exceptions datées

Choisir une date ponctuelle et cocher « Matin » / « Après-midi » selon la disponibilité particulière de ce jour. Une note facultative est possible. Une exception remplace la trame uniquement pour cette date et possède son historique de révisions. Elle est enregistrable si une trame hebdomadaire est déjà applicable à cette date.

Une **exception de travail** ne vaut pas saisie de congé, d'absence ou de jour férié ; ces données seront gérées dans leurs fonctionnalités dédiées. **Aucun jour d'absence, JH ou KPI nul n'est créé automatiquement.**

### Archivage et historique

Une fiche archivée reste consultable en lecture seule avec tous ses calendriers datés. La suppression d'un membre possédant un calendrier historique est refusée. Les règles de clôture et de réactivation de SMN-45 ne suppriment ni ne réécrivent cette source.

## Qualification pilote Windows 11

Après récupération de `main` via GitHub Desktop :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Faire la recette d'une fiche membre existante : calendrier initial seulement suggéré ; confirmer lundi–vendredi ; marquer mercredi après-midi non travaillé ; enregistrer un samedi matin exceptionnel ; créer une nouvelle version future ; contrôler les différentes dates de lecture, le maintien des anciennes versions et le refus d'édition par un compte Utilisateur.

La migration PostgreSQL passe de **v12 à v13**, sans supprimer de données. Tester sur PostgreSQL 18.6 pilote ; ne pas migrer des données importantes tant qu'une sauvegarde/restauration indépendante de l'Epic 2 n'est pas qualifiée.

**Documentation de recette ≠ preuve d'exécution** : les résultats doivent être consignés après lancement réel.
