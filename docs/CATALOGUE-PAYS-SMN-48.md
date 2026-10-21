# SMN-48 — Catalogue de pays

[Jira SMN-48](https://lmn24.atlassian.net/browse/SMN-48) · [Contrat BMAD](../_bmad-output/implementation-artifacts/spec-smn-48-catalogue-pays.md)

## Administration

Depuis **Administration → Pays**, le Scrum Master Administrateur consulte les sept pays préchargés : France (FR), Allemagne (DE), Royaume-Uni (GB), Espagne (ES), Portugal (PT), Italie (IT) et Canada (CA).

Pour ajouter un pays, renseigner son **code ISO à deux lettres** et son **nom**, puis valider. Un code déjà présent déclenche un refus plutôt que la création d'un doublon. Aucun fichier CSV/ICS ni calendrier de jours fériés n'est demandé.

Le catalogue apparaît aussi dans les suggestions du champ **Pays** de chaque fiche individuelle sous **Administration → Membres → Localisation**. Cela ne déduit pas automatiquement un fuseau horaire, ne modifie pas la langue de l'application et n'altère pas les pays historiques.

L'indication **« Calendrier national : Non configuré »** signifie qu'aucune source de jours fériés n'a encore été chargée : elle ne signifie pas « aucun jour férié ». Depuis [SMN-49](CALENDRIERS-NATIONAUX-SMN-49.md), le pays de référence FR/DE/GB peut être préchargé depuis les jeux locaux nationaux (N−2 à N+1) ; les importations CSV/ICS demeurent des Stories ultérieures.

## État technique et recette

Les contrôles d'installation prennent désormais en compte la table `smn_country` et le schéma PostgreSQL v15. La publication du code ne vaut pas validation des tests : les pipelines de vérification échouent avant le démarrage de leurs étapes. La recette sur poste Windows/PostgreSQL 18.6 reste obligatoire.

Après récupération de `main`, faire la recette sur PostgreSQL 18.6 pilote (jamais sur une base importante sans sauvegarde/restauration qualifiée), puis exécuter :

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
