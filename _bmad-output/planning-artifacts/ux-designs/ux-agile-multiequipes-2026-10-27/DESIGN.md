---
name: "SMN — Modes Scrum/Kanban par équipe — Avenant Cockpit Agile"
description: "Contrat visuel ciblé pour la configuration du mode Agile et l'archivage des équipes."
status: final
updated: 2026-10-27
sources:
  - "docs/UX-REFERENTIEL-BMAD.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-equipe-cockpit-2026-10-26/DESIGN.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-parametres-2026-10-23/DESIGN.md"
  - "_bmad-output/planning-artifacts/briefs/agile-par-equipe-2026-10-27/BRIEF-PRODUIT.md"
  - "https://lmn24.atlassian.net/browse/SMN-287"
colors:
  brand: "var(--smn-brand)"
  surface: "var(--smn-surface)"
  foreground: "var(--smn-foreground)"
  muted: "var(--smn-muted)"
  border: "var(--smn-border)"
typography:
  body:
    fontFamily: "system-ui, Segoe UI, sans-serif"
    fontSize: "inherit:SMN"
  field-label:
    fontFamily: "inherit:SMN"
    fontWeight: "600"
rounded:
  panel: "15px"
  card: "12px"
  badge: "9999px"
spacing:
  page-gutter: "16px to 24px"
  panel-gap: "16px"
  control-gap: "12px"
components:
  agile-mode-indicator:
    foreground: "{colors.foreground}"
    background: "{colors.surface}"
    border: "{colors.border}"
    radius: "{rounded.badge}"
  team-settings-panel:
    background: "{colors.surface}"
    border: "{colors.border}"
    radius: "{rounded.panel}"
---

# DESIGN.md — SMN-287 — Mode Agile par équipe

**Statut : final sur le plan UX, après validation des décisions UX-01 à UX-04.**
**Portée :** contrat d'apparence, complément des contrats Cockpit Agile approuvés. N'atteste aucun développement ni test.
**Document pair :** [EXPERIENCE.md](./EXPERIENCE.md), qui définit les comportements et les autorisations.

## Brand & Style

Reprendre intégralement l'identité **Cockpit Agile — Option A** déjà validée : bandeaux bleu marine existants, panneaux sobres, cartes compactes et contrôles Bootstrap/SMN. Le mode Scrum/Kanban est une information de contexte, non une nouvelle identité graphique. Éviter la création d'une page ou d'une modale supplémentaire pour la configuration de l'équipe.

## Colors

Toutes les couleurs dépendent des variables SMN et du thème actif : `{colors.brand}`, `{colors.surface}`, `{colors.foreground}`, `{colors.muted}`, `{colors.border}`. Conserver les thèmes clair/sombre et palettes existantes. Un badge doit toujours contenir « Scrum » ou « Kanban » en toutes lettres ; ne pas associer un mode exclusivement à une couleur. « Archivée » est représenté par une indication textuelle neutre ; un cadenas accompagné de texte signale un mode verrouillé. Les confirmations et erreurs utilisent les styles existants, avec distinction par texte et icône.

## Typography

Conserver la hiérarchie existante : un seul h1 par page, h2 pour les panneaux et labels de formulaire associés à leur contrôle. Rester compact, mais ne jamais tronquer définitivement le nom de l'équipe, les messages d'état ou la raison du verrouillage. Privilégier des libellés accessibles en FR/EN : « Mode Agile », « Scrum », « Kanban », « Active », « Archivée », « Archiver », « Réactiver ».

## Layout & Spacing

### Paramètres > Équipes

Réutiliser `src/app/app/admin/settings/teams/teams-settings.tsx` et sa composition existante : liste des équipes à gauche (~1/3) et formulaire à droite (~2/3) en desktop, panneaux empilés sur mobile/tablette étroite. **Ne pas remplacer la zone droite par une nouvelle modale.**

La liste affiche le nom d'équipe, son produit s'il existe, un badge de mode (`Scrum` ou `Kanban`) et un statut (`Active` ou `Archivée`). Ajouter un contrôle de filtre « Actives / Archivées / Toutes » au-dessus de la liste, « Actives » par défaut, sans masquer l'accès aux archives. La sélection de l'élément actif reste perceptible au clavier et visuellement.

Dans le formulaire, conserver les champs métier actuels. Placer **Mode Agile** immédiatement après **Nom de l'équipe**, avant Nom du produit, Vision produit et But du produit. En création, utiliser deux options radio exclusives sous une légende obligatoire, sans choix présélectionné. En édition avant premier cycle, conserver ces options avec le mode enregistré sélectionné. En édition verrouillée, remplacer la commande modifiable par une valeur textuelle en lecture seule, un cadenas et une explication adjacente ; éviter le simple champ grisé sans justification.

