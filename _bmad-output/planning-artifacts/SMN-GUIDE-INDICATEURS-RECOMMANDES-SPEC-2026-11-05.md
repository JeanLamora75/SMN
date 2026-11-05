# SMN — Spécification BMAD : guide des indicateurs recommandés Scrum / Kanban

**Date :** 2026-11-05 · **Auteur fonctionnel :** John (Product Manager BMAD) · **Statut :** cadrage fonctionnel validé ; découpage Jira proposé, **non publié**.
**Projet :** Scrum Master Notebook · **Référentiel technique :** v33 · **Langue :** français.

## 1. Besoin, valeur et périmètre

**Problème :** le Scrum Master sait créer des indicateurs saisis et calculés dans Paramètres > Indicateurs et consulter un guide des expressions, mais ne dispose pas d'une bibliothèque métier qui lui recommande *quoi mesurer* et *comment configurer les dépendances*.

**Objectif :** ajouter un **troisième onglet « Indicateurs recommandés »**, complémentaire du Catalogue et du Guide des expressions, avec des exemples pédagogiques, vérifiés contre les fonctions du moteur v33, et sélectionnés par mode Scrum / Kanban de l'équipe.

**Cible :** utilisateur ayant actuellement accès à Paramètres > Indicateurs. Conserver les droits existants (page actuellement réservée à l'administrateur) ; aucun élargissement implicite aux Scrum Masters non administrateurs. Si une ouverture de cette rubrique aux Scrum Masters est souhaitée, elle exige une autre décision et une Story dédiée.

**Hors périmètre :** création automatique d'indicateurs, modification du moteur, nouvelle fonction, migration, nouvelles données obligatoires, intégration Jira, recalcul à l'affichage, changement de politique d'historique/clôture, modification des rapports existants.

## 2. Décisions de cadrage

- **REF-01 B :** deux bibliothèques distinctes, Scrum et Kanban, avec réutilisation des composants techniques.
- **REF-02 C :** distinguer réalisation globale (quantités) et respect des éléments initialement prévus. Ne pas inventer le second en l'absence de données.
- **REF-03 D :** les valeurs de référence sont les valeurs saisies ; pas de nouveau verrouillage ni snapshot de l'engagement. L'orientation de calcul à la consultation fait partie du cadrage général, mais **n'est pas à implémenter dans cette Story documentaire** : le moteur v33 conserve actuellement les résultats calculés et des snapshots de clôture.
- **Règle SP :** dans ce guide, ne pas proposer la réestimation de tickets pendant un sprint comme mécanisme de mesure.
- **REF-04 :** abandonnée pour ce périmètre ; aucune collecte nouvelle imposée.
- **REF-05 A :** regroupement par domaine, badge « Saisi » / « Calculé ».
- **REF-06 B :** fiches détaillées (description, intérêt, formule/tag, dépendances, unité, exemple chiffré, interprétation et limites).
- **REF-07 A :** uniquement des indicateurs paramétrables dans le moteur v33 courant. Une mesure telle que Cycle Time moyen est acceptable **en indicateur saisi** : SMN n'a pas à la calculer à partir des tickets.

## 3. Positionnement, navigation, droits et contexte

Page existante : `src/app/app/admin/settings/indicators/page.tsx`, composant onglets `settings-tabs.tsx`. Ajouter le troisième onglet après « Guide des expressions », sans modifier le Catalogue, le guide existant ni les habilitations.

- Le catalogue recommandé montré est **Scrum ou Kanban**, selon le mode réel de **l'équipe sélectionnée**, et non selon une supposition sur l'installation.
- Comme la page Paramètres > Indicateurs actuelle est globale et ne reçoit pas explicitement une équipe, **identifier et réutiliser la sélection d'équipe réellement disponible dans l'application**. Si aucune équipe n'est sélectionnée ou accessible, afficher un état explicite « Sélectionnez une équipe pour consulter ses recommandations » ; ne pas inventer un mode par défaut.
- La bibliothèque est **statique, versionnée dans le code** (données métier TypeScript/JSON) ; aucune nouvelle table ni migration.
- Lecture de la bibliothèque sans mutation du catalogue. Le bouton « Copier » ne crée rien. Il doit copier exactement une formule/valeur d'exemple, avec signal de succès/échec accessible.
- Respecter thème Bootstrap/Cockpit Agile, responsive, clavier, lecteurs d'écran et francisation ; afficher le type, la catégorie et les dépendances avant l'expression.
- Recherche par intitulé, description et tags, filtre par domaine et par type. État vide explicite. Ne pas afficher des identifiants techniques internes.
- Les tags recommandés sont des **exemples de convention**, pas une garantie d'existence dans le catalogue courant ; le signaler avant toute copie.

## 4. Format normatif des fiches

Chaque fiche comprend : `id`, `mode`, `domain`, `name`, `type` (manual/computed), `purpose`, `definition`, `suggestedTag`, `formula` (uniquement computed), `prerequisites` (tags conseillés et leur type), `unit`, `exampleInputs`, `exampleResult`, `interpretation`, `caveats`, `displaySuggestions`. Ne pas afficher une expression pour un indicateur saisi : montrer **« À saisir / à importer manuellement »** et un tag suggéré.

Les formules sont illustratives et directement syntaxiquement compatibles avec le parseur v33, **sous réserve de création des tags référencés**. Le catalogue ne garantit ni les valeurs sources ni la sémantique d'un indicateur configuré par l'utilisateur.

**Conventions :** `TICKETS_INITIAL` = tickets initialement prévus ; `TICKETS_DONE` = tickets terminés sur la période ; `SP_INITIAL`, `SP_DONE`, `SP_ADDED`, `SP_REMOVED` ; `SP_RATE` = indicateur calculé de réalisation ; `WIP_CURRENT`, `TICKETS_BLOCKED`, `CYCLE_TIME_AVG`, `LEAD_TIME_AVG` = valeurs saisies Kanban. Ces tags ne sont **pas déclarés comme déjà existants en base**.

### 4.1 Catalogue Scrum — 24 fiches

| ID | Domaine | Indicateur | Type | Tag conseillé ou expression v33 |
|---|---|---|---|---|
| SCR-01 | Engagement | Tickets initialement prévus | Saisi | `TICKETS_INITIAL` |
| SCR-02 | Engagement | Story Points initialement prévus | Saisi | `SP_INITIAL` |
| SCR-03 | Réalisation | Tickets terminés | Saisi | `TICKETS_DONE` |
| SCR-04 | Réalisation | Story Points terminés | Saisi | `SP_DONE` |
| SCR-05 | Réalisation | Taux de réalisation des tickets | Calculé | `TICKETS_DONE / TICKETS_INITIAL * 100` |
| SCR-06 | Réalisation | Taux de réalisation des SP | Calculé | `SP_DONE / SP_INITIAL * 100` |
| SCR-07 | Réalisation | Écart de tickets | Calculé | `TICKETS_DONE - TICKETS_INITIAL` |
| SCR-08 | Réalisation | Écart de SP | Calculé | `SP_DONE - SP_INITIAL` |
| SCR-09 | Périmètre | SP ajoutés pendant le sprint | Saisi | `SP_ADDED` |
| SCR-10 | Périmètre | SP retirés pendant le sprint | Saisi | `SP_REMOVED` |
| SCR-11 | Périmètre | Variation nette du périmètre en SP (%) | Calculé | `(SP_ADDED - SP_REMOVED) / SP_INITIAL * 100` |
| SCR-12 | Capacité | Capacité maximale des développeurs | Calculé | `ROLE_MAX_JH("DEVELOPER")` |
| SCR-13 | Capacité | Capacité planifiée des développeurs | Calculé | `ROLE_JH_PLANNED("DEVELOPER")` |
| SCR-14 | Capacité | Capacité réelle des développeurs | Calculé | `ROLE_JH("DEVELOPER")` |
| SCR-15 | Capacité | Taux de disponibilité des développeurs | Calculé | `ROLE_JH("DEVELOPER") / ROLE_MAX_JH("DEVELOPER") * 100` |
| SCR-16 | Capacité | Écart réel / planifié développeurs | Calculé | `ROLE_JH("DEVELOPER") - ROLE_JH_PLANNED("DEVELOPER")` |
| SCR-17 | Tendances | Vélocité moyenne sur 5 sprints | Calculé | `AVG_LAST(SP_DONE, 5)` |
| SCR-18 | Tendances | Débit moyen sur 5 sprints | Calculé | `AVG_LAST(TICKETS_DONE, 5)` |
| SCR-19 | Tendances | Variation de vélocité | Calculé | `DELTA(SP_DONE, 1)` |
| SCR-20 | Tendances | Variation relative de vélocité (%) | Calculé | `DELTA_PCT(SP_DONE, 1)` |
| SCR-21 | Tendances | Vélocité minimale sur 5 sprints | Calculé | `MIN_LAST(SP_DONE, 5)` |
| SCR-22 | Tendances | Vélocité maximale sur 5 sprints | Calculé | `MAX_LAST(SP_DONE, 5)` |
| SCR-23 | Tendances | Amplitude de vélocité sur 5 sprints | Calculé | `MAX_LAST(SP_DONE, 5) - MIN_LAST(SP_DONE, 5)` |
| SCR-24 | Tendances | Évolution du taux de réalisation (points de %) | Calculé | `DELTA(SP_RATE, 1)` |

**Variante optionnelle dans la fiche SCR-12 à SCR-16 :** rôle `SCRUM_MASTER` ou `PRODUCT_OWNER` au lieu de `DEVELOPER`, si la règle métier le nécessite ; ne pas ajouter implicitement trois nouvelles séries d'indicateurs. **SCR-24** exige un indicateur calculé de tag `SP_RATE` construit sur SCR-06 ; `DELTA` mesure ici des points de pourcentage et non un pourcentage de croissance.

**REF-02 :** le taux de **respect réel des tickets initialement engagés** n'est pas inclus dans ce socle car `TICKETS_DONE / TICKETS_INITIAL` ne permet pas de reconnaître quels tickets appartenaient au périmètre initial. Il peut figurer seulement si l'utilisateur choisit de créer une donnée complémentaire saisie (ex. `TICKETS_INITIAL_DONE`) ; la bibliothèque de référence n'en dépend pas. Dans la fiche SCR-05 et SCR-06, afficher cet avertissement clairement.

### 4.2 Catalogue Kanban — 17 fiches

| ID | Domaine | Indicateur | Type | Tag conseillé ou expression v33 |
|---|---|---|---|---|
| KAN-01 | Débit | Tickets terminés sur la période | Saisi | `TICKETS_DONE` |
| KAN-02 | Débit | Débit moyen sur 5 périodes | Calculé | `AVG_LAST(TICKETS_DONE, 5)` |
| KAN-03 | Débit | Évolution du débit | Calculé | `DELTA(TICKETS_DONE, 1)` |
| KAN-04 | Débit | Variation relative du débit (%) | Calculé | `DELTA_PCT(TICKETS_DONE, 1)` |
| KAN-05 | Débit | Débit minimal sur 5 périodes | Calculé | `MIN_LAST(TICKETS_DONE, 5)` |
| KAN-06 | Débit | Débit maximal sur 5 périodes | Calculé | `MAX_LAST(TICKETS_DONE, 5)` |
| KAN-07 | Débit | Amplitude du débit sur 5 périodes | Calculé | `MAX_LAST(TICKETS_DONE, 5) - MIN_LAST(TICKETS_DONE, 5)` |
| KAN-08 | Flux | Travail en cours (WIP) | Saisi | `WIP_CURRENT` |
| KAN-09 | Flux | Tickets bloqués | Saisi | `TICKETS_BLOCKED` |
| KAN-10 | Flux | Part du WIP actuellement bloqué (%) | Calculé | `TICKETS_BLOCKED / WIP_CURRENT * 100` |
| KAN-11 | Flux | Cycle Time moyen | Saisi | `CYCLE_TIME_AVG` |
| KAN-12 | Flux | Lead Time moyen | Saisi | `LEAD_TIME_AVG` |
| KAN-13 | Capacité | Capacité maximale développeurs | Calculé | `ROLE_MAX_JH("DEVELOPER")` |
| KAN-14 | Capacité | Capacité planifiée développeurs | Calculé | `ROLE_JH_PLANNED("DEVELOPER")` |
| KAN-15 | Capacité | Capacité réelle développeurs | Calculé | `ROLE_JH("DEVELOPER")` |
| KAN-16 | Capacité | Taux de disponibilité développeurs | Calculé | `ROLE_JH("DEVELOPER") / ROLE_MAX_JH("DEVELOPER") * 100` |
| KAN-17 | Capacité | Écart réel / planifié développeurs | Calculé | `ROLE_JH("DEVELOPER") - ROLE_JH_PLANNED("DEVELOPER")` |

**Kanban :** `CYCLE_TIME_AVG` et `LEAD_TIME_AVG` sont des **valeurs saisies** calculées/obtenues hors SMN si nécessaire ; ne pas prétendre extraire les dates de tickets ou calculer des percentiles. Définir dans les fiches les frontières de début/fin retenues, la période d'observation et l'unité de temps. `TICKETS_BLOCKED` doit représenter un sous-ensemble du WIP au **même instant** ; ne pas diviser un nombre d'incidents sur la période par le WIP instantané. Pour les périodes de longueurs différentes, les comparaisons de débit sont à interpréter avec prudence.

## 5. Critères de qualité documentaire et calculs

1. Tous les exemples d'expressions calculées utilisent **seulement** `+`, `-`, `*`, `/`, `MIN`, `MAX`, `ROUND`, `AVG_LAST`, `MIN_LAST`, `MAX_LAST`, `DELTA`, `DELTA_PCT` et `ROLE_*` disponibles dans le parseur existant.
2. Chaque fiche donne des prérequis ordonnés, un exemple **arithmétiquement exact**, les unités cohérentes, une limite/condition de calcul et une représentation conseillée.
3. Les fonctions `AVG_LAST`, `MIN_LAST`, `MAX_LAST` incluent le cycle sélectionné ; fenêtre de 5 = exemple ajustable ; la valeur peut être indisponible si les sources manquent.
4. Division par zéro : **indisponible**, jamais 0% arbitraire ; base nulle pour `DELTA_PCT` : indisponible.
5. Taux de réalisation supérieur à 100 % : possible, ne pas le plafonner ni l'assimiler à la conformité de l'engagement.
6. `SP_INITIAL` = valeur saisie, modifiable selon permissions et cycle ; aucun nouveau mécanisme de gel.
7. Capacité `ROLE_*` en J/H disponible pour les rôles éligibles, sur périodes Scrum et Kanban ; ne pas confondre J/H disponibles avec effort consommé.
8. Les formules sont des **références à copier**, pas des commandes exécutées sur l'équipe ni des mises à jour du catalogue.
9. Les noms de tags doivent respecter les conventions syntaxiques v33 ; les prérequis doivent mentionner les tags créés au préalable ; aucun tag par défaut n'est créé.

## 6. Critères d'acceptation du besoin global

- **AC-01 :** le troisième onglet est disponible sur la page existante, dans le respect des autorisations et du thème.
- **AC-02 :** pour une équipe Scrum sélectionnée, seul le guide Scrum apparaît ; pour Kanban, seul le guide Kanban.
- **AC-03 :** si le contexte d'équipe est absent, l'écran explique comment en choisir une, sans mode implicite et sans fuite inter-équipes.
- **AC-04 :** listes conformes aux 24/17 définitions, avec domaine, badge Saisi/Calculé, filtre texte/domaine/type.
- **AC-05 :** chaque fiche est pédagogique, contient les dépendances, une formule valable ou un tag saisi, exemple, unité, précautions et suggestion d'affichage.
- **AC-06 :** copier une formule copie les caractères exacts de l'expression ; avertissement clair sur les tags fictifs.
- **AC-07 :** aucune écriture SQL, création d'indicateur, nouvel endpoint métier ni permission supplémentaire ; Catalogue et Guide des expressions inchangés.
- **AC-08 :** tests statiques/documentaires et composants : mode, 24/17, syntaxes, filtres, accessibilité, comportement de copie, absence d'écriture.
- **AC-09 :** aucune revendication de résultats « calculés à l'affichage » : cette règle métier fait l'objet d'un chantier séparé du guide.

## 7. Découpage Jira proposé — brouillons, PAS de tickets créés

**Epic candidat :** « Guide des indicateurs recommandés Scrum et Kanban — Paramètres ».
**Rattachement :** vérifier s'il faut rattacher au périmètre existant des indicateurs dynamiques plutôt que créer un nouvel Epic. Éviter doublons. Labels proposés : `indicateurs-v33`, `guide-metier`, `scrum-kanban`. Les Stories ci-dessous sont indépendantes autant que possible et testables.

### US-GUIDE-01 — Ajouter le troisième onglet sans changer les droits

**En tant qu'** administrateur ayant accès à Paramètres > Indicateurs, **je veux** un onglet « Indicateurs recommandés » **afin de** consulter la bibliothèque sans quitter l'écran.

**AC :**
- Étant sur Paramètres > Indicateurs, lorsque j'active le troisième onglet, je vois un panneau distinct et les deux onglets existants restent fonctionnels.
- Les rôles non autorisés à la page continuent d'être refusés ; aucun accès indirect supplémentaire.
- Navigation clavier, hash/deep-link et responsive sont cohérents avec l'existant.
**Dépendances :** aucune. **Impacts :** `settings-tabs.tsx`, `page.tsx`, composants d'affichage. **Tests :** rendu et autorisation.

### US-GUIDE-02 — Constituer les bibliothèques métier Scrum / Kanban versionnées

**En tant qu'** administrateur, **je veux** des définitions recommandées cohérentes par mode **afin de** consulter uniquement des indicateurs calculables ou saisissables avec v33.

**AC :**
- 24 fiches Scrum et 17 fiches Kanban avec ID, domaine, type, tag/expression, unité, prérequis et limites.
- Aucune formule hors parseur v33 ; aucune prétention à une source technique inexistante ; indicateurs saisis explicitement nommés.
- Les définitions ne modifient aucun indicateur existant et ne nécessitent ni migration ni API d'écriture.
**Dépendances :** aucune ; données consommables séparément de l'UI. **Impacts :** nouveau module de données et tests de validation parser. **Tests :** exhaustivité, unicité ID, validation `parseFormula`, exemples chiffrés.

### US-GUIDE-03 — Afficher la bibliothèque du mode Agile de l'équipe

**En tant qu'** administrateur, **je veux** consulter les recommandations correspondant à l'équipe choisie **afin de** ne pas mélanger Scrum et Kanban.

**AC :**
- Mode résolu par une source d'équipe autorisée existante, sans paramètre client non vérifié.
- Scrum affiche 24 fiches, Kanban 17 ; changement d'équipe actualise le mode.
- Absence d'équipe ou mode inaccessible affiche un état neutre ; aucune donnée d'une équipe non autorisée.
**Dépendances :** US-GUIDE-01 et US-GUIDE-02. **Impacts :** résolution contexte équipe / navigation existante, sans changement de droits. **Tests :** Scrum/Kanban/sans équipe/accès interdit.

### US-GUIDE-04 — Fiches pédagogiques et copie des expressions

**En tant qu'** administrateur, **je veux** une fiche détaillée avec dépendances et expression copiable **afin de** pouvoir reproduire l'indicateur dans le Catalogue.

**AC :**
- Chaque fiche affiche objectif, définition, prérequis et types, tag suggéré ou formule, unité, exemple arithmétique, interprétation, limite et affichage conseillé.
- Le bouton copier reproduit exactement une expression du catalogue, avec retour accessible en réussite/échec.
- Aucun clic ne crée/modifie automatiquement un indicateur.
**Dépendances :** US-GUIDE-02 ; panneau intégré après US-GUIDE-01. **Impacts :** composants UI uniquement. **Tests :** rendu manuel/calculé, clipboard mock, accessibilité.

### US-GUIDE-05 — Recherche, filtres et recette de non-régression

**En tant qu'** administrateur, **je veux** filtrer les indicateurs par domaine, type et texte **afin de** trouver rapidement une recommandation.

**AC :**
- Recherche sur nom, description et tags, non sensible à la casse ; filtres domaine et Saisi/Calculé combinables.
- Compteur de résultats et état vide annoncés de façon accessible ; présentation adaptée mobile.
- Tests confirment intactes les fonctions Catalogue, Guide des expressions, droits et absence d'écriture.
**Dépendances :** US-GUIDE-01, US-GUIDE-02 et US-GUIDE-03. **Impacts :** UI + tests. **Tests :** filtres cumulés, états vides et non-régression.

**Ordre suggéré :** US-01 + US-02 (parallélisables), puis US-03/US-04, puis US-05. **Pas de développement ou test exécuté pendant cette rédaction.**

## 8. Sources de vérité et points de vigilance

- UI : `src/app/app/admin/settings/indicators/page.tsx`, `settings-tabs.tsx`, `expression-guide.tsx`.
- Syntaxe : `src/server/indicators/formula/index.ts`, `src/server/indicators/formula/history.ts`.
- Capacités Scrum/Kanban : `src/server/indicators/formula/role-context.ts`.
- Données et calcul v33 : `src/server/indicators/manual-values.ts`, `recalculation.ts`, `reporting.ts`.
- Référentiel UX : `docs/UX-REFERENTIEL-BMAD.md`.
- Décision différée à arbitrer avant développement : **l'accès effectif pour un Scrum Master non administrateur**, puisque l'écran Paramètres > Indicateurs actuel requiert `role=admin`. Ne pas confondre le public métier cible et les permissions techniques actuelles.
- Le statut « 24 Scrum / 17 Kanban » est **le contenu approuvé du guide** dans ce cadrage ; aucune base locale n'a été consultée pour vérifier la disponibilité des tags.

## 9. Traçabilité de validation et livraison

**Validé fonctionnellement :** bibliothèque Scrum/Kanban, présentation par domaine et type, fiches détaillées, fonctions actuelles uniquement ; utilisateur a demandé la préparation de la spécification et des Stories le 05/11/2026.

**Non autorisé explicitement à cette étape :** création effective des tickets Jira, modification de code applicatif, exécution de test, déploiement. Demander l'accord explicite avant publication Jira du découpage proposé.
