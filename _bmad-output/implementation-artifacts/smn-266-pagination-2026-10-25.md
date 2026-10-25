# SMN-266 — Pagination et débordements (incrément partiel)

## Livré
- Feuille de styles dédiée au Studio pour impression : césure douce, veuves/orphelines, conservation des blocs visuels, entêtes de tableaux sur chaque page lorsque le moteur d'impression le prend en charge.
- Format A4 portrait/paysage à l'échelle du document entier, marges définies pour l'impression navigateur.
- Saut de page manuel configurable par rubrique, conservé dans `content.pageBreaks`.
- Avertissement sur les tableaux larges sans masquage automatique de colonnes.
- Traductions FR/EN.

## Écarts Jira
- AC1 : règles CSS ajoutées ; qualité des coupures non validée en PDF.
- AC2 : CSS `thead` et `tr` ; comportement multipage non vérifié.
- AC3 : `break-inside:avoid-page` des blocs ; gros blocs dépassant une page nécessitent une stratégie supplémentaire.
- AC4 : avertissement générique, sans détection de largeur ni propositions interactives de colonnes/annexes.
- AC5 : saut de page par rubrique et orientation A4 ; aperçu paginé réel non disponible.

## Contrôles en attente
- Pas de génération PDF de test ni de mesure automatique de pagination ; tests, typecheck et build non exécutés.
- Le nouvel aperçu n'est pas encore raccordé au moteur PDF historique ; ne pas déclarer les critères pleinement satisfaits.
- Risque autosave/refresh de SMN-264 toujours ouvert.
- PRs précédentes non fusionnées ; ne pas clôturer Jira.