Placer `Archiver` ou `Réactiver` dans un groupe d'actions secondaires distinct de `Enregistrer` et `Annuler`. `Archiver` demande une confirmation, `Réactiver` une action explicite ; aucun état d'archive n'est piloté par une simple checkbox cachée.

### Page Équipe

**Préserver à l'identique le hero approuvé du 26 octobre 2026 :** Vision Produit et But du produit côte à côte dans le bandeau, filtres et membres en dessous, disposition responsive et création de membre existantes. Insérer un badge de mode près de l'identité de l'équipe, sans nouveau panneau. Dans la modale d'édition du contexte existante, afficher « Mode Agile : Scrum/Kanban » **en lecture seule**, avec lien vers `Paramètres > Équipes` uniquement pour un administrateur autorisé. **UX-04 validée : aucune modification du mode depuis cette modale.**

### En-tête global

Conserver l'ordre Équipe → Sprint/Période → Recherche. Ajouter un badge textuel de mode près du nom de l'équipe sélectionnée, ou sous le sélecteur si l'espace manque. Les options d'un `<select>` natif restent de simples textes, par exemple « Équipe Alpha — Scrum » ; ne pas tenter d'y insérer des badges HTML. Une équipe archivée n'y apparaît jamais.

### Navigation

Conserver la sidebar Cockpit Agile. La rubrique `Sprints` est affichée en Scrum, `Périodes` en Kanban. Les écrans communs gardent leur mise en page. Les fonctionnalités non applicables ou réellement indisponibles ne doivent pas être affichées comme actives.

## Elevation & Depth

Conserver contours fins et ombres discrètes du système. Ne pas introduire de cartes d'alerte surdimensionnées pour les états archivés ou verrouillés. Les confirmations utilisent le niveau modal existant ; ne jamais empiler plusieurs dialogues.

## Shapes

Panneaux : rayons existants (~15 px). Cartes : ~12 px. Badges compacts en pilule `{rounded.badge}`. Boutons d'action, focus et pictogrammes identiques au reste de l'application.

## Components

- **`TeamModeSelector`** : radios Scrum/Kanban en création et édition autorisée ; lecture seule avec motif après premier cycle ; marque obligatoire en création.
- **`TeamStatusBadge`** : texte `Active`/`Archivée`, même langage visuel que les états SMN ; ne pas substituer une variation d'opacité à une indication lisible.
- **`TeamListItem`** : nom + produit éventuel + mode + état ; sélection, focus, filtre actif/archivé ; aucune équipe inventée.
- **`TeamLifecycleAction`** : `Archiver` ou `Réactiver`, libellé explicite et confirmation d'archivage ; l'interdiction d'archiver la dernière équipe active fait apparaître une explication proche de l'action.
- **`HeaderTeamSelector`** : équipe active + mode, options textuelles uniquement pour les équipes actives autorisées, état vide explicite si aucune équipe accessible.
- **`HeaderCycleSelector`** : label Sprint/Période et options de l'équipe active uniquement ; états « Chargement », « Aucun cycle » et « Erreur » visuellement distincts.
- **`TeamContextEditor`** : modale existante conservée ; mode en lecture seule et lien vers paramètres pour l'admin ; aucune seconde écriture du mode.

## Do's and Don'ts

| À faire | À éviter |
| --- | --- |
| Conserver liste + formulaire dans Paramètres > Équipes | Créer une nouvelle modale concurrente pour le mode |
| Ajouter mode, statut et actions avec discrétion | Refaire les écrans Équipe, Calendrier, Registres ou Rapports |
| Présenter la cause précise du verrouillage | Champ désactivé sans explication |
| Laisser le choix de mode vide en création | Présélectionner Scrum : Scrum par défaut ne vaut que pour la migration |
| Garder les archives accessibles depuis Paramètres | Les afficher dans le sélecteur opérationnel |
| Reprendre les tokens, les thèmes et la navigation existants | Créer une nouvelle palette dédiée au Kanban |
| Montrer l'état métier réel | Inventer des KPI, cycles ou cérémonies |

## Responsive et accessibilité visuelle

Contrôler les largeurs 320, 375, 390, 768, 1024, 1440 et ~1880 px, zoom 200 %, thèmes et palettes. Sur mobile : liste puis formulaire ; badges pouvant revenir à la ligne ; actions touchables et lisibles ; en-tête réorganisé sans perdre le contexte. Contrastes WCAG 2.2 AA visés ; le mode, l'archive et le verrouillage sont toujours exprimés autrement que par la couleur.

**Précédence documentaire :** ce document ne remplace que les détails contradictoires liés au mode et à l'archivage ; les contrats Équipe Cockpit Agile du 26/10/2026 restent normatifs pour le reste.

**Exécution :** aucun test visuel, build, migration ni recette Windows réalisé par Sally dans ce livrable.