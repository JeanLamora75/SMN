---
name: "SMN — Paramètres V2 : réorganisation en six familles"
status: "final-ux-sous-reserve-recette"
updated: 2026-11-10
owner: "Sally — UX Designer BMAD v6.12.4"
sources:
  - "https://github.com/JeanLamora75/SMN/blob/main/docs/UX-REFERENTIEL-BMAD.md"
  - "https://github.com/JeanLamora75/SMN/blob/main/src/lib/settings-catalog.ts"
  - "https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/settings/settings-catalog-view.tsx"
colors:
  primary: "inherit:appearance/brand-primary"
  page: "inherit:appearance/surface-page"
  card: "inherit:appearance/surface-card"
  text: "inherit:appearance/text-primary"
  textSecondary: "inherit:appearance/text-secondary"
  border: "inherit:appearance/border-subtle"
  focus: "inherit:existing-visible-focus-ring"
typography:
  base: "inherit:system-ui / Segoe UI"
  title: "inherit:existing-smn-page-title"
  group: "inherit:existing-hierarchical-headings"
  itemTitle: "inherit:existing-smn-card-heading"
rounded:
  tile: "inherit:smn-panel-rounded-4"
  search: "inherit:form-control"
spacing:
  gutter: "inherit:smn-page-gutter"
  groupGap: "24px minimum indicative"
  gridGap: "12–16px indicative"
  cardPadding: "14–16px indicative"
components:
  settings-search: "visible text input with search icon, clear action and live result count"
  settings-switcher: "existing exclusive cards/list icons, accessible pressed state"
  settings-category: "semantic titled section, no empty category"
  settings-entry: "one semantic link per canonical feature, icon + heading + description + status"
  settings-status: "short secondary text; never clickable unless real destination exists"
---

# DESIGN.md — Portail Paramètres V2, Cockpit Agile

**Décision explicite validée par l'utilisateur le 10/11/2026 : six familles et recherche transversale.** Ce contrat définit le **visuel** de la refonte. [EXPERIENCE.md](EXPERIENCE.md) fait autorité sur les comportements ; [CATALOGUE-ET-ROUTES.md](CATALOGUE-ET-ROUTES.md) sur les destinations. Aucun code modifié ni recette navigateur exécutée par Sally. Les documents du 23/10/2026 restent historiques ; leur contrainte « quatre familles / quatorze rubriques » est **remplacée pour le portail** par ce contrat, sans remettre en cause leurs autres invariants.

## Brand & Style

- Préserver **Cockpit Agile** : largeur fluide à droite de la sidebar, surfaces `smn-panel`, Bootstrap, tokens existants, contraste et palettes appliqués par SMN. L'écran est un **sommaire actionnable**, jamais une page avec des formulaires intégrés.
- Hiérarchie stable : titre « Paramètres », sous-titre « Configurez votre environnement de travail », barre de recherche au-dessous, bascule Cartes/Liste alignée en haut à droite, puis sections selon l'ordre métier validé.
- Visibilité continue des six familles sans système d'accordéon par défaut ; l'utilisateur comprend immédiatement où se trouve chaque domaine. Aucun sous-menu ajouté dans la sidebar.

## Colors

- Les fonds, bordures, titres, liens et icônes héritent des tokens `{colors.page}`, `{colors.card}`, `{colors.border}`, `{colors.text}`, `{colors.primary}` ; respecter **toutes** les palettes disponibles (ne pas figer de rouge/bleu CSS).
- État indisponible/partiel exprimé textuellement, pas seulement par opacité ni couleur. « À venir » = absence d'action ; « À compléter » = accès partiellement opérationnel si la destination réelle existe.
- Le mode actif Cartes/Liste est identifiable par `aria-pressed`, forme et style, pas la couleur seule. Focus conforme à `{colors.focus}`.

## Typography

- H1 unique « Paramètres ». Six H2 identifiables et espacés. H3 ou titre sémantique à l'intérieur de chaque carte. Paragraphes concis, une idée utile par description (une ou deux lignes idéalement).
- Densité suffisamment compacte pour éviter une page de dizaines de grandes cartes vides, sans sacrifier la lisibilité à 200 % de zoom.
- Titres, descriptions et statuts centralisés en `src/i18n/fr.json` et `en.json` ; pas de français codé en dur dans le composant.

## Layout & Spacing

