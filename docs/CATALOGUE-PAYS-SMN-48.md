# SMN-48 — Catalogue de pays

[Jira SMN-48](https://lmn24.atlassian.net/browse/SMN-48) · [Contrat BMAD](../_bmad-output/implementation-artifacts/spec-smn-48-catalogue-pays.md)

## Administration

Depuis **Administration → Pays**, le Scrum Master Administrateur consulte les sept pays préchargés : France (FR), Allemagne (DE), Royaume-Uni (GB), Espagne (ES), Portugal (PT), Italie (IT) et Canada (CA).

Pour ajouter un pays, renseigner son **code ISO à deux lettres** et son **nom**, puis valider. Un code déjà présent déclenche un refus plutôt que la création d'un doublon. Aucun fichier CSV/ICS ni calendrier de jours fériés n'est demandé.

Le catalogue apparaît aussi dans les suggestions du champ **Pays** de chaque fiche individuelle sous **Administration → Membres → Localisation**. Cela ne déduit pas automatiquement un fuseau horaire, ne modifie pas la langue de l'application et n'altère pas les pays historiques.

L'indication **« Calendrier national : Non configuré »** signifie qu'aucune source de jours fériés n'a encore été chargée : elle ne signifie pas « aucun jour férié ». Les imports et calendriers nationaux seront développés dans les prochaines Stories.

## État technique et recette

Le développement se trouve sur la branche `feat/smn-48-country-catalog` et n'est **pas fusionné sur main** tant que la sonde d'installation et sa liste de tables autorisées n'auront pas été adaptées à la migration v15. Ces mises à jour ont été bloquées par l'outil d'édition du dépôt.

Une fois ces prérequis résolus, faire la recette sur PostgreSQL 18.6 pilote (jamais sur une base importante sans sauvegarde/restauration qualifiée), puis exécuter :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Vérifier les sept entrées initiales, la création de NL/Pays-Bas, la tentative de doublon FR (HTTP 409), les refus HTTP 403 pour le rôle Utilisateur, l'absence de toute fausse donnée de jour férié, la proposition NL dans la localisation d'un membre et l'état « initialisé » de la sonde après migration v15.

Les scénarios ci-dessus sont des **instructions** de recette, pas une preuve qu'ils ont été exécutés.
