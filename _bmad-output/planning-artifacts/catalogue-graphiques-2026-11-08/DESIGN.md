---
title: "SMN — Catalogue graphique Office — DESIGN"
status: "proposed"
date: "2026-11-08"
colors:
  brand: "var(--smn-brand)"
  background: "var(--smn-surface)"
  text: "var(--smn-foreground)"
  border: "var(--smn-border)"
  heading: "var(--smn-heading)"
typography:
  family: "inherit (SMN Cockpit Agile)"
rounded:
  panels: "15px"
  hero: "16px"
spacing:
  base: "8px"
components:
  surface: "smn-panel"
  button: "Bootstrap / SMN"
---
# DESIGN — Paramètres / Rapports / Graphiques

## Brand & Style
Reprendre les tokens et la hiérarchie du Cockpit Agile existant : bandeau d'identité sobre, surfaces blanches, cartes structurées et actions regroupées. Ne pas imposer un thème graphique au *document généré* : l'identité de l'écran et la palette du style exporté sont indépendantes.

## Colors
Les tokens CSS réels de SMN font autorité (`--smn-brand`, `--smn-surface`, `--smn-foreground`, `--smn-border`, `--smn-heading`). Le sélecteur de palette permet de distinguer le thème de l'application des couleurs exportées. Contrastes AA requis pour les textes de l'éditeur.

## Typography
Conserver les titres et tailles du référentiel UX ; hiérarchie claire : page → groupes → champs → aide. Nom de chaque propriété et exemple ; pas de code technique affiché sauf dans l'onglet d'intégration Office.

## Layout & Spacing
- Desktop : disposition 35 % liste / 65 % édition et prévisualisation ; panneau rétractable ou empilé sous tablette.
- Carte du style sélectionné : nom, type, statut (prédéfini/personnalisé/défaut), aperçu miniature explicite.
- Éditeur : deux zones « Options communes » et « Options par type » ; sous-panneaux pliables.
- Actions « Enregistrer » et « Annuler » toujours visibles en bas ; « Actualiser l'aperçu » près de l'aperçu.

## Elevation & Depth
Ombre discrète ; surfaces délimitées principalement par bordure et espacement. Les zones d'aperçu non actualisées restent distinctes des données persistées.

## Shapes
Radius cohérents avec Cockpit Agile ; boutons et champs respectent les cibles tactiles du projet. Éviter de surcharger l'écran de contrôles simultanés.

## Components
- Catalogue filtrable (type/nom/prédéfinis-personnalisés) ; menu de style avec dupliquer, renommer, supprimer selon droits.
- Carte « défaut par type » et bouton « Définir par défaut ».
- Éditeur : palette couleur, texte, taille, interrupteur, liste déroulante et aide par option.
- Aperçu : zone SVG rendue en PNG via une action manuelle, données de démonstration ; retour sur erreur dans l'encart.
- Panneau d'intégration Office : tag généré, bouton Copier, rappel des priorités.

## Do's and Don'ts
- Faire : une action visible par intention, sauvegarde explicite, indication des changements non enregistrés.
- Éviter : boutons décoratifs sans action, génération à chaque saisie, surcharges de paramètres inapplicables, données fictives présentées comme données réelles.
- Les maquettes HTML associées servent de support de discussion ; **DESIGN et EXPERIENCE prévalent** sur les détails illustratifs.
