---
name: Scrum Master Notebook — Tableau de bord
status: final
updated: 2026-10-21
description: Contrat d'expérience utilisateur du tableau de bord SMN validé le 21 octobre 2026.
sources:
  - https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/prd.md
  - https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/parcours-utilisateur-ergonomie.md
  - https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/risques-dependances.md
  - https://github.com/JeanLamora75/SMN/blob/main/docs/NAVIGATION-CONTEXTUELLE-SMN-23.md
  - https://github.com/JeanLamora75/SMN/blob/main/docs/RESPONSIVE-ACCESSIBILITE-SMN-25.md
---

# SMN — EXPERIENCE.md

> **Statut : validé métier et UX le 21 octobre 2026 ; implémentation non engagée.** Document pair de [DESIGN.md](DESIGN.md), qui décrit l'apparence (tokens `{colors.brand-primary}`, `{spacing.column-gap}`, etc.) ; ce document décrit **comportements et parcours**. La capture [MAQUETTE-REFERENCE.md](MAQUETTE-REFERENCE.md) reste la référence de composition ; si une illustration fictive contredit une règle décrite ici, les contrats `DESIGN.md` et `EXPERIENCE.md` validés prévaudront.

## Foundation

- **Produit** : Scrum Master Notebook, application web locale responsive ; référentiel de pilotage et mémoire professionnelle du Scrum Master, puis du RTE en SAFe v1.0.
- **Technologie existante consultée** : Next.js / React, Bootstrap 5, PostgreSQL, textes centralisés `src/i18n/fr.json` et `en.json`, thèmes clair/sombre et palettes SMN-24. Aucune nouvelle bibliothèque ni migration n'est prescrite par ce document.
- **Contexte MVP** : une installation, un produit et **une seule équipe** Scrum/Kanban. Le sélecteur Équipe doit être prévu graphiquement mais ne doit pas suggérer que des équipes supplémentaires existent ou sont disponibles. La multiéquipe concerne l'évolution SAFe/ART, pas le périmètre actuellement livré.
- **Rôles MVP** : `admin` et `user`. Tableau de bord collectif commun, différence de droits sur les actions et les écrans d'administration. La présence/absence d'un menu ne remplace jamais l'autorisation serveur.
- **Principes** : saisie minimale ; données fiables et datées ; aucune valeur fictive ou zéro par défaut ; métriques facultatives ; pas de classement individuel ; traçabilité ; cohérence entre le cycle, les cartes et les vues détaillées.
- **Référence visuelle** : [DESIGN.md](DESIGN.md) et ses tokens sémantiques, hérités des thèmes SMN-24.

## Information Architecture

| Surface | Entrée | Rôle et contexte |
|---|---|---|
| Tableau de bord `/app` | Après connexion / navigation principale | Synthèse intégrale du cycle choisi : en-tête, métriques, quatre colonnes de suivi |
| Header applicatif | Persistant sur les pages privées | Identité SMN, sélection équipe, sélection cycle, recherche si livrée, compte et contrôles de session |
| Sidebar | Sous le header, repliable | Navigation par fonctions : pilotage, cycles/bilans, calendrier, registres, rapports/IA, administration autorisée |
| Carte développée | Clic / Entrée sur une carte | Complément d'information dans le contexte sans mutation ni déplacement de page |
| Menu `…` de fiche | Commande explicite sur une carte | Consultation, modification/statut autorisés selon le type de fiche, droits et état du cycle |
| « Voir le détail » | Carte développée / menu `…` | Ouvre la fiche ou la page métier, en conservant le contexte de départ |
| « Voir tout » | En-tête d'une colonne | Liste complète filtrable, dont éléments résolus/terminés ; contexte équipe/cycle préservé |
| « Ajouter … » | Bas de chaque colonne | Préremplit équipe/cycle lorsque pertinent et autorisé ; confirmation et validations métier habituelles |
| Organiser le tableau de bord | Commande dédiée | Change uniquement l'ordre des métriques et l'ordre des quatre colonnes ; Enregistrer / Annuler / Réinitialiser |
| Administration/paramètres | Sidebar / interface administrative | Réglages hors des métriques métier, dont tâches facultatives de configuration |

**Important :** les accès à des modules non livrés doivent rester visiblement indisponibles, jamais des liens vers des pages inexistantes. Ne pas attribuer de nouvelles routes non présentes dans le code sans étude d'architecture. La recherche figurant sur la maquette est un **emplacement visuel** tant que son périmètre et son moteur ne sont pas livrés.

