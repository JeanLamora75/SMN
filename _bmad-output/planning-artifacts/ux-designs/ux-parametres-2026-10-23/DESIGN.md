---
name: SMN — Centre de paramètres
status: final
updated: 2026-10-23
description: Contrat visuel validé pour le centre Paramètres en cartes/liste.
sources:
  - https://github.com/JeanLamora75/SMN/blob/main/docs/UX-REFERENTIEL-BMAD.md
  - https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-equipe-membres-2026-10-22/DESIGN.md
colors:
  primary: 'inherit:appearance/brand-primary'
  surface: 'inherit:appearance/surface-page'
  card: 'inherit:appearance/surface-card'
  border: 'inherit:appearance/border-subtle'
  muted: 'inherit:appearance/neutral-muted'
  foreground: 'inherit:appearance/text-primary'
  secondary: 'inherit:appearance/text-secondary'
typography:
  base: 'inherit:system-ui / Segoe UI'
  sectionTitle: 'inherit:existing-hierarchical-headings'
  cardTitle: 'inherit:existing-smn-card-heading'
rounded:
  card: '12px'
  panel: '12px'
spacing:
  pageGutter: 'inherit:smn-page-gutter'
  gridGap: '12px'
  cardPadding: '14px'
components:
  settings-switcher: 'two icon actions grid/list, top-right, mutually exclusive'
  settings-tile: 'icon, heading, short description, actionable only if destination active'
  settings-row: 'same content and status as tile, in one horizontal row'
  settings-group: 'four labelled groups with accessible headings'
---

# DESIGN.md — Centre Paramètres SMN

**Décisions visuelles validées le 23/10/2026.** Ce fichier définit l'apparence ; [EXPERIENCE.md](EXPERIENCE.md) définit le comportement. Ces contrats prévalent sur les maquettes illustratives. Aucun test ni recette attesté.

## Brand & Style

Conserver le système visuel SMN actuel (Next.js, Bootstrap, couleurs et typographie existantes) et la convention Cartes/Liste déjà approuvée pour Équipe. Cette page est un **accueil de navigation et de configuration**, pas un formulaire géant.

## Colors

- Fonds, cartes, séparateurs, bordures et textes utilisent les tokens SMN, compatibles clair/sombre et trois palettes existantes.
- Le sélecteur de vue montre un seul mode actif. L'état actif est perceptible autrement que par la couleur.
- Les rubriques indisponibles doivent être distinguées par un état et un texte, pas seulement par une couleur.

## Typography

Titre « Paramètres », sous-titre « Configuration de l'application », titres des quatre familles de niveau inférieur. Une carte présente un **titre court**, une **description de son usage** et éventuellement un **état de disponibilité** discret.

## Layout & Spacing

1. **Sidebar rétractable de gauche** : entrée « Paramètres » avec engrenage, conservée dans la navigation principale lors des états déplié/replié.
2. **Pleine largeur du contenu** à droite de la sidebar ; supprimer le plafond de 900 px actuellement posé sur la page générale lorsqu'il limite la nouvelle page d'accueil.
3. **Deux icônes en haut à droite** : vue Cartes (grille), vue Liste (lignes). Modes mutuellement exclusifs.
4. **Vue Cartes** : 4 cartes par rangée sur grand desktop ; recommandation responsive **2 colonnes tablette, 1 colonne mobile**. Hauteur des cartes harmonisée au sein d'une rangée, 12–16 px d'espacement indicatif, sans valeur pixel-perfect imposée.
5. **Vue Liste** : même ordre, mêmes regroupements et mêmes contenus ; chaque rubrique occupe une ligne lisible, avec icône, intitulé, description, éventuel état et chevron si lien actif.
6. **Quatre sections** clairement séparées, dans l'ordre de la proposition approuvée, sans tuile fictive pour compléter artificiellement une rangée de trois cartes.

~~~text
┌───────────────┬──────────────────────────────────────────────────────────┐
│ Navigation    │ Paramètres                         [▦][☷]              │
│ ...           │ Configuration de l'application                        │
│ ⚙ Paramètres  │ Application et personnalisation                       │
│               │ [Général]   [Langues]   [Apparence]                     │
│               │ Organisation Agile                                    │
│               │ [Cadence]   [Cérémonies] [Capacité]                     │
│               │ Calendriers et indisponibilités                       │
│               │ [Ouvrés]    [Pays]      [Fermetures] [Absences]        │
│               │ Administration et maintenance                        │
│               │ [Comptes]   [Sécurité]  [Sauvegardes] [Audit]          │
└───────────────┴──────────────────────────────────────────────────────────┘
~~~

Ce schéma décrit les **14 rubriques** ; il ne garantit pas l'existence des 14 écrans fonctionnels.

## Elevation & Depth

Fond de carte subtil, accentuation au hover/focus seulement si la destination est réelle et accessible. Ne jamais faire paraître cliquable un service inexistant.

## Shapes

Cartes à coins arrondis cohérents avec SMN, icône à proximité du titre, padding constant, libellés lisibles à 200 % de zoom et sur mobile.

## Components

- **Carte active** : toute la carte est actionnable via clic/Enter, même destination depuis la ligne correspondante.
- **Ligne active** : toute la ligne est actionnable, sans bouton inutile.
- **Carte planifiée mais non livrée** : parmi les 14 rubriques approuvées, garder un état lisible « À venir » ou « À compléter », sans lien mort ni faux bouton. Le statut se détermine depuis un **registre explicite des rubriques**, pas par un lien inventé.
- **Intégrations externes** et **Notifications** : ne pas afficher dans le MVP ; ces deux rubriques ont été évoquées pour plus tard seulement.
- Les icônes sont issues du set disponible : engrenage (Général), langues, palette, minuteur, réunions, graphique, calendrier, globe, fermeture, catégories, utilisateurs, bouclier, sauvegarde, audit.

## Do's and Don'ts

**Faire :** utiliser toute la largeur, des cartes lisibles, des sections logiques, une préférence Cartes/Liste mémorisée, une navigation retour claire, les droits et traductions existants.

**Ne pas faire :** mélanger cartes et lignes, transformer le centre en page CRUD monolithique, créer des doublons de paramètres, ouvrir des pages fictives, déplacer les pages opérationnelles Sprint/Équipe/Calendrier dans Paramètres, exposer un écran administratif aux comptes sans droits.

**Référence de recette :** [RECETTE-UX.md](RECETTE-UX.md).