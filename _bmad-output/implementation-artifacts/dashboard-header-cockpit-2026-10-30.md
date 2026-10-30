# SMN-235 — En-tête du tableau de bord en style Cockpit Agile

Date : 30 octobre 2026. Décision UX : harmonisation fidèle avec le bandeau de la fiche membre.

## Objectif
Conserver la projection réelle du Sprint, les dates, son état, les objectifs et l'action existante tout en adoptant un grand bandeau bleu foncé pleine largeur.

## Critères d'acceptation
- AC-UX-01 : bandeau dégradé bleu foncé, coins arrondis, texte blanc et hiérarchie « Équipe : ... » puis « Sprint ... ».
- AC-UX-02 : dates et statut visibles en pastilles et issues du Sprint sélectionné ; le statut tient compte des états réellement calculés.
- AC-UX-03 : objectifs issus de la projection existante, dans une zone séparée mais dans le bandeau ; les états « absent » ne deviennent pas des données fictives.
- AC-UX-04 : lien « Voir le détail du sprint » à droite, bordé de blanc, navigation et focus clavier conservés.
- AC-UX-05 : responsive, sans changer le contenu des KPI, la sélection du contexte, les autorisations ou les règles métier.

## Périmètre d'implémentation
- `src/app/app/cycle-overview.tsx` : structure du bandeau.
- `src/app/dashboard.css` : styles circonscrits à l'en-tête `smn-cycle-overview-header`.
- `tests/dashboard-header-cockpit.test.ts` : contrats de présentation et d'accès.

## Vérifications
Contrôler localement `pnpm typecheck`, `pnpm lint` et les tests dédiés. Effectuer une recette desktop/mobile avec ou sans Sprint, objectif vide ou renseigné, dates et états différents. Aucun test local n'est déclaré passé avant exécution sur l'environnement de l'utilisateur.
