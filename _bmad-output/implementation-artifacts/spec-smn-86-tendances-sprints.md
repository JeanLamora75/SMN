# SMN-86 — Tendances des cinq Sprints clôturés

Jira : https://lmn24.atlassian.net/browse/SMN-86

## Implémentation initiale
- Quatrième bloc Tendances du bilan, en lecture seule, sans bouton Enregistrer.
- Trois séries distinctes : Story Points terminés, taux de réalisation et capacité réelle en JH.
- Au plus cinq Sprints clôturés de la même équipe, ordonnés chronologiquement à l'affichage.
- Fenêtre temporelle bornée au début du Sprint de référence pour ne jamais inclure les Sprints ultérieurs ; le Sprint consulté n'entre que s'il est clôturé.
- Les métriques sans valeur persistée restent nulles et s'affichent « Donnée indisponible ». Absence de points éligibles affichée explicitement.
- Les tendances sont lues uniquement côté serveur depuis PostgreSQL, indépendamment des brouillons locaux des autres blocs.

## Réserves de conformité et de recette
- Les trois séries sont actuellement affichées comme tableaux chronologiques de valeurs, non comme graphiques courbes ; l'UX graphique complète reste à développer.
- La sélection du Sprint demeure indépendante des trois autres blocs du bilan (dette SMN-85).
- Vérifier en base que le statut closed correspond précisément aux états historiques clos et exclus après réouverture.
- Pour la capacité réelle, la requête exploite exclusivement les snapshots clôturés associés exactement aux bornes locales du Sprint. Les valeurs manuelles validées sans snapshot clôturé ne sont pas interprétées comme définitives.
- Vérifier les calculs du taux, les données manquantes, la fenêtre historique et le comportement des Sprints simultanés.
- Compilation TypeScript, validation Prisma et recette PostgreSQL non exécutées ; GitHub Actions indisponible.

État : implémentation partielle en PR brouillon, non fusionnée sur main.
