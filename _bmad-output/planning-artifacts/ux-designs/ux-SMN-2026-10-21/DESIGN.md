---
name: Scrum Master Notebook — Tableau de bord
status: final
updated: 2026-10-21
description: Contrat visuel du tableau de bord SMN validé métier le 21 octobre 2026 ; valeurs de tokens techniques indicatives.
sources:
  - https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/parcours-utilisateur-ergonomie.md
  - https://github.com/JeanLamora75/SMN/blob/main/docs/TABLEAU-DE-BORD-SMN-21.md
  - https://github.com/JeanLamora75/SMN/blob/main/docs/APPARENCE-SMN-24.md
  - https://github.com/JeanLamora75/SMN/blob/main/docs/RESPONSIVE-ACCESSIBILITE-SMN-25.md
colors:
  # Valeurs de départ PROPOSÉES pour la palette ocean/claire, à auditer face
  # aux variables existantes de src/app/appearance.css ; ne pas les injecter
  # telles quelles sans contrôle de contraste et sans préserver les thèmes.
  brand-primary: '#165293'
  brand-primary-strong: '#0E3567'
  text-primary: '#10264D'
  text-secondary: '#506482'
  surface-page: '#F5F8FC'
  surface-card: '#FFFFFF'
  surface-context: '#E4F2FF'
  border-subtle: '#DCE6F2'
  info: '#1668BA'
  success: '#087D58'
  warning: '#945600'
  danger: '#BA2525'
  focus-ring: '#236CC0'
  primary-inverse: '#FFFFFF'
  # Les thèmes sombres et les palettes forest/violet héritent de SMN-24.
  # Les couleurs ci-dessus ne constituent PAS une palette sombre validée.
typography:
  body:
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '14px'
    fontWeight: '400'
    lineHeight: '1.5'
  title:
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '28px'
    fontWeight: '700'
    lineHeight: '1.2'
  section:
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '17px'
    fontWeight: '650'
    lineHeight: '1.35'
  metric:
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '26px'
    fontWeight: '700'
    lineHeight: '1.15'
  countdown:
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '42px'
    fontWeight: '750'
    lineHeight: '1.05'
  caption:
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '12px'
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: '6px'
  md: '9px'
  lg: '13px'
  xl: '16px'
  full: '9999px'
spacing:
  '1': '4px'
  '2': '8px'
  '3': '12px'
  '4': '16px'
  '5': '20px'
  '6': '24px'
  header-height: '66px'
  sidebar-expanded: '224px'
  sidebar-collapsed: '64px'
  content-gutter: '16px'
  column-gap: '12px'
components:
  app-header:
    background: '{colors.surface-card}'
    height: '{spacing.header-height}'
    borderColor: '{colors.border-subtle}'
  sidebar:
    background: '{colors.surface-card}'
    expandedWidth: '{spacing.sidebar-expanded}'
    collapsedWidth: '{spacing.sidebar-collapsed}'
  sprint-context:
    background: '{colors.surface-context}'
    radius: '{rounded.xl}'
    padding: '{spacing.6}'
  metric-card:
    background: '{colors.surface-card}'
    borderColor: '{colors.border-subtle}'
    radius: '{rounded.lg}'
    padding: '{spacing.5}'
  item-card:
    background: '{colors.surface-card}'
    borderColor: '{colors.border-subtle}'
    radius: '{rounded.md}'
    padding: '{spacing.3}'
  primary-button:
    background: '{colors.brand-primary}'
    foreground: '{colors.primary-inverse}'
    radius: '{rounded.sm}'
  focus-indicator:
    color: '{colors.focus-ring}'
    width: '3px'
---

# SMN — DESIGN.md

> **Statut : contrat UX validé le 21 octobre 2026.** La maquette de référence a été approuvée dans la conversation UX ; la capture originale n'est pas encore versionnée dans GitHub. Voir [MAQUETTE-REFERENCE.md](MAQUETTE-REFERENCE.md). Les chiffres et dates du visuel sont fictifs ; les dimensions et couleurs exactes du frontmatter restent des **propositions techniques à tester** contre les thèmes existants. Le contrat comportemental correspondant est [EXPERIENCE.md](EXPERIENCE.md), prioritaire avec ce document sur les illustrations.

## Brand & Style

SMN est un outil professionnel de pilotage Agile : il doit transmettre la **clarté**, la **fiabilité des chiffres**, la **rapidité d'accès** et la **calme maîtrise des situations à risque**. La référence retenue est une interface claire, dense mais aérée, dominée par un bleu professionnel, des surfaces blanches, des bordures fines et des repères colorés motivés par le sens métier.

