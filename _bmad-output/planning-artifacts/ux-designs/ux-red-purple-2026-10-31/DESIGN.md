---
name: SMN — Palette Red & Purple
status: approved-ux
updated: 2026-10-31
description: Contrat visuel de la quatrième palette SMN, à valider avant implémentation.
sources:
  - docs/UX-REFERENTIEL-BMAD.md
  - docs/APPARENCE-SMN-24.md
  - src/app/appearance.css
colors:
  brand-red: '#E31937'
  brand-purple: '#5236AB'
  magenta: '#7E1B4C'
  red-deep: '#650A21'
  red-mid: '#991F3D'
  red-soft: '#FF7362'
  purple-deep: '#200A58'
  purple-mid: '#6E3FED'
  purple-soft: '#9E83F5'
  chart-green: '#128254'
  chart-amber: '#F1A425'
  chart-burgundy: '#B00020'
  light-page: '#F7F5FA'
  light-card: '#FFFFFF'
  light-text: '#17243B'
  dark-page: '#15121D'
  dark-card: '#252030'
  dark-text: '#F4F0FA'
typography:
  body:
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
    lineHeight: '1.5'
rounded:
  card: '12px'
  banner: '14px'
spacing:
  rhythm: 'Bootstrap 5.3 utilities unchanged'
components:
  context-banner:
    appearance: 'Gradient red to purple, foreground white; text legibility tested throughout'
  navigation-active:
    appearance: 'Red accent with light red/pink subtle fill; dark mode contrast adjusted'
  primary-button:
    appearance: 'Solid accessible red; gradient optional for decorative hero only'
  metric-card:
    appearance: 'Neutral surface; accents red or purple according to information hierarchy'
---
# DESIGN — Red & Purple

## Brand & Style
Quatrième palette globale, identifiant technique proposé `red-purple` ; **rouge dominant**, violet secondaire. Elle complète sans remplacer `ocean`, `forest`, `violet`. Une combinaison avec `light` ou `dark` doit être entièrement prise en charge. L'écran conserve le référentiel Cockpit Agile (largeur, typographie, zones, densité, composants, responsive).

## Colors
### Couleurs issues de la pièce jointe
- Rouge `#E31937`, violet `#5236AB` ; blanc `#FFFFFF`, noir `#000000`.
- Échelles violettes `#200A58`, `#5236AB`, `#6E3FED`, `#9E83F5`, `#BFB5F9`, `#CBC3E6`, `#E6E3F3`.
- Échelles rouges `#650A21`, `#991F3D`, `#E31937`, `#FF6A00`, `#FF7362`, `#FF978A`, `#FFCDD2`.
- Gris `#000000`, `#333333`, `#555555`, `#777777`, `#999999`, `#CCCCCC`, `#EEEEEE`.
- Magenta `#7E1B4C`, `#A82465`, `#CB7CA3`.
- **Couleurs réservées aux visualisations de données** : `#128254`, `#F1A425`, `#B00020` ; ne pas les utiliser arbitrairement comme états ou actions.

### Deux modes proposés — valeurs à confirmer par contrôle du contraste
| Token métier | Clair | Sombre |
|---|---|---|
| page | `#F7F5FA` | `#15121D` |
| surface | `#FFFFFF` | `#252030` |
| texte | `#17243B` | `#F4F0FA` |
| marque rouge | `#E31937` | `#FF7387` |
| accent violet | `#5236AB` | `#B9A5FF` |
| bannière | dégradé `#E31937 → #5236AB` | dégradé `#991F3D → #35206C` |

La palette ne réécrit pas les couleurs sémantiques de statuts (succès, avertissement, erreur, information) en rouge/violet systématiques. Les états doivent conserver un libellé et un symbole distincts.

## Typography
Héritage intégral Bootstrap/SMN ; chiffres, unités et labels métier inchangés. Contrastes WCAG 2.2 AA à vérifier : 4,5:1 pour texte normal, 3:1 pour gros texte et composants pertinents. Ne pas supposer qu'un texte blanc est accessible sur toute couleur de la pièce jointe.

## Layout & Spacing
Ne rien modifier à la grille, au header, à la sidebar, aux tableaux, filtres, fiches, modales, formulaires ou colonnes de Cockpit Agile. Espacement et responsive hérités des contrats UX SMN existants.

