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