### Structure et contexte

- Header pleine largeur. Sur grand écran : identité à gauche, **sélecteur équipe**, **sélecteur cycle**, **champ recherche** immédiatement après, puis compte/commandes existantes. Sur mobile les contrôles peuvent passer sur une deuxième ligne ou un panneau dédié, sans perte de fonctionnalité.
- Sidebar rétractable, sur toute la hauteur disponible **sous** le header. Déployée : libellés et groupes ; réduite : icônes + noms accessibles/infobulles. Mémoriser le choix de présentation si la persistance est disponible ; préférer un état déployé initial lors de la découverte.
- En-tête de cycle occupant toute la largeur de la zone centrale et contenant **nom**, **dates**, **statut**, **objectif(s)** et lien vers le détail. Le PRD autorise **plusieurs objectifs** : montrer une synthèse et un accès explicite à la liste, pas supposer qu'un seul objectif existe.
- Dessous : 4 à 6 cartes métriques réorganisables. Ensuite : **Obstacles**, **Risques**, **Événements de calendrier**, **Notes / Alertes**, colonnes réorganisables sans réorganisation manuelle de leurs fiches.

### Sélection d'équipe et de cycle

1. À l'ouverture, sélectionner l'équipe courante autorisée. Au MVP, une seule option réelle ; le contrôle peut être en lecture seule ou indiquer son option unique. Ne jamais inventer d'autres équipes.
2. Sélectionner par défaut le cycle **actuellement en cours** lorsqu'il est unique et connu. Les cycles antérieurs sont disponibles dans la liste, avec dates et statut. Si plusieurs cycles sont éligibles (ou anciens cycles non clôturés), afficher distinctement les statuts ; **règle de priorité automatique à préciser** plutôt que sélectionner silencieusement un mauvais cycle.
3. Un changement d'équipe recharge les options de cycles autorisées et sélectionne un cycle pertinent ; cette évolution n'a pas d'effet réel multiéquipe au MVP.
4. Un changement de cycle actualise **ensemble** l'en-tête, toutes les cartes métriques, les comparaisons et les quatre colonnes. Rester sur le même écran ; préserver le menu, la disposition personnalisée et l'accès aux fiches.
5. Pendant la lecture, signaler le chargement sans effacer prématurément le contexte. En cas d'erreur, indiquer l'échec et offrir Réessayer ; ne pas associer des données de cycles différents.
6. L'historique est en **lecture contextualisée** par défaut : ne jamais afficher une alerte actuelle ou l'état actuel d'un risque comme s'il s'agissait de l'état d'un ancien Sprint.

## Voice and Tone

Concision professionnelle. Exprimer le **fait**, son **unité**, son **périmètre** et, quand nécessaire, son **origine**. Ne pas transformer automatiquement une variation en jugement de performance.

| À dire | À éviter |
|---|---|
| « Capacité prévue — 42 J/H » | « J/H réalisés » pour une disponibilité recalculée |
| « Capacité réelle — 39 J/H » | « Productivité : 93 % » |
| « 5 jours ouvrés restants » | « J-5 » sans définition de calendrier |
| « Non renseigné » / « Non calculable » | « 0 » sans donnée source |
| « Données mises à jour après clôture » | « Sprint modifié » sans indication d'historique |
| « +3 SP vs Sprint précédent » | « +3 SP = meilleure performance » |
| « Aucune alerte ouverte sur cette période » | « Aucun risque » si la donnée n'est pas disponible |
| « Configuration — phrase de secours à définir » | Présenter ce rappel comme un événement historique du cycle |

Tous les libellés et messages statiques doivent être dans **`src/i18n/fr.json` et `src/i18n/en.json`**. Le contenu métier rédigé par l'utilisateur conserve sa langue d'origine.

## Component Patterns

### En-tête Sprint / période

- Affiche nom du cycle, dates début/fin, statut exact, éventuel indicateur de corrections historiques, résumé des objectifs enregistrés, « Voir le détail du cycle ».
- Si l'objectif est absent : « Objectif non renseigné ». Si plusieurs objectifs : les représenter fidèlement, avec résumé et accès à la liste.
- En Scrum, « Sprint » ; en Kanban, « Période ». La terminologie n'est pas codée en dur dans le composant. La structure anticipe ART/PI sans prétendre livrer SAFe au MVP.
- **Cycle clôturé** : afficher l'état historique issu des données de clôture, puis la dernière version volontairement corrigée lorsqu'une nouvelle clôture a été enregistrée.