```text
Sidebar         PARAMÈTRES                               [Cartes] [Liste]
                Configurez votre environnement de travail
                [⌕ Rechercher un paramètre…                 × ]
                x rubriques trouvées (seulement après recherche)

                Application et personnalisation
                [Informations générales] [Langues] [Apparence]

                Organisation et équipes
                [Équipes] [Entreprises] [Cadence des sprints]

                Pratiques et référentiels Agile
                [Cérémonies et modèles] [Règles de capacité]
                [Indicateurs] [Registres] [Liens]

                Calendriers et disponibilités
                [Jours et horaires ouvrés] [Pays et jours fériés]
                [Fermetures d'entreprise] [Catégories d'absences]

                Rapports et visualisation
                [Styles de graphiques]

                Administration et maintenance
                [Utilisateurs et habilitations] [Sécurité et sessions]
                [Maintenance (Mises à jour, Sauvegardes, Audit)]
```

Le schéma est **conceptuel**, pas une maquette de l'application installée. Les 19 **entrées canoniques** proposées représentent les fonctionnalités identifiées, et non 19 nouveaux écrans. Les rubriques réellement visibles dépendent des droits, du mode et de la disponibilité. « Maintenance » est **une seule carte**, qui mène aux onglets déjà existants ; recherche par mots-clés « mises à jour », « sauvegardes », « audit ». Les familles restent dans cet ordre même en cas de filtrage.

- Vue Cartes : 4 colonnes sur grand écran si l'espace réel le permet ; 2 en tablette et 1 en mobile ; Bootstrap ou CSS Grid responsive **fondé sur largeur disponible**, pas largeur brute de fenêtre. Éviter le défilement horizontal.
- Vue Liste : une ligne pleine largeur par entrée, icône à gauche, intitulé et description, statut et chevron si active ; même ordre et mêmes libellés que Cartes.
- Ne jamais créer de carte fantôme pour équilibrer les lignes.
- Le contrôle de recherche occupe la largeur de lecture utile ; bascule de vue visible sans nécessité de scroller.

## Elevation & Depth

- `smn-panel` léger ; au hover/focus d'une destination **active**, légère accentuation de bordure/ombre selon les tokens existants, jamais une animation perturbante.
- Pas d'effet hover indiquant un clic sur les rubriques non opérationnelles.
- Éviter les badges colorés répétés « Disponible » sur chaque tuile : état neutre discret dans le texte si utile, priorité à l'action.

## Shapes

- Réutiliser les coins arrondis `rounded-4` et les classes standard. Icône alignée avec titre et bloc descriptif.
- Garder des hauteurs cohérentes par rangée en Cartes et un rythme vertical régulier en Liste, sans hauteur fixe tronquant une traduction anglaise longue.
- Champ de recherche à bordure clairement visible, libellé persistant pour accessibilité et bouton Effacer identifiable au clavier.

## Components

### Carte/Ligne unique

Anatomie : **icône Bootstrap** → titre → phrase orientée tâche → mention éventuelle de l'état. Toute la surface est un `Link` si et seulement si la vraie route existe et que l'accès est autorisé ; sinon `article/div` non interactif. Il ne faut ni nested links ni multiples boutons sur une même tuile.

### Icônes homogènes

Réutiliser le composant `BootstrapIcon` déjà présent dans SMN et le catalogue d'icônes supportées. Recommandations sémantiques (à valider contre les identifiants réels du catalogue avant implémentation) :

| Famille | Idées d'icônes |
|---|---|
| Application | gear, translate, palette |
| Organisation | people, building, calendar-range |
| Pratiques Agile | calendar-event, speedometer, graph-up, journal-text, link-45deg |
| Calendriers | clock, globe, calendar2-week, calendar-x |
| Rapports | bar-chart-line |
| Administration | person-lock, shield-lock, database-check |

Aucune police d'icônes externe ni téléchargement supplémentaire.

### Recherche

- À gauche : icône loupe ; champ avec texte d'aide « Rechercher un paramètre… ». Effacer à droite si non vide.
- Ne pas confondre recherche dans le **catalogue** et recherche des données propres aux écrans (liens, entreprises, utilisateurs).
- État vide : texte court, non alarmiste ; bouton « Effacer la recherche ».
- Les expressions trouvées ne doivent pas imposer un surlignage qui altère les contrastes des thèmes.

## Do's and Don'ts

**Faire :** six domaines compréhensibles, entrée unique par fonctionnalité, recherche réellement filtrante, Cartes/Liste mémorisés, aucun changement métier, FR/EN, navigation clavier et toutes palettes.

**Ne pas faire :** ajouter des fonctions non livrées pour remplir la grille ; déplacer les opérations de sprint/équipe/calendrier ; rendre la carte « règles de capacité » faussement cliquable ; dupliquer Fermetures, Styles de graphiques ou Indicateurs à deux endroits ; modifier la page de paramètres sans préserver `settings-form.tsx` et ses brouillons.

## Hors périmètre visuel

La page ne crée pas de nouvelles capacités, de nouveaux rapports, ni de nouvelle console d'administration. L'écran « Paramètres » ne remplace pas les pages métier opérationnelles. Les anciennes routes restent compatibles.
