# SMN-298 — Inventaire technique initial et plan de migration
Date : 27/10/2026 | Branche : feat/smn-298-modal-cockpit-base
## Résultats vérifiés dans le code de main
- `src/app/app/team-calendar/calendar-meeting-modal.tsx` : modale personnalisée `div[role=dialog]`, gestion du focus et de l'Échap avec hooks, sections horaires/présences/faits enregistrés, traductions `calendarMeeting.*`. Pilote visuel raccordé, comportements inchangés.
- `src/app/app/admin/registries/registry-create-modal.tsx` : `dialog` natif, formulaire multi-section, gestion du brouillon et sauvegarde ; valeurs métier localisées. Pilote visuel raccordé.
- `src/app/app/admin/registries/registry-section-dialog.tsx` et `registry-edit-modal.tsx` : `dialog` natif avec portail, fermeture et protection des modifications ; enveloppe visuelle raccordée.
- `src/app/app/admin/registries/registry-dialog-portal.tsx` : rendu dans `document.body`, nécessaire pour le top layer.
- `src/app/globals.css` : modal membre personnalisée, `dialog.smn-sprint-edit-dialog`, `dialog.smn-team-context-dialog` ; classes existantes potentiellement divergentes.
- `src/app/layout.tsx` : chargement Bootstrap, CSS globaux et attributs `data-bs-theme` / `data-smn-palette`.
- `src/lib/theme.ts` : modes light/dark, vérifier également les palettes de `appearance`.
## Inventaire à compléter avant prétention de conformité AC01
- Recenser systématiquement toutes les occurrences de `dialog`, `role="dialog"`, composants Modal et overlays des fichiers `src/` (dont dashboard, sprints, membre, calendrier, paramètres, rapports) ; relever fichier, type, mode, champs, i18n, droits et validations.
- Préserver les spécificités des assistants et confirmations destructives.
## Implémentation pilote sur la branche
- `src/app/modal-cockpit.css` centralise bandeau, champs, footer et adaptations aux thèmes via les variables `--smn-*` et `--bs-*`.
- Le style est chargé dans `src/app/layout.tsx`, et appliqué aux composants pilotes sans altérer les appels API, l'état du formulaire ou le modèle des événements.
## Bloquants / vérifications
- Aucun test automatisé, build ou capture n'a été exécuté (recette locale par le commanditaire).
- Les libellés i18n des autres modales et leur migration complète restent à faire.
- À vérifier sur le PC : contraste réel en clair/sombre et palettes supplémentaires, rendu sans débordement, focus, scroll, sous-formulaires à enregistrement indépendant, non-régression de l'annulation.
- La Story n'est pas terminée ; il ne s'agit pas d'un inventaire exhaustif.

## Extension de l'étape suivante — 27/10/2026
- `src/app/app/admin/members/team-context-editor.tsx` : enveloppe et en-tête Cockpit Agile adoptés ; champs, transactions et protection des modifications inchangés.
- `src/app/app/admin/sprints/[sprintId]/sprint-detail-editor.tsx` : enveloppe et en-tête Cockpit Agile adoptés ; prévisualisation/replanification et protections inchangées.
- Vérification statique des deux extraits JSX publiés via relecture GitHub, sans exécution de compilateur.
- Restent : réorganisation des pieds d'action lorsque nécessaire, inventaire exhaustif, autres modales, contrôle des traductions et tests locaux.

## Extension — fenêtres de la fiche membre
- `src/app/app/admin/members/[id]/member-detail.tsx` : l'enveloppe unique des éditions profil, affectation, calendrier, exception de calendrier, absence et cycle de vie adopte les classes visuelles Cockpit Agile (header et body).
- Les sous-formulaires `MemberIdentityEditor`, `AssignmentEditor`, `MemberCalendarEditor`, `MemberCalendarExceptionEditor`, `MemberAbsenceEditor`, `MemberLifecycleEditor` restent inchangés dans leur logique ; leurs boutons d'action internes ne sont pas encore déplacés dans un pied partagé.
- À contrôler localement : scroll, focus, alignement des actions, boutons de fermeture et rendu des thèmes pour chacun des six cas. Pas de tests exécutés.

## Étape supplémentaire — actions Enregistrer / Annuler
- `src/app/modal-cockpit.css` : pied de formulaire réutilisable `.smn-cockpit-form-actions`, séparation discrète selon le thème, action secondaire à gauche et primaire à droite, mise en page responsive.
- `src/app/app/admin/members/member-absence-editor.tsx`, `assignment-editor.tsx`, `[id]/member-identity-editor.tsx` : les actions internes adoptent cette classe sans changer les callbacks, les contraintes `disabled` ni l'ordre DOM.
- Les autres éditeurs, en particulier les calendriers avec champs intégrés au pied, restent à traiter individuellement pour préserver leur disposition et leur comportement.
- Aucun test ni build exécuté. À vérifier sur PC : FR/EN, thèmes, lisibilité mobile et états de sauvegarde/erreur.

