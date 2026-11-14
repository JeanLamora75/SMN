# RECETTE-UX.md — Centre d'aide SMN et modale Cockpit Agile

**Sally — 14/11/2026. Tous les contrôles : NON EXÉCUTÉS.** Ce document fixe les résultats attendus ; l'évaluation navigateur, les captures, les tests de persistence et de sécurité seront réalisés après implémentation.

| ID | Contrôle attendu | État |
|---|---|---|
| HELP-01 | Menu Aide visible dans sidebar étendue et repliée, immédiatement au-dessus de Paramètres lorsqu'il existe | Non testé |
| HELP-02 | Aide consultable par comptes autorisés sans créer de permission d'administration | Non testé |
| HELP-03 | Centre d'aide pleine largeur et quatre familles distinctes, styles Cockpit Agile existants | Non testé |
| HELP-04 | Recherche FR/EN, insensible aux accents et casse, résultats pertinents et aucun résultat réinitialisable | Non testé |
| HELP-05 | Guides par module et liens « Ouvrir l'écran » résolus vers routes réellement présentes et autorisées | Non testé |
| HELP-06 | Bouton « Aide » sur écrans couverts, dans l'en-tête métier sans déplacer les actions existantes | Non testé |
| HELP-07 | Clic Aide ouvre une **modale Cockpit Agile** sur le bon article, pas un panneau latéral | Non testé |
| HELP-08 | Modale : role dialog, aria-modal/label, focus initial, Tab/Shift+Tab piégé, Escape/fermeture, restitution focus | Non testé |
| HELP-09 | Aucune superposition de deux modales, aucune perte silencieuse de brouillon ni de filtres | Non testé |
| HELP-10 | Un article documentaire unique alimente Centre d'aide et modale, par identifiant stable | Non testé |
| HELP-11 | Checklist : étapes compréhensibles, prérequis, lien métier et état À faire/En cours/Terminé déclaré | Non testé |
| HELP-12 | Changer de page ou lire une aide ne marque aucune étape terminée | Non testé |
| HELP-13 | Sauvegarde de progression confirmée avant succès affiché ; erreur conserve dernier état confirmé | Non testé |
| HELP-14 | Rechargement et reconnexion restaurent les états ; reprise et remise à zéro réversibles/protégées | Non testé |
| HELP-15 | Étapes non applicables Kanban / droits restreints signalées ; dénominateur exact et compréhensible | Non testé |
| HELP-16 | Lecture de l'aide n'effectue aucune écriture métier, migration, audit artificiel ou édition de paramètre | Non testé |
| HELP-17 | URLs directes, résultats de recherche et articles respectent la même politique d'autorisation | Non testé |
| HELP-18 | Erreurs d'article/serveur et langue manquante sont explicites, sans contenu fictif | Non testé |
| HELP-19 | FR/EN, clair/sombre, palettes, sidebar fermée, 200% zoom, mobile portrait et tablette sans overflow forcé | Non testé |
| HELP-20 | L'aide fonctionne hors Internet à partir de la documentation installée, sans fournisseur externe requis | Non testé |

## Preuves attendues

- Captures Centre d'aide desktop/mobile et modale d'un écran Paramètres, dans les thèmes disponibles.
- Tests navigateur réels de navigation, focus, Escape, rechargement, filtres et modales superposées.
- Contrôle de permissions avec compte administrateur, compte utilisateur et équipes Scrum/Kanban.
- Tests de lecture seule de l'aide et de persistance de checklist (erreur réseau / conflit / multi-session).
- Tests de validité des liens article/route et de couverture des écrans, FR/EN.
- Vérification que les contenus de Camille décrivent des fonctionnalités réellement livrées.
- Commandes de qualité réellement exécutées à relever : typecheck, lint, tests ciblés, build / GitHub Actions selon moyens disponibles.

**Définition de terminé :** critères applicables vérifiés et preuves archivées. Une spécification UX publiée ou une maquette n'atteste aucune réalisation applicative.