### Cartes métriques (4–6, sans valeurs forcées)

| Carte | Partie haute | Partie basse | Calcul/condition |
|---|---|---|---|
| Capacité | **Capacité prévue en J/H** : somme des disponibilités de développement pertinentes au cycle, référence initiale | **Capacité réelle disponible en J/H** : valeur constatée/recalculée compte tenu des indisponibilités imprévues et autres données applicables | Ratio réelle/prévue **uniquement** si dénominateur valable, sans assimiler la disponibilité au travail produit |
| Story Points | **SP initialement engagés** | **SP réalisés** enregistrés | Conserver la distinction SP initiaux, ajoutés, retirés, terminés. **Engagement initial validé** ; ne pas substituer le périmètre modifié après ajout/retrait |
| Tickets | **Tickets initialement engagés** | **Tickets réalisés** | Comptages agrégés facultatifs selon sources fiables ; ne pas imposer un suivi de tickets unitaires dans SMN |
| Échéance | « Fin du cycle dans … » | **Nombre de jours ouvrés restants**, saillant | Unité **validée** ; calendrier hebdomadaire **lundi–vendredi** validé ; inclusion du jour courant et fuseau à préciser ; sur cycle terminé : date de fin/statut et non décompte négatif |
| 5e / 6e carte éventuelle | Autre KPI existant réellement défini | Valeur et éventuellement évolution | **Ne pas afficher** la carte « Avancement global » sans règle métier ; remplacement par des raccourcis éventuel mais non décidé |

- Les trois premières cartes peuvent comporter une séparation graphique fine entre haut et bas. Un `—` accompagné de « Non renseigné » ou « Non calculable » vaut mieux qu'un pourcentage arbitraire.
- La **comparaison au cycle précédent** fait partie de l'UX validée pour les indicateurs pertinents et comparables : valeur de référence, écart avec unité ; pourcentage facultatif si dénominateur défini et non nul. En cas de durées différentes, changements de définition, valeurs absentes ou contextes incomparables : « Comparaison indisponible » et possibilité de lire la raison.
- Pas de jugement par couleur (« vert » pour une hausse de J/H ou SP) sans règle métier. Ne jamais additionner des SP d'équipes différentes dans une future vue ART.
- L'échéance est un **compte de jours ouvrés de référence**, pas une mesure de capacité humaine (J/H). Cette distinction doit rester visible.

### Quatre colonnes de suivi

Règles communes : **maximum cinq fiches éligibles** visibles dans chaque colonne, tri automatique validé, aucune pagination interne de la synthèse ; compteur du total éligible, « Voir tout » vers la vue complète (dont états terminés/résolus) et raccourci « Ajouter » après la dernière fiche. Une colonne peut être plus courte que ses voisines ; ne pas forcer cinq espaces artificiels.

| Colonne | Filtre de synthèse | Tri automatique | Actions rapides candidates |
|---|---|---|---|
| Obstacles | Associés au contexte du cycle ; non résolus | Criticité décroissante puis ancienneté | Consulter, modifier, résoudre si autorisé |
| Risques | Associés au contexte ; non clos | Criticité décroissante puis échéance connue | Consulter, modifier, changer le statut si autorisé |
| Événements | Événements du cycle, à venir pour cycle courant ; historiques de la période pour ancien cycle | Ordre chronologique pertinent au contexte | Consulter, modifier, reporter, annuler selon règles existantes |
| Notes / Alertes | Notes/alertes non terminées, pertinentes au cycle, plus alertes globales explicitement séparées lorsque affichées | Alertes prioritaires puis notes récentes ; ex æquo stables | Consulter, modifier, traiter/ignorer lorsque le type et les droits le permettent |

