# SMN-50 — Import CSV de jours fériés nationaux

L'import d'un fichier iCalendar ICS avec sélection humaine des événements est disponible séparément dans [SMN-51](IMPORT-ICS-FERIES-SMN-51.md). Les deux formats partagent la politique de conflits et la traçabilité des modifications.

[Ticket Jira](https://lmn24.atlassian.net/browse/SMN-50) · [Contrat BMAD](../_bmad-output/implementation-artifacts/spec-smn-50-import-csv-feries.md)

## Utilisation

Depuis **Administration → Pays**, section **Importer des jours fériés nationaux (CSV)**, choisir le pays cible, le fichier CSV UTF-8 et le traitement des dates déjà présentes. Cliquer sur **Prévisualiser**, consulter toutes les décisions et les raisons des rejets (navigation par pages de 50 lignes), puis **Confirmer l'import**. Ce dernier bouton n'est activé que s'il existe des lignes admissibles.

Exemple : fichier `feries_fr.csv` à enregistrer en UTF-8 :

```csv
date;nom;pays
2020-01-01;Jour de l'An;FR
2020-05-01;Fête du Travail;FR
2020-07-14;Fête nationale;FR
```

L'en-tête anglais `date,name,country` et la virgule comme séparateur sont également acceptés. Les guillemets CSV permettent un séparateur dans les libellés. Limites : 1 Mio pour le fichier, 5 000 lignes de données, date civile 1900–2200, nom non vide (120 caractères maximum), code pays conforme à la sélection et présent dans le catalogue.

## Politique de conflits et audit

- **Ignorer les dates existantes** (défaut) : ne remplace aucune valeur déjà enregistrée. Les dates identiques ou contradictoires sont marquées rejetées et n'ajoutent pas de trace de modification.
- **Remplacer les noms différents** : corrige explicitement le nom pour une date du même pays, journalisant la valeur précédente et la nouvelle valeur avec l'identifiant de l'Administrateur.
- Les dates répétées **dans le fichier** sont rejetées à partir de la deuxième occurrence ; dates incorrectes, noms vides et pays incohérents sont rejetés ligne par ligne.
- La confirmation est atomique. Si des données sont intervenues depuis l'aperçu, elle est refusée avec HTTP 409 et un nouvel aperçu.
- Chaque création/correction effectivement persistée crée une ligne d'audit `smn_national_holiday_audit`. Les capacités figées et les anciens PDF ne sont pas recalculés.
- Une année complétée par CSV est **partielle**, sauf si sa couverture était déjà vérifiée comme configurée. Cette mention indique seulement la disponibilité des données, non leur exhaustivité.

## Recette pilote Windows 11 / PostgreSQL 18.6

**Sur une base pilote isolée, pas sur des données personnelles sans sauvegarde**, récupérer la branche `main`, puis exécuter :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Vérifier la migration v16→v17 et l'accès privé. Importer les trois lignes CSV ci-dessus pour FR, vérifier la prévisualisation, confirmer puis refaire le même import (aucun doublon). Tester un second fichier pour 2010 et 2042, des doublons dans le CSV, `2026-02-30`, un nom vide, le pays `DE` avec FR sélectionné, les deux politiques, et la conservation de l'audit avant/après. Vérifier un refus HTTP 403 pour un utilisateur ordinaire, une prévisualisation refusée après modification concurrente, et l'absence de variation des capacités initiales/PDF historiques.

Le code et les tests sont fournis ; **ces commandes et la recette ne sont pas attestées comme exécutées**. GitHub Actions est volontairement hors circuit ; la validation locale reste à documenter.
