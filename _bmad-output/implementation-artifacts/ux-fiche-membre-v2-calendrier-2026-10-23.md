# Fiche membre V2 — Onglet Calendrier et modales ciblées (23/10/2026)

## Demande de recette
L'utilisateur confirme que la fiche **Calendrier** est lisible, mais la modale « Modifier calendrier » est beaucoup trop longue et regroupe trois préoccupations indépendantes. Capture utilisateur du 23/10/2026.
- **Historique des trames** : à afficher directement sous le tableau de trame dans l'onglet Calendrier ; à retirer de toute fenêtre d'édition.
- **Exception datée (jour ou demi-journée)** : à supprimer de la modale Modifier calendrier.
- **Absence individuelle et Absences individuelles** : à supprimer entièrement de cette même modale ; la création d'absence relève de l'onglet Absences (refonte dédiée à réaliser ensuite).

## Justification métier de l'exception
D'après [SMN-46](https://lmn24.atlassian.net/browse/SMN-46) (AC2-AC4) et le [contrat Fiche Membre V2](../planning-artifacts/ux-designs/ux-equipe-membres-2026-10-22/FICHE-MEMBRE-V2-UX-CONTRAT.md) (M-V2-08, V2-13 à V2-15) :
- La trame hebdomadaire régit les créneaux récurrents (jour, matin, après-midi), versions datées.
- L'exception datée adapte la disponibilité d'un membre **pour un jour précis**, même en demi-journée, sans changer sa trame générale. Elle peut permettre, par exemple, un samedi travaillé ponctuellement.
- L'exception **n'est pas un congé ou une absence** : les absences doivent être enregistrées via un motif/catégorie et des dates dans le module Absences distinct.
- Historisation de toutes les versions de trames et d'exceptions sans réécriture rétroactive et sans inventer de capacité.
- Conformément au contrat, « Modifier trame » et « Ajouter une exception » sont **deux actions distinctes** dans l'onglet, chacune avec sa propre modale.

## Implémentation GitHub main
- `src/app/app/admin/members/member-calendar-editor.tsx` réécrit pour être exclusivement l'éditeur de la **trame 7 jours × 2 créneaux** et de sa **date d'effet**. Aucune table d'historique, aucune exception, aucun formulaire d'absence. API POST `/api/admin/members/[id]/calendar` action `weekly` et règles de contrôle inchangées. Les brouillons non enregistrés restent protégés.
- `src/app/app/admin/members/[id]/member-calendar-summary.tsx` affiche sous la trame en lecture seule le tableau de toutes les versions hebdomadaires (révision/date d'effet) puis, lorsqu'elles existent, les versions datées des exceptions (date, révision, matin, après-midi, note). Source unique GET `/api/admin/members/[id]/calendar`. Absence de trame enregistrée explicitée.
- `src/app/app/admin/members/member-calendar-exception-editor.tsx` nouveau formulaire isolé : date d'exception, matin/après-midi, note facultative, validation d'une trame applicable, POST action `exception`. Il préremplit les données de la date sélectionnée et conserve les mécanismes de révision optimiste. Il ne modifie jamais la trame ni les absences.
- `src/app/app/admin/members/[id]/member-detail.tsx` : une action `+ Ajouter une exception` ouvre sa propre modale ; le crayon reste dédié à la trame ; les deux sauvegardes referment la modale et rechargent la consultation via une clé de rafraîchissement.
- `src/i18n/fr.json` et `en.json` : `members.calendar.addException` ajouté en parité, autres textes existants conservés.
- `tests/member-calendar-ux.test.ts` : 7 tests statiques de non-régression sur l'emplacement des historiques, les séparations des modales, les champs et APIs, la protection des brouillons, la rafraîchissement et la parité FR/EN.

**Non modifiés** : schéma PostgreSQL, migrations, API, calculs de capacité, données enregistrées, logique d'absence/particularités régionales, permissions serveur et autres onglets.

## Recette
1. Synchroniser `main` avec GitHub Desktop, arrêter et relancer SMN.
2. `pnpm exec tsx --test tests/member-calendar-ux.test.ts`
3. `pnpm exec tsx --test tests/member-calendar.test.ts`
4. `pnpm i18n:check`, `pnpm typecheck`, `pnpm build`.
5. Vérifier l'onglet Calendrier : grille hebdomadaire puis historique des trames, puis historique des exceptions s'il existe.
6. Cliquer sur « Modifier calendrier » : uniquement grille 7 jours / matin-après-midi, date d'effet et actions enregistrer/annuler ; pas d'historique, de gestion d'exception ni d'absence.
7. Cliquer « Ajouter une exception » : fenêtre indépendante, date et demi-journées, note ; enregistrer et vérifier la ligne d'historique dans l'onglet.
8. Vérifier date passée, version concurrente, membre archivé et responsive ; aucune perte de données antérieures.

**Statut : code publié sur main ; 10 contrôles statiques effectués sur les sources distantes et conformes (position des historiques, séparation des modales, préservation de l'API, rechargement, clé FR/EN et fichier de tests). Les sept tests ajoutés n'ont pas été exécutés, pas plus que TypeScript, le build, la recette navigateur ou PostgreSQL Windows.** Aucun résultat `pnpm`, navigateur ou CI ne doit être présenté comme acquis.

## Suite hors périmètre
Refonte de l'onglet **Absences** : déplacer l'édition/création inline existante vers un bouton « Nouvelle absence » ouvrant une modale dédiée ; laisser la liste/historique en consultation. Cette étape sera traitée lors de la reprise de l'onglet Absences, sans création de ticket Jira ou mutation Jira implicite.