- **Notes et alertes** ont des icônes et couleurs distinctes, plus un nom de type lisible ; une alerte de configuration porte « Configuration » et ne bloque jamais le pilotage métier.
- **Terminées/résolues** : masquées de la synthèse Notes/Alertes et, par cohérence avec les choix de cadrage, des synthèses Obstacles/Risques ; toujours disponibles via « Voir tout » avec filtre explicite. Pour les événements, conserver les événements historiques connus dans un ancien cycle, même s'ils sont passés : un événement passé n'est pas une note « terminée ».
- **Alerte globale en vue historique** : ne pas la confondre avec une alerte de la période. Proposition à confirmer : afficher dans une sous-section « Configuration actuelle — hors cycle » uniquement si sa visibilité est utile ; sinon l'accès reste possible via Administration. Jamais ajoutée aux totaux historiques.
- Lorsque des événements sont reprogrammés ou annulés, refléter leur statut exact ; aucune date de tenue « réelle » n'est inventée.
- Raccourci Ajouter : contrôle toujours localisé au pied de la colonne pour les cycles où la création est autorisée. Si la fonction métier n'est pas encore disponible, afficher l'indisponibilité honnêtement plutôt qu'un bouton inopérant. Sur cycle clôturé, ne pas proposer silencieusement un ajout rétroactif.
- **Tri** : la criticité est une mesure métier issue du registre, non déduite arbitrairement par l'interface ; égalités résolues de façon stable, règle exacte documentée au moment du développement.

### Expansion, consultation et actions rapides

- Une carte peut être **développée** pour une consultation plus riche sur le tableau de bord, puis « Voir le détail » mène à la fiche métier. Proposition UX : une seule carte développée par colonne ou par tableau de bord — **à confirmer par recette**, sans blocage de l'implémentation initiale.
- Le menu `…` est distinct de l'action d'expansion : consultation, modification et changement de statut selon le registre, les droits de session et le statut du cycle. Des options non permises sont masquées ou désactivées avec explication.
- Tout changement de statut/édition n'est appliqué qu'après l'action utilisateur et les validations métier. Afficher un retour clair succès/échec ; éviter les mises à jour optimistes trompeuses en cas de refus serveur.
- Un cycle **clôturé** ne propose pas de mutation rapide ordinaire : ouvrir la fiche et suivre une **correction contrôlée**, avec réouverture/reclôture et traçabilité selon les règles existantes. Un objet encore actif dans un autre cycle ne doit pas être clôturé par erreur depuis l'historique.
- La consultation d'une fiche centrale contemporaine depuis un cycle ancien indique explicitement si les informations affichées sont **courantes** ou **historiques**.

### Réorganisation du tableau de bord

- Mode « Organiser mon tableau de bord » : déplacer **uniquement** les cartes métriques entre elles et les quatre **colonnes entières** entre elles. Les éléments à l'intérieur des colonnes restent automatiquement triés ; le bandeau cycle demeure fixe.
- Deux suites d'éléments ordonnées indépendamment ; actions **Enregistrer**, **Annuler**, **Réinitialiser la disposition** ; prévenir d'une préférence non sauvegardée avant de quitter si pertinent.
- Le déplacement est possible à la souris et **au clavier** (commandes Monter/Descendre ou équivalent), avec annonce du nouvel ordre. Éviter de dépendre d'une bibliothèque de glisser-déposer non présente.
- La disposition persiste entre changements de cycle/équipe et après reconnexion lorsque la persistance est implémentée. **Périmètre de stockage (préférence par compte ou par installation) à confirmer** ; ne pas écrire dans les préférences personnelles sans décision sur le modèle.
- Sur smartphone, l'ordre de lecture des blocs suit la personnalisation, sans créer une grille horizontalement défilante.

## State Patterns

| État | Affichage / comportement |
|---|---|
| Installation valide sans cycle | En-tête neutre : « Aucun cycle créé », métriques non disponibles, suggestion de création seulement si route existante ; **aucun cycle automatique** |
| Cycle actuel sans objectif | « Objectif(s) non renseigné(s) » ; pas de fausse cible |
| KPI absent ou incomplet | « Non renseigné »/« Non calculable » ; pas de zéro fictif |
| Aucune période précédente | « Aucun cycle précédent » ; aucune comparaison |
| Capacité prévue nulle ou indisponible | Ratio absent, pas de division par zéro |
| Aucun item éligible | « Aucun élément à afficher » et bouton Ajouter uniquement si action disponible |
| Plus de cinq items | Cinq premiers selon tri approuvé ; « Voir tout » fournit accès aux autres |
| Cycle historique non clôturé | Données courantes lorsque le modèle métier le prévoit, mais période historique clairement annoncée |
| Cycle historique clôturé | Dernier instantané de clôture **V1/V2…** conservé et traçable pour risques/dépendances ; aucune substitution par état actuel |
| Cycle rouvert, non reclôturé | État courant explicite de cycle rouvert ; ne pas faire passer ces données pour un instantané final |
| Correction ultérieure et reclôture | Dernière version enregistrée affichée ; indication de correction ; versions antérieures et exports déjà produits inchangés |
| Alerte de configuration | Badge « Configuration » distinct, facultatif, accessible à l'admin autorisé, pas assimilé à une alerte métier historique |
| Recherche ou module absent | Fonction signalée indisponible ; aucun lien trompeur |
| Changement de contexte en cours | Indicateur de chargement accessible ; données de l'ancien contexte non présentées comme nouvelles |
| Accès refusé / fiche supprimée | Message générique adapté et retour sûr au tableau de bord ; pas de fuite d'informations |
| Échec de sauvegarde | Message d'erreur, disposition ou état précédent restauré, pas de succès affirmé |

