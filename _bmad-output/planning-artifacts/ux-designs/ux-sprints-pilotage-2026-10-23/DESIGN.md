---
name: SMN — Refonte de la page Sprints
status: final
updated: 2026-10-23
description: Contrat visuel approuvé pour séparer réglages globaux, index des sprints et future fiche.
sources:
  - https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-parametres-2026-10-23/DESIGN.md
  - https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-calendrier-periodes-2026-10-22/CALENDRIER-CONTRAT-UX.md
  - https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-equipe-membres-2026-10-22/FICHE-MEMBRE-V2-UX-CONTRAT.md
colors:
  primary: "inherit:smn/brand-primary"
  surface: "inherit:smn/page"
  card: "inherit:smn/surface-card"
  subtle: "inherit:smn/border-subtle"
  foreground: "inherit:smn/text"
  secondary: "inherit:smn/text-secondary"
typography:
  base: "inherit:system-ui / Segoe UI"
  title: "inherit:smn/page-title"
  table: "inherit:smn/body"
rounded:
  panel: "inherit:smn/panel"
  modal: "inherit:smn/modal"
spacing:
  pageGutter: "inherit:smn/page-gutter"
  tableRow: "dense-but-accessible"
components:
  sprint-list: "responsive table with name, dates, state, per-row actions"
  sprint-context-menu: "ellipsis menu opens allowed contextual operations"
  sprint-creation: "single entry point to a multi-step creation assistant"
  sprint-details-future: "separate per-sprint read-only/detail destination, not delivered by list"
---

# DESIGN.md — Sprints : index de pilotage

**Validé en conversation le 23/10/2026 (Sally/BMAD).** Ce contrat indique **comment la page apparaît**. Les règles d'interaction sont dans [EXPERIENCE.md](EXPERIENCE.md). Les spines UX priment sur toute maquette illustrative. Aucun développement ni test attesté ici.

## Brand & Style
SMN doit retrouver la densité, la hiérarchie et la largeur exploitable de la page **Équipe** validée. Il s'agit d'un **répertoire de sprints**, non d'une page de 16–17 éditeurs empilés. Réutiliser les composants/variables Bootstrap et le système i18n FR/EN et les 3 palettes (clair/sombre).

## Colors
Un sprint **en cours** se reconnaît par un accent (bordure latérale ou fond subtil) **ET** un libellé d'état ; état « À venir », « Terminé », « Clôturé » ont des labels distincts et accessibles, sans imposer un code couleur seul. Les actions dangereuses n'utilisent l'accent de danger que dans leur propre parcours confirmé.

## Typography
Titre « Sprints de l'équipe » ; sous-titre nom de l'équipe et mode Scrum ; nom de chaque sprint fortement lisible, sans troncature empêchant l'identification ; dates en zone IANA effective, abréviations localisées et lisibles. Les informations inconnues ne sont pas remplacées par des valeurs imaginées.

## Layout & Spacing
- Sidebar principale persistante ; onglet « Sprints » dans **Cycles et états**. La page occupe **toute la largeur utile**, sans `container maxWidth:900`.
- Entête horizontal : titre et contexte à gauche ; **action primaire unique « Générer des sprints »** à droite.
- Sous-entête : **Recherche de sprint** par nom, **filtre d'état** et **tri par date**. Pas de 16 formulaires sous les filtres.
- Tableau principal : colonnes **Sprint (nom)** | **Période (date début – fin)** | **État** | **Actions**. Le sprint courant est immédiatement repérable. L'ordre par défaut met **l'en cours en tête**, puis les autres sprints par début décroissant ; conserver le choix de tri lorsque l'utilisateur le change.
- Par ligne, au plus **deux contrôles d'action visibles** : raccourci « Voir le calendrier » et menu `⋯` « Actions du sprint » ; dans le futur, **le nom du sprint sera un lien vers sa fiche**. Tant que la fiche n'est pas disponible : nom lisible non facticement cliquable, sans 404 ni lien `#`.
- Des séparateurs fins, cartes arrondies uniquement pour l'en-tête/la zone de table ; ne pas afficher l'écran en mode Cartes (contrairement à Équipe et Paramètres, la **vue Liste seule** est retenue).
- Pour 0 sprint : état vide au centre, description et « Générer des sprints » si autorisé. Beaucoup de sprints : pagination/navigation exploitable ; jamais masquer un sprint ancien parce qu'une page n'en charge qu'une partie.
- Écrans étroits : laisser toutes les informations essentielles accessibles avec lignes réorganisées ou défilement de table contrôlé ; jamais couper Actions. Maintenir le contraste et la navigation clavier.

## Elevation & Depth
Panels légers et overlay gris des modales selon la convention fiche membre et calendrier. La liste reste visuellement plus simple que les pages de réglages.

## Shapes
Coins arrondis cohérents avec le design system ; icônes sobres pour calendrier et ellipse. Formulaires **uniquement sur demande** dans modale centrée (renommer, supprimer, création courte) ou parcours dédié si l'aperçu/assistant occupe trop de place ; ne pas mettre une grande boîte inline sous le tableau.

## Components
Schéma illustratif sans données réelles :

```text
← Cycles / Sprints                                       [+ Générer des sprints]
Sprints de l'équipe — Équipe courante
[Rechercher un sprint…] [Tous les états ▾] [Dates décroissantes ▾]

SPRINT               PÉRIODE                         ÉTAT            ACTIONS
Sprint 12            19–30 oct.                      En cours        [Calendrier] [⋯]
Sprint 13            02–13 nov.                      À venir         [Calendrier] [⋯]
Sprint 11            05–16 oct.                      Terminé         [Calendrier] [⋯]
Sprint 10            21 sept.–02 oct.                Clôturé         [Calendrier] [⋯]
```

Assistant de création : **1. Configuration → 2. Prévisualisation → 3. Confirmation** avec indicateur de progrès, champs et confirmations pertinents. Fiche future : bandeau de sprint, objectif et onglets proposés **Synthèse / Cérémonies / Capacité / Indicateurs / Bilan et historique**. Ces onglets sont une **orientation UX validée à développer ultérieurement**, pas des routes actuellement constatées.

## Do's and Don'ts
**Oui** : un tableau unique, recherche, filtres, un CTA de génération, état en cours visible, actions contextuelles, navigation cohérente avec Calendrier, Équipe et Paramètres.

**Non** : quinze formulaires à la suite, sélecteur de sprint répété dans chaque éditeur, configuration par défaut mélangée aux opérations d'un sprint, faux liens vers la future fiche, suppression sans aperçu d'impact, obligation de voir Calendrier/Paramètres pour rechercher un sprint.

Voir [EXPERIENCE.md](EXPERIENCE.md) et [RECETTE-UX.md](RECETTE-UX.md).