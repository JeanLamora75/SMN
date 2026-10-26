# User Story — Harmoniser graphiquement la page Calendrier (Cockpit Agile, Option A)

**Projet :** SMN — Scrum Master Notebook  
**Type :** Story  
**Epic :** [SMN-228](https://lmn24.atlassian.net/browse/SMN-228) — Refonte UX transverse  
**Statut du document :** spécification validée par le demandeur le 26/10/2026 ; développement et recette non réalisés.  
**Périmètre :** `/app/team-calendar` en Scrum et Kanban.

## Besoin utilisateur
**En tant que** Scrum Master ou Release Train Engineer,  
**je souhaite** retrouver dans le Calendrier d'équipe les mêmes repères visuels, la hiérarchie de navigation et le langage graphique que dans la page Registres,  
**afin de** passer rapidement d'un écran à l'autre et consulter ou gérer les événements sans devoir réapprendre l'interface.

## Description
Appliquer l'option A « Cockpit Agile harmonisé » : bandeau contrasté avec contexte du cycle, navigation et bascule de vues ; panneau indépendant de filtres et fuseau horaire ; calendrier à cartes lisibles et vue Agenda de même identité. Les contrats métier existants demeurent normatifs. Aucun changement d'API, DB, permissions ou calcul n'est inclus.

## Critères d'acceptation (Given/When/Then)
**AC-01 — Bandeau.** Étant donné l'ouverture de la page, quand les données sont prêtes, alors le bandeau Cockpit Agile présente titre, sous-titre, équipe autorisée, sprint/période, dates et état réellement disponibles sans contenu fictif.

**AC-02 — Navigation.** Étant donné plusieurs cycles accessibles, quand j'utilise précédent, suivant, sélecteur ou Aujourd'hui, alors le calendrier affiche les données du cycle choisi avec la logique de sélection existante et commandes visibles.

**AC-03 — Vues.** Étant donné une période sélectionnée, quand je bascule Cartes/Agenda, alors une seule vue est active et les mêmes dates, données autorisées, filtres, timezone et possibilités d'interaction sont préservés.

**AC-04 — Filtres.** Étant donné les filtres Cérémonies et réunions / Absences, quand je les active ou désactive indépendamment, alors leur catégorie est affichée/masquée et l'état de chaque contrôle est explicite, utilisable au clavier et exposé aux technologies d'assistance.

**AC-05 — Fuseaux.** Étant donné les zones accessibles, quand je vois ou modifie la zone active, alors son nom est lisible, les heures affichées la respectent et le fallback existant est maintenu en cas d'échec.

**AC-06 — Dates.** Étant donné un cycle réel, quand j'affiche les Cartes desktop, alors sept dates figurent par rangée à partir du premier jour de période, sans jour inventé ni tronqué ; en absence de cycle, tout le mois civil courant est affiché.

**AC-07 — Jours spéciaux.** Étant donné aujourd'hui, un week-end ou un férié, quand sa carte est affichée, alors aujourd'hui a un contour renforcé + libellé, les deux autres sont grisés, et le nom réel de fête est accolé à la date, sans attribuer abusivement le férié à toute l'équipe.

**AC-08 — Événements.** Étant donné plusieurs réunions et absences, quand je consulte la journée, alors icônes, titres et horaires sont lisibles, les réunions restent classées par heure de début et les absences ont un repère distinct sans suggérer une urgence fictive.

**AC-09 — Création.** Étant donné une journée du lundi au vendredi et des droits de création valides, quand je clique `+ Réunion` ou `+ Absence`, alors la modale existante correspondante s'ouvre avec date préremplie. Sur férié de semaine ces commandes restent disponibles selon les permissions ; aucun `+` le week-end.

**AC-10 — Protection.** Étant donné un utilisateur en lecture seule ou une période non modifiable, quand le calendrier est consulté, alors les données autorisées sont visibles mais les commandes d'écriture interdites sont absentes ; accès serveur inchangé.

**AC-11 — Responsive.** Étant donné 320/375/390/768/1024/1440 pixels et zoom 200 %, quand j'utilise la page, alors les commandes ne se superposent pas, chaque date reste consultable, Cartes et Agenda utilisables ; scroll horizontal de la grille permis si explicite et maîtrisé.

**AC-12 — Thèmes, i18n, accessibilité.** Étant donné FR/EN et les thèmes clair/sombre, quand la page est utilisée à la souris ou au clavier, alors les textes sont localisés en JSON, les focus visibles, les contrastes vérifiés et les contrôles nommés pour les aides techniques.

**AC-13 — Périmètre technique.** Étant donné la comparaison du diff avec `main`, quand le code est relu, alors les changements restent concentrés dans Calendrier/CSS local/i18n, sans migration, changement d'API, backend, permissions, calculs, Registres ou autres pages.

**AC-14 — Vérification.** Étant donné la refonte livrable, quand Amelia exécute la recette, alors les tests disponibles et contrôles i18n/lint/typecheck/test/build sont exécutés réellement, résultats consignés, et captures comparatives/risques résiduels présentés avant validation.

## Dépendances et impacts techniques
- Identité graphique : [Avenant Cockpit Agile des Registres](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/AVENANT-GRAPHIQUE-OPTION-C-2026-10-26.md).
- Contrat métier : [Calendrier 22/10/2026](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-calendrier-periodes-2026-10-22/CALENDRIER-CONTRAT-UX.md), [recette historique](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-calendrier-periodes-2026-10-22/CALENDRIER-RECETTE-UX.md).
- Fichiers à analyser : `src/app/app/team-calendar/team-calendar-view.tsx`, `calendar-option-b.tsx`, `page.tsx`, `calendar-meeting-modal.tsx`, `src/app/globals.css`, `src/i18n/fr.json`, `src/i18n/en.json`.
- Écart existant distinct : le code ouvre une modale au clic sur le titre réunion alors que CAL-09 prévoit une page dédiée ; **ne pas traiter furtivement dans l'US d'habillage**.
- Interaction avec SMN-282 multiéquipes : ne pas altérer équipe active, isolement des producteurs et droits ; se conformer aux mécanismes réellement implémentés, sans créer un contexte fictif.

## Hors périmètre
Nouveaux modes calendrier, glisser-déposer, changements métier, permissions ou schémas, intégrations externes Google/Outlook, refonte des modales métier, nouvelle mécanique multiéquipes, autres pages SMN.

## Definition of Done
- [ ] AC-01 à AC-14 couverts et preuves documentées.
- [ ] Comparatif visuel Registres / maquette / Calendrier réel, desktop et mobile.
- [ ] Scrum/Kanban, Cartes/Agenda, admin/user, FR/EN, thèmes clair/sombre contrôlés.
- [ ] Aujourd'hui, férié de semaine, week-end, sprint clôturé, aucun cycle, fuseau, événements chargés.
- [ ] + Réunion/+ Absence : dates préremplies, modales, permissions et validations existantes.
- [ ] `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` : résultats réels, y compris non-exécutions explicites.
- [ ] Aucun changement involontaire d'API/DB/droits ou d'autres pages.
- [ ] Validation visuelle et fonctionnelle du demandeur avant fusion de branche.

**La création Jira et la publication documentaire ne démontrent aucune implémentation ni recette.**