Conserver l'esprit visuel de `maquette-reference-validee.png` : en-tête blanc, navigation latérale claire, zone Sprint aux tonalités bleu pâle, cartes de métriques séparées, quatre colonnes alignées et cartes opérationnelles compactes. Aucune décoration volumineuse ne doit prendre le pas sur les informations. Ne pas réintroduire le grand bandeau sombre disproportionné de l'ancienne page ni placer les tâches de configuration en premier.

**Héritage obligatoire :** React / Next.js / Bootstrap 5 et les thèmes/palettes SMN-24 déjà intégrés (clair/sombre ; ocean, forest, violet). La référence graphique montre la palette claire/ocean ; aucune décision n'abroge les autres combinaisons. Réutiliser d'abord les variables CSS existantes, avec uniquement les écarts nécessaires pour reproduire la structure. Les couleurs présentées dans le frontmatter sont indicatives et devront être rapprochées de `src/app/appearance.css`.

## Colors

| Jeton | Rôle visuel |
|---|---|
| `{colors.brand-primary}` | Navigation active, liens, commandes primaires et focus de hiérarchie |
| `{colors.text-primary}` / `{colors.text-secondary}` | Valeurs et libellés, sans gris trop pâle |
| `{colors.surface-page}` / `{colors.surface-card}` | Plan de travail et cartes, sans surfaces superposées illisibles |
| `{colors.surface-context}` | En-tête du cycle, suffisamment visible sans éclipser les métriques |
| `{colors.danger}` / `{colors.warning}` | Gravité justifiée : obstacles, risques, échéances critiques, pas embellissement |
| `{colors.info}` / `{colors.success}` | Information et résultat connu ; ne signifient jamais « performance bonne » sans règle métier |
| `{colors.focus-ring}` | Repère de navigation clavier visible dans tous les thèmes |

**Notes et alertes :** employer des **icônes différentes** et une **signalétique colorée différente**, accompagnées de libellés explicites. Exemple indicatif : icône de note en bleu et icône d'alerte en ambre/rouge selon sa sévérité. La couleur ne remplace jamais le type ou le statut en texte. Sur thème sombre, préférer les couleurs d'état sémantiques ajustées par la palette existante plutôt qu'un `#HEX` figé dans les composants.

Vérifier au minimum les contrastes des contenus et commandes selon la cible WCAG 2.2 AA lors de la recette ; **aucune conformité n'est attestée à ce stade**.

## Typography

- Hiérarchie courte : **nom du cycle** en titre principal, **objectif(s)** en texte immédiatement associé, valeurs numériques en typographie tabulaire, libellés courts et précis.
- Les unités restent visibles : **J/H**, **SP**, **tickets**, **jours ouvrés**. Pas d'abréviation ambiguë « réalisés » sous la capacité ; préférer « Capacité réelle ».
- Les longueurs FR/EN doivent pouvoir revenir à la ligne, particulièrement pour les objectifs et noms d'équipes ; ne pas tronquer une donnée essentielle sans accès à son intégralité.
- Les tokens `{typography.body.fontSize}`, `{typography.metric.fontSize}` et `{typography.countdown.fontSize}` sont des points de départ ; privilégier une lecture confortable à 100 % et à 200 % de zoom avant de les figer.
- Éviter les caractères « fantaisie » pour les pictogrammes : icônes cohérentes (SVG accessibles/masquées si décoratives), y compris dans les deux thèmes.

## Layout & Spacing

