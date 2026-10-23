# SMN-92 — Classification ROAM des risques — 23/10/2026

Jira : https://lmn24.atlassian.net/browse/SMN-92

## Réalisation publiée sur main
- Catalogue ROAM indépendant : `resolved`, `owned`, `accepted`, `mitigated`.
- Modèle PostgreSQL séparé `smn_risk_roam` et audit append-only `smn_risk_roam_audit`, créés à la première écriture explicite admin ; pas de migration dans les requêtes en lecture seule.
- `GET/PATCH /api/admin/registries/[id]/roam` : lecture collective, modification admin protégée, contrôle équipe et type risque, verrou `FOR UPDATE`, version optimiste, audit transactionnel avec auteur/date/avant/après.
- Bloc ROAM affiché sur la fiche risque, en lecture seule pour le rôle user.
- `shouldAlertHighRisk` exclut les risques ROAM `resolved` et interdit une alerte de criticité si les niveaux sont absents. À brancher lors de SMN-94/104 : aucun moteur d'alertes haut risque n'est encore livré.
- Aucun champ de probabilité, d'impact ou de criticité n'est modifié par l'API ROAM. Le moteur de criticité distinct est prévu ensuite.
- Traductions FR/EN et tests ciblés ajoutés.

## Limites / DoD
- AC1/2 : code livré, recette PostgreSQL et navigateur à faire.
- AC3 : règle métier pure présente, raccordement effectif aux alertes encore absent.
- AC4/5 : séparation des services garantie dans le code ; interactions avec la future source de probabilité/impact à intégrer/tester après SMN-93.
- Aucune exécution des tests `tsx`, de `pnpm typecheck`, du build ou de la recette navigateur n'est revendiquée.
- Le ticket Jira demeure ouvert ; aucune CI GitHub Actions.

## Recette locale
```powershell
git pull
pnpm typecheck
pnpm exec tsx --test tests/smn-92-risk-roam.test.ts
pnpm i18n:check
pnpm build
```