## Extension — calendriers individuels
- `src/app/app/admin/members/member-calendar-editor.tsx` : date d'effet placée dans une grille Bootstrap responsive, actions déplacées visuellement sous cette zone, utilisation de `.smn-cockpit-form-actions` sans changement de validation ou d'envoi.
- `src/app/app/admin/members/member-calendar-exception-editor.tsx` : mêmes conventions pour les actions de sauvegarde et annulation, sans toucher aux cases matin/après-midi.
- Le formulaire de cycle de vie conserve sa présentation particulière car il rassemble des actions destructives, de clôture et de réactivation : une assimilation au pied standard serait dangereuse sans analyse UX approfondie.
- Lecture statique du JSX après modification ; aucun typecheck, test, build ni recette navigateur exécuté. La Story reste en cours.

## Étape événements Agile — lisibilité de la modale de réunion
- Audit ciblé : `calendar-meeting-modal.tsx` est une véritable fenêtre modale ; `exceptional-meeting-form.tsx`, `ceremony-editor.tsx` et `template-form.tsx` sont des panneaux/formulaires de page, pas des modales. Ils ne doivent pas être convertis sans validation fonctionnelle.
- La modale de réunion sépare à présent formellement bandeau, corps déroulant et pied accessible ; `src/app/modal-cockpit.css` borne sa hauteur et garde les contrôles de fermeture visibles. Les sous-actions de sauvegarde propres aux sections sont conservées, car elles déclenchent des transactions distinctes.
- Aucun changement de calendrier, API, règles de présence ni stockage.
- Aucun test compilateur, navigateur ou GitHub Actions exécuté. Tests locaux nécessaires : chargement long, statut en lecture seule, fermeture avec données modifiées, tableaux de décisions et rendu mobile / clair / sombre.

## Étape Registres, Rapports et Paramètres — 27/10/2026
- Relecture des vrais conteneurs `registry-create-modal.tsx` et `registry-section-dialog.tsx` : native `<dialog>`, traduction existante, structure Cockpit raccordée dans les étapes précédentes.
- `src/app/modal-cockpit.css` : ajout de règles ciblées pour maintenir les en-têtes et pieds visibles tout en faisant défiler uniquement le corps des longues modales Registre, y compris sur mobile ; variables de thème existantes conservées.
- `report-studio.tsx`, `template-library.tsx` et `settings-form.tsx` examinés : aucune fenêtre modale directe dans ces fichiers ; leurs formulaires de page ne sont pas transformés. Il reste à rechercher les modales indirectes dans les composants enfants et autres modules.
- Pas de modification des règles métier, appels API, sauvegardes ou des contrats de modèle.
- Aucun typecheck, build ni test navigateur lancé. À vérifier sur PC : top layer dialog, focus, masquage de l'arrière-plan, large contenu, validation, annulation, modes clair/sombre et palette.

## Étape internationalisation des modales membres
- `member-identity-editor.tsx` : suppression des textes français en dur (aucun pays, pays hors catalogue, catalogue indisponible, aucun fuseau, fuseau existant), avec nouvelles clés `memberUX.*` en FR/EN. Les pays du catalogue s'affichent par nom sans suffixe ISO2 ; les codes restent les valeurs du `select` envoyées au serveur. Pour un ancien pays absent du catalogue, l'identifiant demeure visible uniquement pour identifier une donnée héritée.
- `src/i18n/fr.json` et `src/i18n/en.json` enrichis avec six libellés chacun.
- Audit ciblé de `assignment-editor.tsx` : plusieurs chaînes françaises codées en dur demeurent dans la correction d'affectation historique ; elles nécessitent une étape de traduction spécifique.
- Ne pas déduire de cet audit partiel une conformité FR/EN de toutes les fenêtres.
- Aucun contrôle `pnpm i18n:check`, lint, TypeScript ou navigateur exécuté. Recette sur PC utilisateur.

## Étape suivante — correction historique d'affectation FR/EN
- `assignment-editor.tsx` : titre, aide, champ de date, bouton et confirmation de correction historique remplacés par des clés i18n FR/EN. La date actuelle et la date proposée restent interpolées dans la confirmation.
- `src/i18n/fr.json` et `src/i18n/en.json` : ajout de six clés `members.assignment.historical*` avec les mêmes paramètres.
- Les conditions d'accès, validations, contrats de sauvegarde, API et avertissements de capacité historique sont inchangés.
- Le chemin d'erreur serveur peut encore exposer un code technique via `body.error` : à traiter lors du balayage des erreurs localisées.
- Vérification textuelle statique des substitutions uniquement. `pnpm i18n:check`, lint, typecheck, tests et build non exécutés ; recette sur le PC utilisateur.