### Composition desktop approuvée

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Logo SMN       [Équipe ▼] [Sprint/Période ▼] [Recherche]  [Compte]       │
├──────────┬────────────────────────────────────────────────────────────────┤
│ Menu     │ En-tête Sprint : nom, dates, statut, objectif(s), fiche        │
│ latéral  │ [Capacité prévue/réelle] [SP engagés/réalisés] [Tickets]      │
│          │ [Jours ouvrés restants] [Indicateur additionnel si fondé]      │
│          ├────────────────────────────────────────────────────────────────┤
│          │ [Obstacles] [Risques] [Événements] [Notes / Alertes]          │
│          │  0–5 cartes  0–5 cartes  0–5 cartes  0–5 cartes              │
│          │  [+ Ajouter] [+ Ajouter] [+ Ajouter] [+ Ajouter]            │
└──────────┴────────────────────────────────────────────────────────────────┘
```

- **Pleine largeur** : utiliser tout l'espace de contenu disponible ; **pas de `max-width: 1510px`** limitant artificiellement le layout privé. Marges raisonnables via `{spacing.content-gutter}`.
- **Header** : sur 100 % de la largeur de la fenêtre. Équipe et Sprint/période immédiatement **à gauche du champ de recherche** en présentation desktop ; l'ordre est fixe même si l'espacement évolue. La zone recherche n'est interactive que si la recherche est réellement livrée.
- **Sidebar** : sous le header et sur toute la hauteur disponible. Largeur proposée `{spacing.sidebar-expanded}` déployée, `{spacing.sidebar-collapsed}` repliée. Icônes et infobulles accessibles en mode réduit ; aucune coupe de « À venir » ni des noms longs. Défilement interne seulement si nécessaire et sans masquer les commandes essentielles.
- **En-tête Sprint** : un bloc transversal de largeur 100 % du contenu ; titre/dates/objectif(s) clairement identifiables, éventuellement répartis en deux zones à grand écran. Les 4–6 cartes sont **immédiatement sous cet en-tête**, au sein du même ensemble visuel.
- **Cartes métriques** : trois premières cartes séparées horizontalement en deux sections par un fin filet : prévu/engagé en haut, réel/réalisé en bas. La carte jours ouvrés restants doit être visuellement plus saillante sans dépendre du rouge seul.
- **Colonnes inférieures** : quatre panneaux distincts de largeur égale quand l'espace le permet ; chacune contient un titre, un compteur des éléments éligibles, « Voir tout », jusqu'à cinq cartes et, à la fin de sa liste, « Ajouter ». Aucun défilement interne forcé pour ces listes.
- L'ordre des **cartes métriques** et celui des **quatre colonnes** sont personnalisables indépendamment. La zone d'en-tête du cycle et les composants de structure restent fixes. Les panneaux conservent une grille lisible après réordonnancement.

### Responsive proposé à vérifier

| Largeur utile du **contenu** | Suivi opérationnel | Métriques |
|---|---|---|
| Environ ≥ 1100 px | 4 colonnes | 4 à 6 cartes selon largeur |
| Environ 650 à 1099 px | 2 colonnes | 2 à 3 cartes par ligne |
| Environ < 650 px | 1 colonne | 1 ou 2 cartes par ligne selon lisibilité |

Ces seuils sont **des hypothèses techniques à tester** ; raisonner sur la largeur du conteneur (le menu développé réduit la largeur utile), pas uniquement sur le viewport. Sur petit écran, le menu devient un panneau accessible et les sélecteurs du header se réorganisent sans masquer le contexte.

## Elevation & Depth

Favoriser une **séparation par bordures et surfaces** plutôt que des ombres fortes. Cartes sur `{colors.surface-card}`, fond général `{colors.surface-page}`, en-tête Sprint sur `{colors.surface-context}`. Les ombres, si présentes, doivent être discrètes et rester cohérentes entre thèmes. Le focus est un contour de contrôle, non une ombre décorative.

## Shapes

Rayons modérés : `{rounded.xl}` pour le bloc Sprint, `{rounded.lg}` pour les cartes métriques et panneaux de colonnes, `{rounded.md}` pour les petites fiches et menus. Les pastilles de statut peuvent utiliser `{rounded.full}`. Ne pas multiplier les formes ou dégradés propres à chaque rubrique.

## Components

| Composant | Anatomie visuelle et règles |
|---|---|
| Header SMN | Logo + identité ; Équipe et Cycle avant Recherche ; aide, notifications et compte uniquement lorsque disponibles ; hauteur indicative `{spacing.header-height}` |
| Sélecteur équipe | Libellé explicite, sélection affichée, état mono-équipe sans suggestion de données fictives |
| Sélecteur cycle | Nom, dates accessibles et statut actif/clôturé ; focus visible ; capacité d'afficher le contexte d'un ancien cycle |
| Sidebar | Marqueur actif ; variantes étendue/rétractée ; label accessible aux icônes isolées ; pas d'animation indispensable |
| En-tête cycle | Nom, dates, objectif(s), statut ; lien de détail ; information « données corrigées » le cas échéant |
| Carte capacité | « Capacité prévue » haut, filet, « Capacité réelle » bas, unité J/H et taux optionnel correctement défini |
| Carte SP | « SP engagés » haut, filet, « SP réalisés » bas, unité SP |
| Carte tickets | « Tickets engagés » haut, filet, « Tickets réalisés » bas ; pas d'obligation de suivi des tickets individuels |
| Carte compteur | Chiffre saillant + libellé complet « jours ouvrés restants », état historique « Terminé le … » au lieu d'un décompte négatif |
| Carte additionnelle | Valeur métier justifiée uniquement ; **« avancement global » de l'illustration non retenu sans formule validée** |
| Panneau de colonne | En-tête avec icône + nombre d'éléments éligibles + « Voir tout » ; 0 à 5 fiches ; action Ajouter en pied |
| Carte d'élément | Titre, résumé, repère date/échéance, statut, gravité si fondée ; menu `…` identifiable ; texte intégral en détail |
| Note vs alerte | Symboles différents, libellés et tons distincts ; les alertes de configuration reçoivent un libellé « Configuration » |
| Mode organiser | Repères de déplacement et actions Enregistrer, Annuler, Réinitialiser ; accessible sans glisser-déposer |
| Carte développée | Contenu complémentaire dans la même surface, accès « Voir le détail » ; ne pas déclencher une mutation par expansion |

Les dimensions et couleurs chiffrées des composants sont **proposées pour validation d'implémentation**, non mesurées pixel par pixel sur la capture générée. Toute modification ultérieure de `DESIGN.md` devra distinguer un écart de réalisation d'un changement approuvé du design.

## Do's and Don'ts

| À faire | À éviter |
|---|---|
| Montrer les données métier et leur origine | Inventer des chiffres, un cycle ou un état pour remplir les cartes |
| Mettre l'échéance du cycle en évidence | Colorer toutes les cartes en rouge/vert pour suggérer une performance |
| Préserver les thèmes et palettes déjà livrés | Imposer une unique palette claire depuis la maquette |
| Placer l'alerte de configuration dans Notes/Alertes avec identification | La présenter comme un fait historique du Sprint précédent |
| Utiliser la totalité de la largeur utile | Conserver un conteneur étroit au centre d'un écran large |
| Différencier note, alerte, risque, obstacle par texte + icône | Reposer uniquement sur un code couleur |
| Reproduire la hiérarchie de la maquette approuvée | Reproduire ses noms, événements et chiffres fictifs |
| Maintenir focus, zoom et menus accessibles | Créer un glisser-déposer obligatoire ou un scroll horizontal forcé |

### Références et décisions restantes

- Image de référence jointe : [description de la maquette approuvée](MAQUETTE-REFERENCE.md).
- Comportements, limitations historiques, éléments vides et parcours : [EXPERIENCE.md](EXPERIENCE.md).
- **À valider avant implémentation des tokens** : mapping sur les CSS Bootstrap/SMN-24, tailles exactes de header/sidebar, seuils de conteneur et contraste réel en thème sombre.
- **Interdit sans nouvel accord métier** : un score « avancement global » calculé par une formule implicite, un indicateur d'efficacité individuelle ou un classement comparant des Story Points d'équipes distinctes.

### Décisions métier visuelles consolidées — 21/10/2026

- **Compteur** : afficher « jours ouvrés restants » sur la base d'une semaine **du lundi au vendredi**, sans intégrer automatiquement jours fériés, fermetures et calendrier individuel au sens « J/H ». Inclusion du jour courant et fuseau : points de calcul à confirmer avant implémentation.
- **Engagements initiaux** : les demi-cartes supérieures « Story Points engagés » et « Tickets engagés » montrent les valeurs **initialement engagées**, jamais un périmètre révisé à leur place. Afficher séparément les valeurs réalisées du cycle.
- **Pas de carte « Avancement global »** : la maquette originale contient une carte illustrative qui est **explicitement exclue** tant qu'aucune règle métier n'a été validée. Un remplacement éventuel par des raccourcis fera l'objet d'une décision ultérieure.
- **Historique incomplet** : si aucune donnée du cycle choisi n'est disponible, afficher « Aucun éléments à ce jour » (libellé demandé), sans faux zéro ni copie de l'état courant. L'équipe produit pourra ultérieurement vérifier la forme orthographique du libellé dans les catalogues FR/EN.


## Extension visuelle approuvée — 23 octobre 2026 : bandeau Sprint compact (lot 1)

La comparaison utilisateur des captures PJ1 (état après raccordements) et PJ2 (cible) valide le choix d'un **bandeau Sprint beaucoup moins haut**. Conserver les tokens de palette Bootstrap/SMN sans copier les couleurs figées de la maquette.

- Trois zones sur grand écran : identité / dates / statut ; objectif du Sprint avec cible Bootstrap Icons ; lien d'action « Voir le détail du sprint » avec flèche Bootstrap Icons.
- Supprimer les espaces et paragraphes explicatifs redondants dans le bloc Sprint. Valeurs réelles uniquement, sans « J+N », progression ou badge chiffré fictif.
- Les icônes utilisées proviennent des SVG **Bootstrap Icons officiels**, embarqués localement via `src/app/app/bootstrap-icon.tsx` ; notice MIT dans `docs/third-party/bootstrap-icons-LICENSE.md`.
- Dans la liste d'objectifs, conserver la source réelle et montrer une synthèse courte ; si plusieurs objectifs, indiquer le nombre additionnel et ouvrir la fiche complète. Ne pas prétendre qu'un objectif est « principal » sans propriété métier.
- Repli CSS à **950 puis 650 px de largeur du conteneur**, pas de défilement horizontal ; bouton actif accessible au clavier et utilisable sur mobile.
- **Lot 1 seulement** : ne pas modifier les cartes KPI et les colonnes Obstacles/Risques/Événements/Notes dans cette livraison.
- Spécification et critères : `_bmad-output/implementation-artifacts/refonte-ux-dashboard-lot1-entete-sprint-2026-10-23.md`.


## Extension visuelle du 23 octobre 2026 — Lot 2 : cartes KPI

- Conserver la grille de **quatre** cartes (4 desktop / 2 tablette / 1 mobile), mais hiérarchiser : pictogramme Bootstrap Icons + titre, valeur initiale typographiquement dominante, séparateur discret, puis valeur réalisée et source.
- Icônes officielles embarquées : `people-fill` pour capacité, `stack` pour Story Points, `ticket-perforated-fill` pour tickets, `calendar-event` pour jours ouvrés. Tracés locaux sous licence MIT, pas de police ni CDN supplémentaires.
- Anneaux de comparaison **neutres** dans les trois cartes de paires uniquement si ratio fiable ; ne pas utiliser rouge/vert comme verdict de performance. Ne pas fabriquer de pourcentage sur source absente ou valeur initiale nulle.
- Le texte du ratio peut dépasser 100 % sans tronquer la vérité ; seule la surface de l'anneau est bornée visuellement. Il faut toujours un libellé accessible précisant la division effective.
- Compteur jours ouvrés fortement lisible, mais sans alerte d'urgence basée sur un seuil non validé ; le statut temporel et la convention métier existante restent visibles.
- Préserver les unités, la provenance, les 3 palettes et les thèmes sombre/clair ; garder les couleurs sémantiques de SMN au lieu d'imposer PJ2 pixel pour pixel.
- Aucune carte « Avancement global » fictive, aucune régression dans le bandeau Sprint compact du lot 1.
- Dossier de réalisation : `_bmad-output/implementation-artifacts/refonte-ux-dashboard-lot2-cartes-kpi-2026-10-23.md`.


## Extension visuelle du 23 octobre 2026 — Lot 4 : cartes qualitatives et priorités

- Les trois panneaux **Obstacles**, **Risques**, **Notes / Alertes** utilisent des cartes compactes sans longueur minimale factice, avec type de fiche, titre et statut quand une source persistée est disponible.
- Chaque fiche réellement affichée comporte un **point de priorité** rouge (élevée), ambre (moyenne), vert (faible) ou neutre (non évaluée). Le texte du niveau doit toujours rester visible : la couleur seule n'est pas une information accessible.
- Pictogrammes Bootstrap Icons locaux : `exclamation-octagon-fill` pour obstacle, `exclamation-triangle-fill` pour risque, `sticky-fill` pour note, `bell-fill` pour alerte ; le type apparaît également en texte.
- Maximum cinq fiches par colonne, grille 4/2/1, palettes SMN, thèmes clair/sombre ; compteur exact uniquement si une source fiable le fournit.
- Les cartes ne sont **pas** simulées tant que les producteurs Epic 5 ne sont pas livrés. L'indisponibilité conserve ses textes et ses actions désactivées. Les liens et actions réels relèvent de SMN-238, sans raccourci vers une route fictive.
- Cette réalisation ne crée ni norme métier de priorité pour les notes et obstacles, ni SQL, ni cliché historique Vn. Voir `_bmad-output/implementation-artifacts/refonte-ux-dashboard-lot4-priorites-2026-10-23.md`.