## Interaction Primitives

- **Sélecteurs natifs accessibles** équipe / cycle ; typage clavier, focus visible avec `{colors.focus-ring}`, raccourcis seulement si documentés.
- **Clic sur carte / clavier** : expansion, avec `aria-expanded` et intitulé explicite ; ne pas rendre tout l'article cliquable si cela empiète sur `…` ou les autres commandes.
- **Menu `…`** : commande nommée « Actions pour [titre] », ouverture clavier, Escape pour fermer, focus restitué au déclencheur.
- **Voir le détail / retour** : contexte équipe + cycle porté via identifiants stables et paramètres autorisés, sans contourner les contrôles de droits serveur. Respecter la liste blanche de `src/lib/context-navigation.ts` et l'étendre de manière revue si besoin.
- **Ajout rapide** : préremplissage contextuel sans création silencieuse, validation explicite, suppression impossible des contrôles métier existants.
- **Organiser** : déplacements annoncés, save explicite, Annuler sans effet, Réinitialiser confirmée si elle écrase une disposition persistée.
- **Temps réel** : aucune promesse de mise à jour live tant qu'aucune infrastructure n'est prévue ; relecture explicite au changement de cycle et navigation.

## Accessibility Floor

- Cible de recette : **WCAG 2.2 niveau AA** pour les nouveaux composants, **à vérifier** ; aucune certification ne résulte de ce document.
- Navigation entière au clavier et au lecteur d'écran, avec intitulés contextuels et lien d'évitement au contenu principal existant (`#smn-main`).
- Cibles tactiles d'au moins 44 px lorsque le socle SMN-25 l'exige sur petit écran ; retour de focus lors des dialogues, menus et changements de contexte.
- Ne jamais coder le statut seulement par couleur (danger/avertissement/notes). Les différences de note/alerte sont textuelles et iconographiques.
- Les chiffres et unités restent associés sémantiquement ; varier une donnée ne doit pas être annoncé comme « meilleure » sans raison métier. Pas de faux tableaux de comparaison.
- Les interfaces doivent fonctionner à 200 % de zoom, à 320 px de large, sans perte d'action essentielle ni défilement horizontal forcé ; prise en compte de `prefers-reduced-motion`.
- Infobulles du menu réduit accessibles au focus, noms des boutons clairs, ordre des régions respectant le flux de lecture.
- Tous les messages FR/EN passent par les JSON i18n centralisés, sans textes codés en dur dans les composants.

## Key Flows

### Parcours 1 — Camille, Scrum Master, ouvre le Sprint courant

1. Camille se connecte ; SMN affiche l'équipe autorisée et le Sprint courant réellement enregistré.
2. Elle voit en priorité le nom, les bornes, les objectifs puis la capacité prévue/réelle, les SP et tickets engagés/réalisés et les **jours ouvrés restants**.
3. Elle consulte les cinq obstacles les plus prioritaires, les risques, les cérémonies à venir, les notes et alertes non terminées.
4. **Moment clé :** Camille identifie un obstacle bloquant, ouvre `…`, choisit « Consulter » ou une action autorisée et revient sans perdre son Sprint.
5. Aucun statut n'est changé tant qu'elle n'a pas confirmé une action valide ; les autres éléments restent visibles.

### Parcours 2 — Camille consulte le Sprint précédent