## Étape — ne pas exposer les erreurs API aux utilisateurs
- `assignment-editor.tsx` : lors de la correction d'une date d'affectation, une erreur serveur affichait directement `body.error` ; la fenêtre affiche désormais le message localisé `members.assignment.historicalFailure` sans divulguer un code technique.
- `member-identity-editor.tsx` : suppression du suffixe technique `identity-400`, `identity-409` ou similaire ajouté à l'erreur affichée ; le message métier `memberUX.identitySaveFailed` reste affiché.
- Aucune modification des requêtes, valeurs métiers ou règles serveur. Les détails d'erreur techniques ne sont plus exposés dans ces deux chemins de formulaire ; un audit du reste des fenêtres est encore nécessaire.
- Pas de tests ou builds exécutés ; vérification sur PC utilisateur indispensable.

## Étape d'audit complémentaire — inventaire croisé
- Arborescence GitHub examinée : 232 fichiers TSX sous `src/app/` recensés via l'arbre Git, sans analyse ligne à ligne exhaustive.
- Vérification du contenu de `operational-overview.tsx`, `cycle-overview.tsx`, `quick-members-admin.tsx`, `sprint-generation-wizard.tsx`, `registry-detail.tsx`, `report-studio.tsx`, `settings/teams/teams-settings.tsx`, `ai-briefs/templates/template-editor.tsx` et `member-location-editor.tsx` : aucun conteneur modal explicite repéré avec les signatures `<dialog>`, `role="dialog"`, `modal-backdrop`, `modal-content` ou `showModal(`. Ce contrôle statique ne garantit pas l'absence de rendu via composants enfants.
- `src/app/modal-cockpit.css` : bouton fermer renforcé (opacité, bordure, taille, focus-visible) pour ne pas perdre sa visibilité selon les thèmes.
- Restent : recherche de toutes les occurrences modales dans l'ensemble des 232 fichiers, contrôle rendu/contraste, compatibilité des sélecteurs CSS existants, cas d'erreur localisés, recette locale par l'utilisateur.
- Pas de compilation, test, action GitHub ni recette exécutés.

## Étape — recette et scroll des modales Membres
- `src/app/modal-cockpit.css` : ajout de styles ciblés à l'enveloppe de la fiche membre pour faire défiler le corps tout en conservant l'en-tête visible, sans modifier les sous-formulaires.
- `_bmad-output/implementation-artifacts/smn-298-recette-modales-pc.md` : grille de recette transversale à exécuter uniquement sur le PC du commanditaire, couvrant les cas représentatifs FR/EN, thèmes, responsive, accessibilité, sécurité fonctionnelle et les commandes locales.
- Cette étape ne clôt pas AC01 (inventaire exhaustif), ni les tests ; aucun navigateur, compilateur ou pipeline GitHub n'a été exécuté.

## Étape conflits CSS hérités — 27/10/2026
- Inspection de `globals.css` et `modal-cockpit.css` : les pieds de modales Registre utilisaient historiquement `justify-content:flex-end`, tandis que la classe partagée `.smn-cockpit-modal-footer` imposait `space-between`, susceptible de séparer Annuler et Enregistrer.
- Correction CSS ciblée dans `modal-cockpit.css` : les pieds des dialogues de création et de section Registre conservent leurs actions groupées à droite, sans changer les boutons, leur ordre ni leur callback.
- Restent à vérifier au navigateur : conflits spécifiques du calendrier, contraste en-têtes selon palettes, focus Échap/Tab, scroll et contenu long sur mobile.
- Contrôle réalisé par lecture statique du dépôt ; aucune validation navigateur ni compilation effectuée.

## Étape CSS Calendrier — 27/10/2026
- Conflit confirmé par lecture statique : `globals.css` appliquait `padding:16px!important` aux modales de réunion sur mobile, incompatible avec le bandeau pleine largeur du Cockpit. Règle ciblée ajoutée dans `modal-cockpit.css` pour réinitialiser le padding uniquement sur les modales Calendrier raccordées au nouveau style.
- Ajustement de la visibilité du focus clavier du bouton fermer avec bordure/anneau basés sur les couleurs du thème.
- Aucune modification de la logique de réunion, de la validation, des API ou de la gestion de focus JS.
- Restent : essai des palettes (contraste réel non mesuré), mobile 320–450px, champs longs et sauvegarde ; tests uniquement sur PC utilisateur.
