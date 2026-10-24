# SMN-234 D4 — Retouche UX des Cérémonies, édition en modale

**Date :** 24 octobre 2026 — référent visuel : capture « Sprint 2, onglet Cérémonies » fournie par l'utilisateur.

## Objectif
Compacter les lignes de Cérémonies de la fiche Sprint, aligner le nom, les dates, la durée prévue et la durée réellement enregistrée sur une même rangée desktop, simplifier le libellé des dates et remplacer le bouton « Voir la réunion » par un crayon ouvrant une modale d'édition complète des principaux attributs enregistrés.

## Réalisation
- `src/app/app/admin/sprints/[sprintId]/sprint-ceremonies-panel.tsx` : grille d'une ligne (titre/statut, plage de dates, durées, crayon), icônes Bootstrap par type, colonne de logo coloré sur la hauteur utile, comportement lecture seule pour les snapshots et les droits non administrateurs, pagination et état de source inchangés.
- `src/app/dashboard.css` : densification (hauteurs naturelles et paddings réduits), grilles 5/4/3 colonnes selon la largeur, priorité au lisible sur tablette/mobile.
- `src/lib/dashboard-card-format.ts` : réemploi de `formatDashboardEventPeriod` et `dashboardEventIcon` pour assurer cohérence entre le dashboard et la fiche Sprint ; période « Lun. 26 oct. : 09:30 — 11:30 » en Europe/Paris et deux dates sur des jours différents.
- `src/app/app/operational-edit.tsx` : icône crayon disponible en déclencheur au lieu du titre, alternative textuelle accessible, champ « Durée réelle enregistrée » nullable dans la modale existante ; fermeture et rafraîchissement uniquement après retour positif.
- `src/server/dashboard/event-edit.ts` : lecture du champ `actual_minutes` seulement s'il est présent dans le schéma ; PATCH atomique sur calendrier/statut/durée prévue/durée réelle, conflit optimiste incluant la durée réelle, audit indépendant de la durée réelle et audit général d'édition. La structure est ajoutée par `ensureActualDurationSchema` uniquement au chemin d'écriture. Effacer la durée réelle laisse une trace dans l'audit général, la table historique spécialisée n'autorisant pas de valeur NULL.
- `src/app/app/admin/sprints/[sprintId]/page.tsx` : transmission de l'équipe et des droits réellement autorisés ; aucun bouton pour un Sprint clôturé.
- `src/i18n/fr.json`, `src/i18n/en.json` : libellé du crayon d'édition.

## Contrats conservés
- Trois sources officielles `standard`, `custom`, `exceptional` sans mutation des modèles, avec titre immuable pour les anciennes cérémonies standard ;
- autorisations write existantes, validation serveur du Sprint de rattachement et des bornes temporelles ; contrôles de conflits et historisation ;
- `held`, `not_held`, `cancelled`, `scheduled` avec badges et alertes de reconstitution ou inférence ;
- lecture de clôture strictement depuis son snapshot ; pagination sur 25 événements ; aucun participant ou lieu inventé.

## Tests ajoutés (non exécutés dans le connecteur)
`tests/smn-234-sprint-ceremonies-compact-modal.test.ts` : date et fuseau FR/EN, icônes par nature, largeur des lignes, permissions/snapshot, modal avec durée réelle, lecture SQL sans mutation, transaction unique, audit de durée réelle et conflit concurrent.

### Recette Windows / PowerShell
```powershell
git switch main
git pull origin main
pnpm typecheck
pnpm exec tsx --test tests/smn-234-sprint-ceremonies-compact-modal.test.ts tests/smn-234-sprint-ceremonies-d4.test.ts tests/dashboard-operational-edit-modals-20261024.test.ts
pnpm build
pnpm dev
```
Ouvrir une fiche Sprint → Cérémonies. Tester les modèles nommés Planning, Daily, Review, Rétrospective, Affinage, ainsi qu'une réunion exceptionnelle ; vérifier l'icône sur toute la hauteur, le format de date, le statut, les trois autres informations alignées, le crayon, la persistance après sauvegarde, FR/EN, responsive à 320 px, dates entre deux journées et changement d'heure, utilisateur en lecture seule et snapshot historique.

**Limite de vérification :** modification avec le connecteur GitHub ; aucun `pnpm typecheck`, tests TSX, build Next.js, intégration PostgreSQL ou rendu navigateur n'a été exécuté dans cette session. GitHub Actions est désactivé, et le moteur BMAD local `uv run` n'a pas pu être exécuté faute de checkout local accessible.
La validation de SMN-234 demeure ouverte jusqu'à la recette de l'utilisateur.
