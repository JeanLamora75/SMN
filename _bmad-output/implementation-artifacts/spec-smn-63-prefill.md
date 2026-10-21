# SMN-63 — Story 3.22 — Préremplir sans écraser les choix

**Jira :** https://lmn24.atlassian.net/browse/SMN-63 · **Epic 3** · **Références :** UX-04 ; AD-12/16/19 ; FR-61, FR-5/8/9/14 ; [référentiel UX approuvé](../../docs/UX-REFERENTIEL-BMAD.md).

## Décisions

Le préremplissage distingue explicitement trois **provenances** : `saved` (déjà enregistrée), `suggested` (issue d'un contexte connu mais non sauvegardée), `unknown` (aucune source). Une valeur enregistrée, **y compris `null`, chaîne vide ou `0` explicites**, prime sur toute suggestion. La consultation d'un formulaire n'insère ni fiche, ni calendrier, ni absence, ni KPI, ni événement.

Aucun nouveau champ obligatoire artificiel n'est créé. Le nom d'équipe issu de l'installation est montré comme **contexte authentique**, non comme un champ imposé ou deviné. Le pays de référence et la semaine modèle restent modifiables ; seules des actions explicites de l'Administrateur peuvent enregistrer les données.

## Critères

### AC1 — Contexte connu correctement proposé

- `src/lib/form-prefill.ts` fournit `prefillValue(saved,suggestion,empty,hasRecordedValue)` avec une provenance traçable. Une valeur enregistrée est toujours prioritaire ; l'absence de version permet de proposer un contexte connu, sans sauvegarde.
- `member-location-editor.tsx` récupère le pays depuis `readMemberLocation.suggestedCountryIso2` (réglage `smn_general_settings.reference_country`) **uniquement si aucune version enregistrée n'existe**. Une version manuelle dont `country_iso2=null` signifie pays volontairement absent : elle n'est jamais remplacée par le pays de l'installation.
- `member-calendar-editor.tsx` privilégie la dernière semaine enregistrée. Sinon, `suggestedWeek` (semaine type) est explicitement étiquetée **Suggestion non enregistrée**. Ce modèle est éditable avant la sauvegarde.
- `quick-members-admin.tsx` passe `team.name` réel aux sous-formulaires localisation, calendrier et affectation. Les affectations affichent si leur version est enregistrée ou initialement suggérée. Le nom d'équipe n'est ni recomposé ni réécrit.

### AC2 — Inconnues ≠ zéro / absence / événement

- `knownNumber` conserve `null` pour les chiffres absents, non finis ou inconnus, tout en reconnaissant `0` comme valeur réelle lorsqu'il est explicitement numérique.
- Le formulaire de capacité ne définit plus un **début/fin de période opérationnelle fictifs à « aujourd'hui »**. Les deux bornes sont initialement vides et demandées par l'Administrateur. Les dates de prise d'effet des versions membres restent des propositions explicites basées sur l'horloge métier, pas des événements précréés.
- Les panneaux existants gardent `developmentCapacityJh=null` si les sources manquent, les absences non créées n'existent pas et aucune catégorie/motif d'absence n'est deviné. Consulter une date dans l'éditeur d'absences ne crée rien.

### AC3 — Priorité à la saisie enregistrée

- Le moteur SMN-58 reste inchangé : `chooseCapacity` retient `manual_jh` même lorsque `referenceJh` évolue (ex. 32 saisis, calcul 30 puis 28 ; 0 saisi reste 0).
- Dans `development-capacity-view.tsx`, un changement des bornes ou un nouveau calcul ne peut plus **abandonner silencieusement une modification manuelle non enregistrée** : confirmation de l'abandon. Un changement de réglage JH/h est refusé pendant une édition manuelle en attente ; les réglages ne remplacent donc pas un brouillon en cours.
- Les valeurs enregistrées restent prioritaires, quel que soit l'ordre d'arrivée du contexte proposé.

### AC4 — Provisoire utilisable, données facultatives explicites

- Le nom de membre provisoire reste explicitement identifié, et l'e-mail reste facultatif. Le profil n'est pas implicitement confirmé par simple navigation. Les localisations et semaines non enregistrées portent un libellé **Suggestion**, pas « déjà configuré ».
- Les fonctions existantes de lecture/édition et navigation restent disponibles sans exiger de compléter les informations facultatives. `useUnsavedChanges` conserve l'avertissement sur un véritable brouillon modifié ; une valeur uniquement suggérée n'est pas considérée comme une édition enregistrée.

### AC5 — Prévisualisation n'écrit jamais

- Chargement `GET /api/admin/members`, `GET .../calendar`, `GET .../location` et `GET /api/admin/development-capacity` : lecture sans écriture de préremplissage. Les actions de création/lot, absences, calendrier et édition historique demeurent réservées à leurs **POST/PATCH explicites**. Le mécanisme SMN-62 `GET /api/admin/capacity-replanning` est déjà transactionnellement `READ ONLY`, et son POST reste soumis à confirmation et vérification d'empreinte.
- `prefillValue` est une fonction **pure**, sans accès DB/API ni effet de bord. Aucun nouvel endpoint d'écriture ni migration SQL ne sont ajoutés.

## Livrables

- Code : `src/lib/form-prefill.ts` ; formulaires `member-location-editor.tsx`, `member-calendar-editor.tsx`, `assignment-editor.tsx`, `quick-members-admin.tsx`, `member-profile-editor.tsx`, `member-absence-editor.tsx`, `development-capacity-view.tsx`.
- i18n : `src/i18n/fr.json` et `en.json`, clés `prefill.*` centralisées.
- Tests de contrat : `tests/form-prefill.test.ts` (AC1–5, `null` explicite, `0`, suggestion, semaine, capacité calculée/manuelle, profil facultatif, parseurs de prévisualisation).

## Recette et limites

Aucune migration. Tester dans les deux langues et sur profils provisoires, pays d'installation configuré/non configuré, pays volontairement effacé, semaines configurées/non configurées, ancien et nouveau calcul avec saisie manuelle, refus d'effacement involontaire d'un brouillon, navigation à travers les formulaires, et absence de nouvelle écriture suite à un GET. Vérifier que le préremplissage n'ajoute aucune obligation facultative.

Les vérifications statiques sur GitHub et les tests écrits **ne prouvent pas leur exécution**. `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, parcours navigateur et régression PostgreSQL 18.6 restent à effectuer. **GitHub Actions n'est pas utilisé** conformément à la décision du projet. Jira `En cours` / BMAD `review` en attente des preuves de recette.

La commande officielle de rendu BMAD utilisant `uv` n'a pas été exécutée faute de workspace local accessible depuis le connecteur ; le travail a été adapté en appliquant le skill Amelia et les références BMAD depuis GitHub.
