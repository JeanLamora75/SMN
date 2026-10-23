# SMN-95 — Dépendances entre équipe locale et équipes externes — 23/10/2026

Référence : https://lmn24.atlassian.net/browse/SMN-95

## Livré sur `main`
- Extension `smn_dependency_parties` pour une dépendance centrale unique (`item_id` PK) : équipe demandeuse et contributrice, chacune soit équipe SMN de l'installation (ID vérifié), soit nom libre d'équipe externe.
- Aucune création de `smn_team` ou de compte pour les acteurs externes.
- Historique des versions `smn_dependency_parties_audit`, date/auteur, transactions et verrou d'édition, contrôle de révision.
- API `GET/PATCH /api/admin/registries/[id]/parties`, projection collective lisible pour user et mutation réservée à l'admin.
- Fiche dépendance : champs de choix équipe locale/externe et nom libre pour chaque partie ; FR/EN centralisés.
- Tests de contrats préparés dans `tests/smn-95-dependency-parties.test.ts`.

## Limites et vérifications requises
- **La saisie des équipes est aujourd'hui un enrichissement de la fiche après sa création**, non incluse dans l'enregistrement initial ; AC1 entièrement bout-en-bout à confirmer, et parcours de création intégré à améliorer.
- Responsable/échéance restent gérés par le formulaire commun et l'audit des révisions SMN-91.
- L'identifiant unique est partagé entre les équipes ; la liaison de plusieurs cycles est encore hors du socle et devra être développée dans les Stories de liens.
- Aucune commande locale `pnpm typecheck`, test, `pnpm build` ni recette PostgreSQL/navigateur exécutée ici. GitHub Actions indisponibles. Jira non clôturé.

```powershell
git pull
pnpm typecheck
pnpm exec tsx --test tests/smn-95-dependency-parties.test.ts
pnpm i18n:check
pnpm build
```
