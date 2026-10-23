# SMN-106 — Journal chronologique des faits marquants manuels

Jira : https://lmn24.atlassian.net/browse/SMN-106

## Livré sur main

- Réutilisation de la fiche centrale `highlight` : titre obligatoire, date métier modifiable, description/contexte facultatif, statut `recorded` ; date de création enregistrée par PostgreSQL distinctement du jour déclaré.
- Journal dans l'onglet « Faits marquants » : affichage du libellé « Manuel », de la date métier et de l'instant d'enregistrement pour éviter d'attribuer une saisie tardive à une collecte contemporaine.
- Tri par date métier décroissante puis date d'enregistrement et ID ; filtres de recherche/pagination existants.
- Éditions avec révisions et historique via le service SMN-91. Liens facultatifs vers une fiche qualitative existante via SMN-100, sans rattachement imposé.
- Traductions FR/EN ; tests de contrat `tests/smn-106-manual-highlights.test.ts`.

## Réserves

- Pas encore de rattachement natif du fait marquant aux Sprints (l'API SMN-97 restreint à risque/dépendance). AC5 reste partiel.
- Le journal manuel s'appuie sur l'onglet du registre qualitatif, pas sur une page Journal transverse dédiée. Les événements techniques n'y sont pas mélangés.
- Aucun test, typecheck, build ou recette navigateur/PostgreSQL exécuté ici. Jira reste ouverte ; GitHub Actions indisponibles.

Contrôles Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-106-manual-highlights.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