1. Depuis le header, elle sélectionne un Sprint clôturé dans la liste.
2. Tout le tableau de bord se recharge dans ce contexte ; métriques, objectifs, événements et fiches liées reflètent le cycle choisi.
3. Les KPI comparables montrent l'écart par rapport au Sprint **immédiatement antérieur** lorsque fiable ; les données non comparables indiquent pourquoi.
4. **Moment clé :** une dépendance affiche l'état de la **dernière version d'instantané** du Sprint clôturé, et non son état actuel dans le registre.
5. Le menu d'une fiche historique conduit à une consultation ou à une correction contrôlée, sans mutation involontaire de la situation actuelle.

### Parcours 3 — Camille organise son cockpit

1. Elle clique « Organiser mon tableau de bord ».
2. Elle place « Risques » avant « Obstacles » et rapproche la carte des jours ouvrés restants des métriques souhaitées, via flèches au clavier ou déplacement équivalent.
3. Elle enregistre. Un changement de Sprint ne modifie pas cet ordre ; la liste interne des risques reste triée automatiquement par criticité.
4. **Moment clé :** elle peut annuler un autre changement sans effacer la disposition précédemment enregistrée.

### Parcours 4 — Morgan, utilisateur simple, consulte le tableau collectif

1. Morgan ouvre le même tableau de bord ; seules les données collectives auxquelles son rôle donne accès sont présentées.
2. Il consulte une carte et navigue vers le détail selon ses droits ; les commandes d'administration ou de mutation interdites ne sont pas disponibles.
3. **Moment clé :** un lien direct non autorisé est refusé côté serveur, pas seulement caché dans le menu.

## Inspiration & Anti-patterns

- **Référence approuvée** : `maquette-reference-validee.png`, notamment le bandeau supérieur léger, les cartes doubles et les quatre colonnes d'éléments ; les valeurs de la capture sont fictives.
- **Anti-patterns** : grand hero décoratif avec faible contenu, configuration facultative dominant l'accueil, menu latéral qui tronque les labels, tous les modules « À venir » semblant actifs, comparaison chiffrée sans équivalence, confusion entre capacité et effort, alertes globales attribuées à un ancien cycle, jugement de productivité individuelle.

## Responsive & Platform

- Composition en largeur utile : **quatre** colonnes si la largeur de contenu le permet ; **deux** sur largeur intermédiaire ; **une** en largeur étroite. Pas de scroll horizontal imposé entre les colonnes.
- Les cartes métriques passent de 4–6 à 2–3 puis 1–2 par rangée selon l'espace ; la carte de jours ouvrés reste suffisamment visible et accessible, mais peut changer de ligne.
- Sidebar sous le header et sur toute sa hauteur disponible en desktop ; variante compacte sur mobile. Sur petit écran le header rend les sélecteurs accessibles sans cacher le champ recherche ni les commandes de session réellement présentes.
- Les breakpoints chiffrés proposés dans `DESIGN.md` ne seront figés qu'après recette à 320, 375, 768, 1024, 1440 et > 1440 px, menu développé/réduit, zoom 200 %, thèmes clair/sombre et FR/EN.

## Critères de recette UX proposés

| ID | Scénario vérifiable | Résultat attendu |
|---|---|---|
| UX-TDB-01 | Ouvrir `/app` sur fenêtre large | Header pleine largeur ; sidebar sous header ; contenu utilise toute la largeur utile |
| UX-TDB-02 | Réduire/déployer la sidebar | Navigation complète accessible, sans libellés tronqués ni fonctions perdues |
| UX-TDB-03 | Ouvrir une installation sans cycle | Aucun cycle ni KPI fictif, état vide utile |
| UX-TDB-04 | Choisir un ancien cycle | Toutes les zones métier affichent ce contexte, sans mélange de données |
| UX-TDB-05 | Afficher la carte capacité | Capacité initiale et capacité réelle disponibles séparées et correctement identifiées en J/H |
| UX-TDB-06 | Consulter la carte échéance | Nombre de jours **ouvrés** affiché lorsque calcul fondé ; pas de négatif sur cycle clos |
| UX-TDB-07 | Comparer deux cycles | Écart explicité avec unité, ou indisponibilité si données non comparables |
| UX-TDB-08 | Ouvrir les quatre colonnes avec >5 éléments | Cinq premiers éligibles, tri métier correct, « Voir tout » donne le reste et les états clos |
| UX-TDB-09 | Afficher notes, alertes et configuration | Icônes/couleurs/libellés distincts ; terminé masqué ; portée globale explicite |
| UX-TDB-10 | Développer carte, consulter puis revenir | Équipe, cycle et disposition conservés |
| UX-TDB-11 | Action rapide sur cycle actif | Menu adapté aux droits ; sauvegarde effective ou erreur explicite |
| UX-TDB-12 | Action rapide sur cycle clôturé | Correction contrôlée, aucune mutation historique implicite |
| UX-TDB-13 | Réorganiser cartes métriques et colonnes | Ordre enregistré, Annuler/Reinitialiser opérationnels, tri interne inchangé |
| UX-TDB-14 | Tests écran étroit | 4/2/1 selon largeur utile, commandes atteignables, pas de scroll horizontal essentiel |
| UX-TDB-15 | Tests clavier / thèmes / langues | Focus visible, textes FR/EN, bon contraste, contrôle possible sans souris |
| UX-TDB-16 | Voir risques/dépendances d'un cycle reclôturé | Dernière version de l'instantané utilisée ; anciennes versions non réécrites |
| UX-TDB-17 | Profil non administrateur | Accès et mutations conformes aux autorisations serveur |

