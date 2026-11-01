# SMN-348 — Saisie universelle des indicateurs Sprint / Kanban

## Contrat implémenté
La même modale Cockpit Agile est utilisée pour saisir des indicateurs manuels dans un sprint Scrum ou une période Kanban, quels que soient leurs statuts, sous réserve d'une équipe active et d'une habilitation SMN-347.

- Les indicateurs manuels actifs sélectionnés sont éditables ; les valeurs calculées restent en lecture seule.
- La prévisualisation est déclenchée automatiquement après les modifications (temporisation de 300 ms), sans INSERT/UPDATE/COMMIT. Les indisponibilités de calcul sont affichées et localisées.
- L'annulation ferme la modale et vide le brouillon sans aucune écriture.
- L'enregistrement soumet toutes les valeurs ensemble ; le service SMN-343 utilise une transaction PostgreSQL unique et recalcule les dépendances dans cette transaction.
- Une révision du cycle ou de la définition globale périmée provoque un conflit 409. Un nouveau calcul d'aperçu est nécessaire avant de retenter.
- Le contrôle d'autorisation est résolu en base pendant la transaction ; le teamId fourni par le navigateur ne constitue jamais une permission.
- Les snapshots de clôture Scrum/Kanban, de capacité et les tables d'historique métiers sont distincts ; la saisie manipule seulement les valeurs et résultats d'indicateurs v33.
- Les formules qui exigent une source calendrier non fournie à la transaction retournent une indisponibilité explicite ; aucune capacité historique n'est inférée ou inventée.

## Fichiers de production
- `src/server/indicators/input-preview.ts` : simulation du graphe sans écritures.
- `src/server/indicators/manual-values.ts` : contrôle optimiste complémentaire de la révision globale.
- `src/app/api/admin/indicators/input/route.ts` : lecture, prévisualisation et sauvegarde avec session sécurisée et contrôle d'équipe.
- `src/app/app/admin/indicators/universal-input.tsx` : dialogue accessible, prévisualisation automatique, calculs non éditables et contrôle des brouillons.
- `src/app/app/admin/sprints/[sprintId]/page.tsx` : entrée depuis l'onglet indicateurs.
- `src/app/app/admin/kanban-periods/page.tsx` : entrée depuis les périodes autorisées.
- `src/i18n/fr.json`, `src/i18n/en.json` : libellés localisés et motifs d'indisponibilité.

## Recette
```powershell
pnpm db:diagnose
pnpm test:smn-348
pnpm db:test:smn-348
pnpm i18n:check
pnpm typecheck
pnpm lint
```

Le test PostgreSQL crée et détruit une base **jetable** ; il refuse les URLs non locales. Ne pas l'exécuter contre une base de données métier.

Parcours fonctionnel à vérifier sur le PC : ouvrir un sprint, renseigner deux indicateurs, constater l'aperçu, annuler sans modification, enregistrer et contrôler la révision ; répéter sur une période Kanban clôturée ; vérifier qu'un utilisateur sans droit ou ayant perdu son habilitation reçoit un refus, que les valeurs calculées ne peuvent être éditées et que les snapshots historiques restent inchangés.

## Statut des preuves
Les tests ciblés exécutés par GitHub Actions sont documentés dans la Pull Request. Aucune recette visuelle sur le PC de l'utilisateur n'est présumée. Les défaillances anciennes de la suite générale ne sont pas imputées à ce périmètre sans reproduction.
