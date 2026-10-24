# SMN — Option B calendrier : état du développement et de la recette

**Date : 24 octobre 2026 · Agent : Amelia · Dépôt :** [JeanLamora75/SMN](https://github.com/JeanLamora75/SMN/tree/main)
**Statut : implémentation publiée sur `main`, revue statique partielle ; recette locale, visuelle et PostgreSQL NON EXÉCUTÉE.**
**Référence UX :** [README Option B](../planning-artifacts/ux-designs/ux-calendrier-option-b-2026-10-24/README.md) · [maquette HTML](../planning-artifacts/ux-designs/ux-calendrier-option-b-2026-10-24/MAQUETTE-CALENDRIER-OPTION-B.html).

## Modifications publiées

- `src/server/members/team-calendar.ts` : `declaredAbsentMemberCount` fondé sur les personnes ayant une absence personnelle effective à la date, indépendamment de `reportedUnavailable`. Indicatif de jour férié agrégé pour utilisateur.
- `src/server/members/central-calendar.ts` : projection d'absences anonymisée pour `user` ; les jours fériés d'au moins un membre sont présentés sans localisation.
- `src/app/app/team-calendar/calendar-option-b.tsx` : deux rendus Cartes / Agenda partageant la même liste d'événements ; absences en premier, une seule ligne ; icônes Bootstrap et horaires.
- `src/app/app/team-calendar/team-calendar-view.tsx` : barre de filtres, sélection de cycle, navigation, comptages chargés par période, jours éligibles et modales.
- `src/app/app/admin/members/member-absence-editor.tsx` : propriété facultative `initialDate` pour préremplir la date depuis le calendrier.
- `src/app/globals.css` et `src/i18n/{fr,en}.json` : styles de densité, deux présentations, thèmes hérités et nouveaux libellés.
- Documentation BMAD option B (6 fichiers) publiée telle que fournie par Sally ; référentiel UX mis à jour.
- Tests modifiés : `tests/team-calendar.test.ts`, `tests/central-calendar.test.ts`; test ajouté : `tests/calendar-option-b-ux.test.ts`.

## Contrôles réellement réalisés

Une revue statique a relu **11 fichiers** du dépôt par le connecteur GitHub et vérifié **11 assertions structurelles**, toutes satisfaites : JSON FR/EN parsables et clés synchrones, Cartes par défaut, état partagé des vues, ordre absences/réunions dans JSX, compteur distinct séparé de `reportedUnavailable`, absence de création le week-end, date préremplie et CSS compact.

**Ces assertions ne sont pas des tests TS/React, SQL, API HTTP, E2E ou captures d'écran.**
Aucun `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` ni `pnpm build` exécuté sur l'application : le code distant n'est pas monté localement. Aucun GitHub Actions exécuté.

## Grille de recette UXB-01 → UXB-30

Les résultats ci-dessous sont des états de revue, **pas** des validations de conformité. La colonne preuve donne un point d'entrée de code ; des captures ou résultats de tests doivent être ajoutés après exécution locale.

| Critère | Statut | Source à vérifier |
|---|---|---|
| UXB-01 | Code présent, exécution non vérifiée | src/app/app/team-calendar/team-calendar-view.tsx |
| UXB-02 | Code présent, exécution non vérifiée | src/app/app/team-calendar/team-calendar-view.tsx |
| UXB-03 | Code présent, exécution non vérifiée | src/server/members/team-calendar.ts · tests/team-calendar.test.ts |
| UXB-04 | Code présent, exécution non vérifiée | src/server/members/team-calendar.ts · tests/team-calendar.test.ts |
| UXB-05 | Code présent, exécution non vérifiée | src/server/members/team-calendar.ts · tests/team-calendar.test.ts |
| UXB-06 | Code présent, exécution non vérifiée | src/server/members/team-calendar.ts · tests/team-calendar.test.ts |
| UXB-07 | Code présent, exécution non vérifiée | src/server/members/team-calendar.ts · tests/team-calendar.test.ts |
| UXB-08 | Code présent, exécution non vérifiée | src/server/members/team-calendar.ts · tests/team-calendar.test.ts |
| UXB-09 | Code présent, exécution non vérifiée | src/server/members/team-calendar.ts · tests/team-calendar.test.ts |
| UXB-10 | Code présent, exécution non vérifiée | src/app/app/team-calendar/calendar-option-b.tsx |
| UXB-11 | Code présent, exécution non vérifiée | src/app/app/team-calendar/calendar-option-b.tsx |
| UXB-12 | Code présent, exécution non vérifiée | src/app/app/team-calendar/calendar-option-b.tsx |
| UXB-13 | Code présent, exécution non vérifiée | src/app/app/team-calendar/team-calendar-view.tsx |
| UXB-14 | Code présent, exécution non vérifiée | src/app/app/team-calendar/team-calendar-view.tsx |
| UXB-15 | Code en place, recette intégrée requise | src/server/members/team-calendar.ts · tests/team-calendar.test.ts |
| UXB-16 | Code présent, exécution non vérifiée | src/app/globals.css · src/i18n/{fr,en}.json |
| UXB-17 | Code présent, exécution non vérifiée | src/app/app/team-calendar/team-calendar-view.tsx |
| UXB-18 | Code présent, exécution non vérifiée | src/app/app/team-calendar/team-calendar-view.tsx |
| UXB-19 | Code présent, exécution non vérifiée | src/app/app/team-calendar/team-calendar-view.tsx |
| UXB-20 | Code en place, recette intégrée requise | src/app/globals.css · src/i18n/{fr,en}.json |
| UXB-21 | Code présent, exécution non vérifiée | src/app/app/team-calendar/calendar-option-b.tsx |
| UXB-22 | Code présent, exécution non vérifiée | src/app/app/team-calendar/calendar-option-b.tsx |
| UXB-23 | Code présent, exécution non vérifiée | src/app/app/team-calendar/team-calendar-view.tsx |
| UXB-24 | Code présent, exécution non vérifiée | src/app/globals.css · src/i18n/{fr,en}.json |
| UXB-25 | Code en place, recette intégrée requise | src/app/globals.css · src/i18n/{fr,en}.json |
| UXB-26 | Code en place, recette intégrée requise | src/app/globals.css · src/i18n/{fr,en}.json |
| UXB-27 | Code présent, exécution non vérifiée | src/app/app/team-calendar/calendar-option-b.tsx |
| UXB-28 | Capture réelle non produite | Maquette HTML de Sally, pas de capture SMN |
| UXB-29 | Code présent, exécution non vérifiée | src/server/members/team-calendar.ts · tests/team-calendar.test.ts |
| UXB-30 | Code en place, recette intégrée requise | src/server/members/team-calendar.ts · tests/team-calendar.test.ts |

## Comparaison au prototype de Sally

| Critère visuel | Prototype approuvé | Code présent | Vérification encore requise |
|---|---|---|---|
| En-tête | Titre + contexte Sprint/dates et commandes alignées | `smn-cal-page-heading`, `smn-cal-context` | Capture desktop et état sans Sprint |
| Barre de filtres | Deux filtres et sélecteur Cartes/Agenda | `smn-cal-toolbar`, `smn-cal-switch` | Couleurs, focus, largeur mobile |
| Grille | Sept cartes compactes par rangée | `smn-calendar-grid`, `smn-cal-card` | Mesurer dimensions et défilement |
| Journée absente | **Absences (N)** une ligne en premier | `smn-cal-absence` avant `dayMeetings.map` | Capture avec A/A/B = 2 depuis la base |
| Cérémonies | Icônes et horaires sous nom de réunion | `meetingIcon`, `meetingTitle`, `smn-cal-event-time` | Correspondance réelle des noms/types |
| Actions | Deux boutons en pied du lundi au vendredi | `smn-cal-day-actions`, `isEditable` | Ouverture / enregistrer / annuler |
| Agenda | Regroupement par jour, même chronologie | `smn-cal-agenda-day` et `renderEvents` commun | Capture et interaction |
| Thèmes | Héritage des palettes clair/sombre | Couleurs via variables `--smn-*` | Captures dans les six combinaisons |
| Responsive | Grille desktop avec défilement prudent, Agenda mobile | media queries CSS | Contrôle à 320px et zoom 200% |

**Aucune capture de l'application réelle n'a pu être produite dans cet environnement.** Les images et données du prototype HTML ne prouvent pas la conformité de l'application SMN.

## Validation locale demandée (Windows 11)

Mettre à jour `main` avec GitHub Desktop, puis dans PowerShell à la racine du dépôt :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm exec tsx --test tests/team-calendar.test.ts tests/central-calendar.test.ts tests/calendar-option-b-ux.test.ts
pnpm build
pnpm dev
```

Ouvrir la page **Calendrier d'équipe** de l'application locale, vérifier une période active et la vue Agenda, puis tester l'absence de plusieurs membres, la confidentialité du rôle `user`, les jours fériés et les modales. Conserver des captures réelles pour comparaison côte à côte avec la maquette. Ne clore la recette qu'après validation utilisateur.

## Écarts / risques non résolus par une simple lecture du code

1. Les détails graphiques exacts (tailles, espacement, comportement au zoom et rendu sombre) ne sont pas attestés sans navigateur sur l'application.
2. Les données PostgreSQL et les routes API de création doivent être vérifiées avec un compte admin et un compte user.
3. Les heures des réunions créées sont encore converties par le flux d'édition existant ; une recette sur machines hors fuseau Europe/Paris et sur les bascules été/hiver est nécessaire.
4. La sélection des membres éligibles lors de corrections historiques doit être comparée aux périodes d'affectation réelles ; la liste d'administration existante expose principalement l'affectation courante/la dernière affectation.
5. Les jours fériés agrégés sont anonymisés pour les utilisateurs en lecture seule, donc le titre régional personnel n'est pas révélé.
6. Un défaut préexistant ailleurs dans le projet pourrait bloquer `pnpm build` ; ne pas attribuer sans diagnostic un échec à cette refonte.

**Conclusion :** déploiement de code effectué ; validation fonctionnelle et visuelle en attente. Jira inchangé.