Ces critères sont une **proposition de recette**, pas des tests exécutés ni des AC Jira déjà créés.

## Arbitrages restant ouverts avant passation au développement

1. **Jours ouvrés restants** : semaine de référence **lundi à vendredi** validée ; restent à préciser l'inclusion du jour courant, le fuseau de référence et les conventions de frontière du cycle. Le compteur de jours ouvrés n'est pas la capacité calculée en J/H ; jours fériés/fermetures ne sont pas déduits du simple compteur lundi–vendredi sans décision explicite.
2. **Disponibilité des valeurs initiales** : la notion d'engagement initial pour les SP et les tickets est validée ; les producteurs métier devront vérifier que les deux valeurs initiales sont stockées et utilisables, sinon indiquer l'absence de donnée.
3. **Carte supplémentaire** : la carte « Avancement global » de la capture **n'est pas affichée** sans règle validée. Des boutons d'accès rapide pourront être envisagés ultérieurement après arbitrage.
4. **Alertes de configuration et historique** : afficher séparément et explicitement comme « Configuration actuelle » dans la colonne historique, ou n'en permettre l'accès que depuis l'administration ; jamais dans les totaux d'un ancien cycle.
5. **Préférence d'organisation** : stockage par compte ou global à l'installation ; valeurs par défaut et migration de la préférence préexistante, si applicable.
6. **Plusieurs cycles éligibles** : règle de présélection lorsque périodes ouvertes, terminées mais non clôturées et périodes parallèles coexistent.
7. **Portée des notes/alertes et autres fiches** : schéma des statuts, associations au cycle et horodatages fiables ; action « ignorer » selon catégories, à définir sans contredire le métier.
8. **Capacité de livraison** : de nombreuses pages, sources KPI, historiques et actions de registre n'existent pas dans l'incrément présent. Créer les nouveaux parcours avec leurs propres Stories/dépendances plutôt que simuler une fonctionnalité terminée.
9. **Responsive** : confirmer les seuils CSS selon largeur de contenu, les comportements de header et la hauteur sidebar par essais réels.

### Priorisation pour réalisation ultérieure (proposition, pas engagement)

- **Lot UX socle** : layout pleine largeur ; sidebar rétractable ; structure du header et du dashboard ; états vides honnêtes ; compatibilité thèmes/i18n/accessibilité.
- **Lot données métier** : sélection des cycles, métriques, compteurs et historique fiable ; règles de calcul documentées.
- **Lot interactions** : colonnes et actions rapides, écrans « Voir tout », notes/alertes, organisation persistée, parcours de correction contrôlée.

Le Product Owner approuvera séparément l'ouverture de développements et toute écriture dans GitHub/Jira.

## Décisions complémentaires validées le 21 octobre 2026