## Elevation & Depth
Cartes et sections neutres, bordures fines, ombres discrètes ; réserver le dégradé à l'en-tête contextuel afin de préserver la lisibilité des tables denses.

## Shapes
Hériter des arrondis, pastilles, contrôles et focus visibles de SMN. Aucun changement géométrique.

## Components
- **Bandeaux** : rouge en entrée de dégradé, violet en sortie, textes blancs vérifiés sur toute la longueur.
- **Navigation** : icônes et état actif rouges, fond actif teinté ; ne pas confondre sélection et erreur.
- **Actions** : action primaire rouge accessible ; secondaire violette accessible ; aucun style de bouton déduit exclusivement de l'état métier.
- **Indicateurs** : alternance raisonnée rouge/violet pour familles fonctionnelles, couleurs sémantiques pour résultats ; neutralité des valeurs chiffrées.
- **Tableaux/filtres/modales** : couleurs de marque sur sélection/focus/commandes uniquement, fonds neutres.
- **Graphiques** : séries choisies parmi les échelles de la pièce jointe et couleurs data, avec légendes, labels, motifs si nécessaire ; contrastes sur tous les fonds.

## Do's and Don'ts
- **Faire** : ajouter une palette opt-in, garder les trois historiques inchangées ; couvrir light et dark ; tester les états actifs/inactifs, hover, focus, erreurs, désactivés.
- **Ne pas faire** : utiliser des couleurs data pour la gravité métier sans règle ; appliquer un gradient sur toutes les cartes ; changer les chiffres, données ou statuts.
- **Ne pas faire** : considérer les maquettes générées comme spécification de nouvelles colonnes, nouvelles métriques ou nouveaux libellés ; elles illustrent uniquement l'apparence.

## Validation
**À valider** : teinte exacte des variantes sombres, contraste des bannières et boutons, accessibilité au clavier, audit des composants avec couleurs CSS codées en dur. Aucun test visuel ni validation WCAG automatisée exécuté ici.


## Avenant validé — variante sombre Anthracite & Red Purple (31 octobre 2026)
**Décision utilisateur :** la direction A « Anthracite & Red Purple » est validée à partir des trois maquettes correspondant au Tableau de bord, à Équipe et à Sprints de l'équipe. La variante claire Red & Purple reste dans le périmètre de cette quatrième palette. Les trois palettes existantes ne doivent subir aucun changement.

**Hiérarchie visuelle obligatoire :** fond anthracite presque noir, panneaux légèrement plus clairs, textes blanc cassé, rouge dominant pour action principale et navigation active, violet lavande pour liens/actions secondaires et certains accents de métriques. Les bandeaux contextuels utilisent un dégradé rouge profond → violet profond ; **ni le dégradé ni une couleur de graphique ne doivent encoder seuls un statut métier**.

**Tokens de départ approuvés comme orientation, valeurs CSS exactes soumises aux tests de contraste :**
| Rôle | Valeur cible |
|---|---|
| Page sombre | `#15161B` |
| Surface carte sombre | `#24252D` |
| Texte principal sombre | `#F4F3F6` |
| Texte secondaire sombre | `#C7C2D4` |
| Rouge marque | `#E31937` |
| Violet accent sombre | `#B9A5FF` |
| Bandeau sombre | `#991F3D` → `#35206C` |

**Priorité documentaire :** ces tokens remplacent, pour la variante sombre, les valeurs provisoires `#15121D`, `#252030` et `#F4F0FA` proposées plus haut. Les autres couleurs demeurent candidates jusqu'à contrôle WCAG, notamment les boutons sur rouge, la lisibilité du bandeau sur toute sa longueur, les liens et les champs à focus. Les maquettes validées expriment le style ; les contenus inventés ou les écarts d'étiquettes ne sont pas des demandes fonctionnelles.

**Périmètre :** thème clair et sombre, toutes les pages SMN, composants Bootstrap, Cockpit Agile, cartes, tableaux, formulaires, modales, états actifs, survol/focus/désactivés, indicateurs et graphiques. La géométrie et les règles UX existantes ne changent pas.

**Statut :** direction esthétique validée ; conformité WCAG, rendu CSS et recette Windows non attestés.
