# SMN-50 — Story 3.9 : Importer des jours fériés nationaux depuis un CSV

**Référence** : [SMN-50](https://lmn24.atlassian.net/browse/SMN-50) · Epic 3 · dépendances : SMN-48 et SMN-49.

## Contrat CSV et comportement

Le format SMN est un **CSV UTF-8** avec en-tête `date;nom;pays` (ou `date,name,country`), séparateur `;` ou `,`, colonnes strictement dans cet ordre, dates ISO `YYYY-MM-DD`, pays ISO alpha-2. Les guillemets CSV échappés sont traités. L'interface Administrateur (Pays) sélectionne le pays et le fichier (1 Mio maximum). Maximum 5 000 lignes de données par import. Aucune API externe n'est utilisée.

- **AC1** : `src/server/holidays/csv-import.ts` construit un aperçu paginé avec numéro de ligne, date, nom, pays, décision (`create`, `replace`, `reject`) et raison de rejet (`invalid-date`, `duplicate-in-file`, `existing-date`, `country-mismatch`, etc.).
- **AC2** : aucune restriction à la plage N−2…N+1 : dates admissibles 1900–2200. Les années non couvertes portent le statut `partial` au lieu d'être faussement présentées comme complètes.
- **AC3** : aucune date impossible, nom vide, pays incohérent, collision de date du fichier ou structure CSV invalide ne passe silencieusement ; aucune donnée n'est inventée.
- **AC4** : deux choix explicites `skip` (défaut : conserver toutes les dates existantes) ou `replace` (corriger les noms différents). Le POST de confirmation exige l'empreinte de l'aperçu (CSV + état des dates). Si l'état a changé, HTTP 409 et nouvel aperçu requis. Toutes les insertions/modifications sont transactionnelles, sérialisées avec l'import national et uniquement sur le pays demandé.
- **AC5** : migration additive v16→v17 créant `smn_national_holiday_audit` avec date/pays, ancien nom, nouveau nom, opération, source CSV, Administrateur, horodatage ; aucune opération sur les capacités initiales figées ni les documents PDF historiques.

## Architecture

- `src/server/holidays/csv-migration.ts` + miroir Prisma ; `src/server/accounts/migration.ts`, `db/probe.ts`, `installation/diagnostic.ts` et `contract.ts` reconnaissent v17.
- `src/server/holidays/csv-import.ts` : parseur CSV, validation et import atomique.
- `src/app/api/admin/countries/import-csv/route.ts` : endpoint réservé au rôle Administrateur, contrôle de taille de corps pour autoriser les CSV sans modifier la limite 4 Ko des autres endpoints.
- `src/app/app/admin/countries/holiday-csv-import.tsx` et `country-admin.tsx` : choix du pays, politique de collision, aperçu détaillé paginé, confirmation, résultat.
- `src/server/countries/catalog.ts` : présence d'années partielles, sans donner l'illusion de calendrier complet.
- `src/server/holidays/preload.ts` : réimport national ne classe pas à tort comme invalide une année comportant des journées supplémentaires validées par l'Administrateur.
- `tests/holiday-csv-import.test.ts` : tests de contrat rédigés.

## Qualification

Aucun lancement de `uv run`/renderer BMAD v6.12.4 (pas de checkout de l'environnement Windows de référence dans ChatGPT) : adaptation manuelle par lecture des skills et via connecteurs GitHub/Jira. Les vérifications de compilation, tests, API et PostgreSQL restent à réaliser localement. Selon la politique SMN sans GitHub Actions, suivi BMAD `review` et Jira `En cours`, y compris après merge sur `main`.