- **UXD-24 — Jours ouvrés** : compteur basé sur les jours **lundi, mardi, mercredi, jeudi et vendredi** ; ne pas déduire automatiquement les week-ends du calcul de capacité J/H, qui suit un autre contrat. Jour courant, bornes temporelles et fuseau restent à préciser.
- **UXD-25 — Engagement initial** : afficher les **Story Points initialement engagés** et les **tickets initialement engagés** dans la moitié supérieure de leurs cartes, puis les valeurs réalisées dans leur moitié inférieure. Les variations de périmètre ultérieures ne réécrivent pas l'engagement initial.
- **UXD-26 — Carte Avancement global** : **ne pas afficher** la carte du prototype en l'absence de formule approuvée. La cinquième ou sixième position peut rester absente ; des raccourcis feront l'objet d'un arbitrage futur.
- **UXD-27 — Historique incomplet** : interroger les données réellement disponibles en base ; si aucun élément historique fiable n'est disponible pour le contexte, afficher exactement **« Aucun éléments à ce jour »** (formulation utilisateur, à soumettre ultérieurement à validation linguistique), sans zéro fictif, sans état courant réétiqueté « historique » et sans création d'instantané artificiel. Appliquer les snapshots de dernière clôture existants aux risques/dépendances lorsqu'ils sont disponibles.
- **Dépendances métier** : production des Sprints/périodes, calendrier, métriques d'engagement initial, données historiques fiables, autorisations et écrans de détail. Aucun de ces modules n'est présumé déjà livré.


## Extension comportementale approuvée — 23 octobre 2026 : navigation Sprint (lot 1)

- Un Sprint réel sélectionné affiche son **nom, dates locales, statut effectif** et l'objectif issu du modèle métier déjà raccordé à SMN-235. L'état non renseigné est distinct de l'indisponibilité de la source.
- La Story SMN-83 autorise **plusieurs objectifs par Sprint** : afficher un objectif et le nombre supplémentaire dans le bandeau ; la fiche `/app/admin/sprints/[sprintId]` expose la liste intégrale, sans désignation artificielle d'un « objectif principal ».
- Le bouton **« Voir le détail du sprint »** et le nom cliquable dans la liste de Sprints accèdent à une **première fiche en lecture seule** ; future fiche complète enrichissable sans inventer ses sections, ni des actions d'écriture.
- Résolution et autorisation de la fiche côté serveur : seuls les Sprints non supprimés de l'équipe autorisée sont consultables, quel que soit le rôle `admin`/`user`. Les autres IDs donnent 404, pas d'existence ou de données dévoilées.
- Retour au dashboard avec les identifiants `teamId` et `cycleId` du Sprint consulté.
- Sans Sprint, n'afficher aucun faux bouton de fiche et conserver le lien existant vers l'équipe.
- Les icônes de ce lot sont **Bootstrap Icons SVG locales**, décoratives et `aria-hidden` ; le texte accessible porte la signification.
- Les KPI, calendriers et registres restent régis par leurs Stories (SMN-235/236/237, SMN-238 différée jusqu'à Epic 5). Aucun chiffre ni carte nouvellement inventé.
- Dossier de réalisation : `_bmad-output/implementation-artifacts/refonte-ux-dashboard-lot1-entete-sprint-2026-10-23.md`. Tests et recette Windows encore à confirmer.


## Extension comportementale du 23 octobre 2026 — Lot 2 : métriques

- Les quatre cartes restent liées à **l'unique Sprint sélectionné** et utilisent exclusivement la projection métier collective existante, même lors d'une clôture Vn.
- La moitié supérieure de Capacité/SP/Tickets affiche les mesures **initiales** ; la moitié inférieure les mesures **réelles/terminées**, sans transposition depuis l'engagement final.
- Le ratio de carte est une comparaison mathématique neutre `valeur-secondaire / valeur-initiale * 100` ; **uniquement si** deux mesures de qualité connue, dénominateur positif et numérateur non négatif. Il ne décrit ni la productivité individuelle ni un avancement global.
- Si valeur initiale = zéro ou valeur absente/inconnue/estimée, **ne présenter aucun anneau, aucun pourcentage**. Le zéro enregistré est toujours distingué de `null`/source indisponible.
- Si le résultat dépasse 100 %, restituer le vrai nombre dans le texte et l'accessibilité, avec limite physique d'un cercle plein.
- Les libellés ARIA distinguent le ratio de disponibilité réelle/prévue du rapport SP terminés/initialement engagés et du rapport tickets terminés/initialement engagés.
- La comparaison inter-Sprints n'est pas remplacée par ces ratios ; « Comparaison indisponible » reste honnête jusqu'à SMN-86.
- Les jours ouvrés ont leur propre carte, **sans ratio**, avec compteur et convention provisoire des jours ouvrés déjà existante.
- Aucun nouveau producteur, calcul SQL, droit ou champ de base créé dans ce lot.
- Dossier BMAD : `_bmad-output/implementation-artifacts/refonte-ux-dashboard-lot2-cartes-kpi-2026-10-23.md`. Recette Windows/UX réelle à confirmer.
