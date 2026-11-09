# SMN-37 — Réinitialiser une installation avec confirmation renforcée

Jira : https://lmn24.atlassian.net/browse/SMN-37  
Date : 9 novembre 2026  
**État : partiellement implémentée. Prévisualisation disponible ; réinitialisation destructive non activée.**

## Vérification de l'existant
Le dépôt `main` contient la création de sauvegardes chiffrées, un inventaire et des vérifications d'intégrité, la prévisualisation de restauration SMN-33, le diagnostic bloquant SMN-34 et la protection des effacements SMN-40. Aucune route de réinitialisation complète qualifiée n'existait. Les contrôles des données effacées, la reconstruction isolée et la bascule atomique PostgreSQL/fichiers ne sont pas établis.

## Livré
- `src/server/installation/reset-preview.ts` : inventaire **read-only** de l'installation, version PostgreSQL et schéma, nombre de tables métier et estimation de lignes PostgreSQL, état du dossier de documents privés et présence de paquets de sauvegarde. Les nombres de lignes sont **estimés** (catalogue `pg_class.reltuples`) et ne constituent pas un périmètre de suppression.
- `src/server/installation/reset-policy.ts` : contrat explicite des risques et blocages, confirmation littérale requise, `canExecute:false` obligatoire.
- `src/app/api/admin/installation/reset/route.ts` : GET protégé Administrateur, sans modification des données ; POST réservé aux Administrateurs, en **refus HTTP 409** même si la phrase de confirmation est correcte, car le moteur n'est pas qualifié. Aucun `DROP`, `TRUNCATE`, `DELETE`, restauration ou changement de configuration n'est déclenché.
- `src/app/app/admin/backups/installation-reset-preview.tsx` et `page.tsx` : interface sous Administration → Sauvegardes, aperçu à la demande, tableau de volumes estimés, risques et conseil de sauvegarde. Fermeture et navigation n'entraînent aucun changement.
- `src/i18n/fr.json`, `src/i18n/en.json` : textes et avertissements.
- `tests/smn-37-installation-reset-policy.test.ts` : tests de politique de refus pour anonyme, utilisateur, confirmation incorrecte, confirmation correcte mais sans preuve de reprise et périmètre des risques.

## Critères d'acceptation
| AC | État |
|---|---|
| AC1 — Prévisualiser données, relations et fichiers, recommander sauvegarde | **Partiel** : inventaire de tables, volumes estimés, documents privés et avertissements ; pas de projection exhaustive ligne par ligne |
| AC2 — Annuler/quitter sans réinitialisation | **Implémenté dans le parcours** : lecture seule et fermeture sans effets |
| AC3 — Réinitialiser et vérifier/auditer après confirmation | **Non implémenté, volontairement bloqué** : nécessite moteur de reprise qualifié |
| AC4 — Interdire à Utilisateur/anonyme | **Implémenté côté API** via `authorizeApi` ; test d'intégration des permissions à exécuter |
| AC5 — Nouvelle installation sans effacement implicite | **Préservé** : aucun raccordement destructif aux routes bootstrap ou de création |

## Sécurité avant activation réelle
1. Inventaire exhaustif, transactionnel et borné de PostgreSQL, documents privés, archives PDF/TXT/Office, états de comptes, sessions, liens et rapports.
2. Sauvegarde préalable complète, **restauration effectivement testée** sur base isolée et clé de récupération disponible.
3. Source d'évidence des effacements hors base restaurable (SMN-39/40) : ne pas supprimer ni réintroduire des données personnelles.
4. Verrouillage des écritures et déconnexion des sessions, journal d'intention durable, bascule DB et fichiers coordonnée, retour arrière après crash.
5. Confirmation nominative de l'installation, révision stable du diagnostic, consentement explicite et audit immuable d'exécution/vérification. Une phrase seule ne suffit pas.
6. Réinitialisation **distincte** de la création d'une seconde installation, sans toucher à la première.

## Qualification et adaptation BMAD
À exécuter sur Windows et une installation PostgreSQL **jetable**, puis effectuer revue de code et recette UI :
```powershell
pnpm exec tsx --test tests/smn-37-installation-reset-policy.test.ts
pnpm i18n:check
pnpm typecheck
pnpm test
pnpm build
```
Ces tests, la CI et la recette PostgreSQL n'ont **pas été exécutés** depuis le connecteur GitHub. Le script `uv` de l'agent BMAD n'a pas été exécuté. Ne pas clôturer SMN-37 tant que AC3 et les tests réels ne sont pas réalisés.
