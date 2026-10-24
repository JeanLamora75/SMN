# SMN-234 — Capacité C01/C02 de Sprint, 24 octobre 2026

## Contexte
Demande validée par l'utilisateur à partir de deux captures : bloc Indicateurs de la
fiche Sprint et carte Capacité du cockpit. Le Sprint illustré est Terminé, non Clôturé.

## Périmètre
- Ajout de C01 (prévue J/H) et C02 (réelle J/H) dans l'onglet Indicateurs.
- Références calculées séparées à côté des champs. Préremplissage uniquement au
  démarrage de la modale lorsqu'aucune valeur enregistrée n'existe.
- Saisie manuelle prioritaire, y compris 0, aucune mutation sur simple lecture.
- Valeurs enregistrées par Sprint (table smn_sprint_capacity_kpi), révision
  concurrente et audit append-only (table smn_sprint_capacity_kpi_audit).
- Protection de clôture, snapshot à la clôture, consultation historique figée.
- Lecture cockpit : saisie KPI si présente, sinon moteur initial / constaté.
- FR/EN, même formulaire, droits admin/user préexistants.

## Règle de calcul
- C01 : capacité de développement recalculée sur toute la durée du Sprint avec
  readDevelopmentCapacity ; ne reconstitue pas l'instantané immuable d'ouverture.
- C02 : référence réelle issue de readActualCapacity, jusqu'à la date constatée,
  jamais projetée sur le futur. Calcul inconnu si source manquante.
- Le gel des tables historiques d'Epic 3 n'est pas modifié.
- Null, zéro et source indisponible sont distincts.

## Mise en œuvre
- src/server/sprints/sprint-capacity-kpis.ts : lecture, calculs isolés,
  écriture versionnée, audit.
- src/app/api/admin/sprints/capacity-kpis/route.ts : API d'écriture autorisée.
- src/app/app/admin/sprints/[sprintId]/page.tsx : lecture contextualisée.
- src/app/app/admin/sprints/[sprintId]/sprint-indicators-panel.tsx : cartes
  et modal, calcul non destructif.
- src/server/dashboard/cycle-reader.ts : projection des KPI enregistrés.
- src/server/sprints/closure.ts : figement dans le snapshot de clôture.
- src/server/installation/contract.ts et migration SQL : schéma connu.
- Traductions françaises et anglaises.
- tests/smn-234-capacity-kpis-20261024.test.ts : régression ciblée.

## Recette manuelle requise
- Après synchronisation de main, pnpm typecheck, pnpm lint,
  pnpm exec tsx --test tests/smn-234-capacity-kpis-20261024.test.ts
  et pnpm build.
- En administrateur : ouvrir Sprint terminé > Indicateurs, consulter C01/C02,
  ouvrir le crayon, observer préremplissage et référence ; modifier une valeur,
  enregistrer ; vérifier tableau de bord du Sprint sélectionné.
- Rééditer après recalcul : la saisie est conservée ; 0 est valide.
- Contrôler utilisateur lecture seule, Sprint clôturé sans crayon, FR/EN,
  mobile et qualité du calcul sur un vrai jeu de membres/absences.
- Tester une base ayant et n'ayant pas exécuté la migration.
- Les scripts BMAD uv et les tests projet Windows n'ont pas été exécutés depuis
  les connecteurs : publication source ne signifie pas validation de recette.

## Traçabilité
- Jira SMN-234 (propriétaire de la fiche) et SMN-21 (consommateur cockpit).
- UX référentiel : docs/UX-REFERENTIEL-BMAD.md, AC-CAP01 à AC-CAP03.
