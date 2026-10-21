# SMN-62 — Story 3.21 — Prévisualiser les effets d'une replanification

[Jira SMN-62](https://lmn24.atlassian.net/browse/SMN-62) · Epic 3 · Dépendances SMN-57 à SMN-61 et futurs cycles opérationnels des Epics 4/7.

## Décision d'architecture

Au stade actuel, SMN **ne possède pas encore d'objet de cycle Scrum/Kanban opérationnel** avec modification transactionnelle de ses bornes. La confirmation SMN-62 produit donc une **replanification confirmée du référentiel capacitaire**, distincte d'une mise à jour de Sprint/Kanban. Il serait incorrect d'annoncer que les cycles des futurs Epics 4/7 ont été modifiés. Leur workflow de replanification devra réutiliser le moteur de prévisualisation et raccorder l'application effective des bornes à son propre état, avec la même logique de protection.

Une période source est identifiée par équipe + dates inclusives. Sa ligne `smn_capacity_period_override` peut exister pour une saisie manuelle ou ouverture réelle SMN-58/59 ; pour une période uniquement calculée, elle n'est créée qu'au **POST confirmé**, jamais au GET. Les périodes, capacités et clichés historiques **ne sont pas déplacés** : les bornes proposées et l'historique des confirmations sont conservés dans de nouvelles tables liées à la période source.

## Critères d'acceptation

**AC1 — Avant / Après et delta fiable :** le GET `/api/admin/capacity-replanning?oldStart=...&oldEnd=...&newStart=...&newEnd=...` valide les deux fenêtres (1 à 93 jours) et utilise `readDevelopmentCapacity` SMN-57 sur les deux périodes dans une transaction PostgreSQL `REPEATABLE READ READ ONLY`. Chaque référence possède `status`, `jh` nullable et `missing`. Le delta est `after.jh - before.jh` avec arrondi final à 4 décimales **uniquement si les deux références sont connues** ; sinon `null`. La capacité prévue manuelle est présentée séparément de la référence, y compris un `0 JH` explicite.

**AC2 — Engagement initial immuable :** `smn_capacity_initial_snapshot` est lu, jamais modifié. La valeur initiale figée ne change pas lorsque les dates proposées changent. L'affichage « Après » est une proposition de capacité courante et n'est jamais substitué au cliché initial.

**AC3 — Priorité aux valeurs manuelles :** la prévisualisation restitue séparément `manualPlannedJh` (SMN-58), `manualActualJh` (SMN-60), `retainedBeforeJh` et `proposedRetainedAfterJh`. Une saisie prévisionnelle de `0` est conservée comme `0`, sans la remplacer par une référence calculée. **La confirmation n'écrit jamais dans les tables SMN-58/59/60/61, à l'exception de la création éventuelle d'une ligne de période source sans valeur manuelle pour une référence jusque-là calculée seulement** ; elle enregistre exclusivement une cible de planification capacitaire et un audit. Aucune valeur manuelle n'est copiée automatiquement sur la période cible.

**AC4 — Période clôturée :** `closed_at` sur la période source rend `canConfirm=false` et `POST` refuse la confirmation (HTTP 423) jusqu'à une **réouverture autorisée**, non créée dans cette Story. Le moteur refuse également de fusionner silencieusement deux périodes sources lorsque les dates cibles sont déjà occupées (HTTP 409). Les PDF et clichés antérieurs ne sont pas réécrits.

**AC5 — Données absentes, erreur et confirmation atomique :** toute référence non calculable conserve `jh=null`, un motif `missing` et `referenceDeltaJh=null`. Le GET ne sauvegarde jamais. Une erreur de calcul retourne `calculation-error`, sans prétendre à des zéros ni à une sauvegarde. Pour POST, le serveur recalcule Avant/Après sous verrou de l'équipe, dans `BEGIN ISOLATION LEVEL REPEATABLE READ`, et exige une empreinte SHA-256 correspondant à la prévisualisation ainsi qu'une `revision` optimiste valide. Si la référence, la saisie ou la cible a changé : HTTP 409 et rollback. Sinon, création/modification de la cible et insertion de son historique dans **une seule transaction**, puis `saved=true` seulement après COMMIT. Identifiant d'événement UUID unique, rejeu idempotent sans écriture supplémentaire.

## Implémentation

- Migration additive **v25 → v26**, `smn_capacity_replanning` (cible courante et révision) et `smn_capacity_replanning_history` (événement confirmé, empreinte, état précédent et confirmation complète). L'historique est append-only grâce au trigger PostgreSQL BEFORE UPDATE OR DELETE, sans cascade destructive. Prisma, migration d'installation, sonde, diagnostic mis à jour.
- `src/server/capacity/replanning.ts` : validation, `capacityDelta`, moteur `previewReplanning`, `confirmReplanning`. Détection de période fermée et collision de cible. Empreinte construite avec les références, la saisie source, l'engagement initial, le réalisé manuel, la révision de période et la précédente replanification.
- `src/app/api/admin/capacity-replanning/route.ts` : GET lecture seule et POST confirmation, sécurisés via `authorizeApi` members:read/write réservé à l'Administrateur et contrôle d'origine.
- `src/app/app/admin/development-capacity/replanning-preview.tsx` : dates proposées, prévisualisation Avant/Après, blocages, message explicite « aucune sauvegarde », puis confirmation demandée à l'Administrateur. Les nouvelles bornes ne modifient pas les bornes utilisées par le panneau de calcul tant que l'utilisateur ne les sélectionne pas séparément.
- `src/i18n/fr.json` et `en.json`, tests `tests/capacity-replanning.test.ts` couvrant AC1–5, concurrence, valeur zéro, fermeture et rejeu.

## Qualification et frontières

Les bornes de capacité replanifiées **ne deviennent pas automatiquement les dates opérationnelles d'un Sprint ou d'un flux Kanban**. Cette intégration demande le modèle de cycle et la procédure de réouverture des Epics 4/7. La simple présence d'une cible confirmée ne signifie pas qu'une modification de cycle a eu lieu.

GitHub Actions n'est pas utilisé, conformément à la décision du projet. Contrôles statiques et tests de contrat écrits ; **aucun test TypeScript/pnpm, migration PostgreSQL 18.6, API HTTP ou recette navigateur exécuté** dans cet environnement de connecteurs. Statut Jira **En cours**, BMAD `review` jusqu'aux preuves de recette. Workflow Amelia adapté manuellement ; renderer natif `uv` indisponible.
