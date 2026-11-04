# SMN — Dashboard Builder — Référence graphique de restitution validée

**Validation :** 4 novembre 2026, par le commanditaire, lors de l'atelier UX avec Sally (BMAD UX Designer).
**Statut :** direction graphique validée ; référence de conception, non preuve de conformité des écrans.
**Périmètre :** restitution en consultation et langage visuel du Dashboard Builder Scrum/Kanban.

## Planche de référence

![Planche des six modèles du Dashboard Builder](./dashboard-builder-reference.svg)

[Ouvrir la planche vectorielle](./dashboard-builder-reference.svg)

**Traçabilité visuelle :** la maquette PNG originale générée et approuvée dans la conversation du 04/11/2026 est la source de la décision. Le fichier SVG versionné est une **reconstitution vectorielle schématique**, pas une copie pixel à pixel du PNG. Les données montrées sont fictives et uniquement illustratives. Ne pas annoncer que le PNG d'origine est archivé dans GitHub.

## Direction validée

- Identité « Cockpit Agile » : fond clair légèrement bleuté, navigation bleu nuit, bandeaux de titre bleu foncé, cartes blanches, contours fins, coins arrondis et ombres discrètes.
- Respect de Bootstrap, des thèmes et des composants existants de SMN ; aucune couleur figée ne doit casser les variantes de thème.
- Hiérarchie lisible : libellé métier, valeur dominante, unité, tendance ou état, densité maîtrisée ; alignements et rythmes constants.
- En-tête de sprint : nom visible, dates, statut, navigation discrète précédent/suivant, deux zones dynamiques, Actions et Actualiser intégrés.
- Les noms et codes **M01–M06 sont des annotations pédagogiques de la planche**, et ne doivent pas apparaître comme bandeaux techniques en consultation. En production, afficher le titre métier personnalisable du bloc et de chaque emplacement.
- Conserver la capacité de construction de plusieurs lignes et blocs par équipe ; masquer les emplacements non configurés sans laisser de trous visuels inutiles.
- Mode consultation = cockpit opérationnel, sans commandes de composition ; mode personnalisation = édition explicite des modèles, titres, sources, visualisations et dimensions.
- Libellés FR compréhensibles, accessibilité clavier et contraste ; responsive desktop/tablette/mobile ; aucune donnée fictive dans l'application.

## Six modèles — intention de présentation

| Modèle | Géométrie cible | Exemple illustratif |
| --- | --- | --- |
| M01 Simple | 1 zone principale | avancement + barre de progression |
| M02 Duo | 2 zones égales | capacité / vélocité |
| M03 Trio | 3 zones équilibrées | US terminées / bugs / qualité |
| M04 Quatuor | 4 zones | membres / cérémonies / obstacles / risques |
| M05 Asymétrique | grande zone + petite zone | Burndown / obstacles |
| M06 Composé | zone majeure + deux zones secondaires | risques / dépendances / notes |

**Attention :** ces six blocs sont rassemblés sur une seule page pour démontrer les modèles et non imposer cette disposition simultanée à tous les dashboards. Les modèles doivent conserver leur géométrie contractuelle versionnée (notamment M04 et M06), même si la planche simplifie les proportions.

## Contrats de restitution

1. **Indicateurs numériques :** valeur prioritaire, unité distincte, titre du KPI, précision conforme au moteur et tendance seulement si calculée à partir d'une source valide.
2. **Jauges :** ratio cohérent avec bornes et unité réelles, borne invalide explicitement signalée ; ne jamais simuler une progression.
3. **Courbes / histogrammes / Burndown :** axe du temps lisible, graduations et libellés utiles, différences entre séries compréhensibles, affichage des absences de données.
4. **Listes métiers :** style de lignes ou cartes adapté au contenu (risques, obstacles, cérémonies, membres, dépendances, liens, notes), badge de statut pertinent, accès à la fiche, action « + Ajouter » en bas de liste lorsque le droit et l'état du sprint le permettent.
5. **Données et état :** cycle sélectionné partagé avec l'en-tête et les blocs sauf exception explicite, gestion chargement/erreur/vide/obsolescence, rafraîchissement manuel et automatique selon cadrage.
6. **Présentation :** titres de bloc et d'emplacement configurables, pas d'UUID ni de codes techniques visibles, espacements et hauteurs harmonisés ; les positions vides ne produisent pas de trous.
7. **Droits et historique :** permissions serveur conservées, lecture autorisée en consultation, respect des snapshots de sprint clos et des règles métier v33 ; aucun calcul KPI réinventé dans les composants graphiques.
8. **Conformité :** vérifier au minimum ordinateur, tablette, mobile, tailles S/M/L, M01–M06, valeurs longues, titres longs, données absentes, droits en lecture seule et période historique.

## Écarts connus à traiter (audit statique du 04/11/2026)

- Les nombres sont rendus par un simple `<output>` ; l'habillage KPI n'a pas encore la hiérarchie de la maquette.
- Les SVG de courbes et barres sont rudimentaires et nécessitent un travail sur axes, labels et lisibilité.
- Le chemin actuel de la consultation ne transmet pas systématiquement le `ratio` requis par une jauge.
- Les listes métiers sont uniformisées en tableaux génériques.
- Les emplacements filtrés peuvent laisser des trous selon la géométrie de grille.
- Le configurateur expose encore des intitulés de visualisations techniques et son aperçu est principalement textuel.

Ces constats ne remplacent pas une recette visuelle dans le navigateur ni les tests fonctionnels.

## Hiérarchie documentaire

Cette décision est **la référence esthétique prioritaire de la restitution Dashboard Builder à compter du 04/11/2026**, en complément des arbitrages D-DB, A-DB, UX-DB et MAQ-DB préexistants. Elle ne remplace pas leurs contrats métier, de droits, de sécurité, de stockage ou d'accessibilité. En cas de conflit réel avec une règle fonctionnelle, demander un arbitrage explicite avant implémentation.

**Publication :** documentation UX uniquement. Aucune modification de l'application, de Jira, ni exécution de tests ou de scripts.
