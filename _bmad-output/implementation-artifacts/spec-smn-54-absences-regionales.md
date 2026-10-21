# SMN-54 — Story 3.13 — Particularités régionales comme absences individuelles

**Jira :** https://lmn24.atlassian.net/browse/SMN-54. **Dépendances :** SMN-46 (calendrier individuel), SMN-49 (fériés nationaux), SMN-52 (catégories), SMN-53 (absences individuelles centralisées). **Périmètre :** MVP Scrum/Kanban à équipe unique, sans catalogue régional ni deuxième équipe.

## Contrat et décision de conception

Les jours fériés **nationaux** proviennent exclusivement de `smn_national_holiday`, et les jours **régionaux** se saisissent comme **une absence ordinaire d'une personne**, avec motif et catégorie. Une absence n'est jamais ajoutée automatiquement au calendrier national ni à celui des collègues. Aucun nouveau modèle de données ni nouvelle migration ne sont introduits : **version v19 conservée**.

| Critère | Réalisation |
|---|---|
| **AC1** | Dans Administration → Membres → Calendrier individuel → Absences, bouton « Préparer un jour régional non travaillé ». Il initialise une absence ordinaire sur la date sélectionnée, de matin à après-midi, avec catégorie préselectionnée « Autre » **seulement si active**, motif vide à renseigner obligatoirement. Les autres catégories et les demi-journées restent modifiables. La sauvegarde passe par `saveMemberAbsence`, avec validation et audit SMN-53. |
| **AC2** | `src/server/members/day-availability.ts` calcule une **union de créneaux** : national OU absence(s) ; elle n'additionne jamais la même demi-journée deux fois. La référence de travail provient de la trame hebdomadaire enregistrée (avec éventuelle exception), la référence nationale du pays effectif du membre et de sa couverture nationale. Déduction exprimée en demi-journées de travail et bornée à 0..2 par date. Si la trame manque, la couverture nationale est partielle sans jour confirmé ou le pays est inconnu, `status='unknown'` et `deductedHalfDays=null` (jamais « zéro » par défaut). Un jour explicitement présent dans les fériés reste confirmé même si l'année est partielle. |
| **AC3** | Les données d'absences proviennent de `smn_member_absence(member_id)`. Aucune nouvelle `team_id`, `assignment_id` ou équipe interne. Le calcul et l'API travaillent par membre et date ; chaque affectation future utilisera la **même** fiche et le même résultat par demi-journée. |
| **AC4** | L'éditeur individuel présente nom/motif et catégorie **textuels**, accompagnés de la couleur (SMN-53 et 52). Les données et la résolution journalière sont accessibles via le GET Administrateur `/api/admin/members/[id]/absences?onDate=...`. Le **calendrier d'équipe** et son rendu, prévus en **Story 3.14 / SMN-55**, ne sont pas livrés ici. Son futur écran pourra exploiter ce contrat sans inventer un catalogue régional, mais l'AC4 en situation d'écran équipe reste **à recetter après 3.14**. |
| **AC5** | L'enregistrement délègue uniquement à `saveMemberAbsence` (écriture sur l'absence et son audit). La résolution est en lecture seule. Aucune publication d'alerte collective, événement de cérémonie ni suppression du Daily ; aucun PDF archivé ou capacité initiale figée touché. |

## Fichiers

- `src/server/members/day-availability.ts` : `resolveDayAvailability` (fonction pure, union par créneau) et `readMemberDayAvailability` (lecture par membre/date de trame, exception, localisation et couverture nationale).
- `src/app/api/admin/members/[id]/absences/route.ts` : ajout de `dayAvailability` dans la réponse GET **seulement si `onDate` est fourni** ; conserve les contrôles Administrateur de SMN-53 et la confidentialité des motifs.
- `src/app/app/admin/members/member-absence-editor.tsx` : préparation de l'absence régionale et aperçu de l'indisponibilité cumulée ; motifs et catégories textuels préexistants conservés.
- `src/i18n/fr.json`, `en.json` : traductions centralisées.
- `tests/member-regional-absence.test.ts` : dates régionales, absence de création implicite, union contre férié national, deux demi-journées distinctes, horaires partiels, date non travaillée, couverture partielle/manquante, pays absent, droits.

## Limites et qualité

Le calcul de **capacité de développement consolidée en jours-homme**, taux contractuels et périodes de sprint relève de la Story 3.16 et ne doit pas être inféré à partir de ce seul résumé journalier. Si la couverture nationale est inconnue, aucune fausse disponibilité « complète » n'est affichée. Le calendrier d'équipe et ses contrôles d'affichage sont différés à SMN-55, leur dépendance étant documentée.

Tests écrits mais **non exécutés** en environnement Windows/PostgreSQL dans cette session. Les vérifications statiques ne prouvent pas le passage de `pnpm typecheck`, `pnpm test`, `pnpm lint` ou `pnpm build`. Conformément à la politique projet, GitHub Actions n'est pas utilisé, Jira **En cours**, BMAD **review**, jusqu'aux preuves de recette. Le renderer BMAD via `uv` n'a pas été exécuté dans ce contexte connecteur ; adaptation manuelle via les skills du dépôt.
