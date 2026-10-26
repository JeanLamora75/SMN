---
name: "SMN — Calendrier — Cockpit Agile Option A"
status: approved-design
updated: 2026-10-26
sources:
  - "docs/UX-REFERENTIEL-BMAD.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/AVENANT-GRAPHIQUE-OPTION-C-2026-10-26.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-calendrier-periodes-2026-10-22/CALENDRIER-CONTRAT-UX.md"
colors:
  primary: "inherit:--smn-brand"
  background: "inherit:--smn-background"
  surface: "inherit:--smn-surface"
  foreground: "inherit:--smn-foreground"
  border: "inherit:--smn-border"
  muted: "inherit:--smn-muted"
  absence-accent: "theme-appropriate-distinct-accent-not-alert"
typography:
  base: "inherit:SMN system-ui/Segoe UI"
  heading: "inherit:SMN headings"
rounded:
  panels: "inherit:SMN panel radius"
  cards: "inherit:SMN card radius"
spacing:
  panelPadding: "12-16px"
  gridGap: "inherit:calendar grid gap"
components:
  header: "Cockpit Agile high-contrast dark brand band"
  toolbar: "independent filter/timezone panel"
  modes: "exclusive Cartes/Agenda"
  day: "7-column desktop card grid with emphasized today"
  events: "meeting and absence differentiated without false alert semantics"
---
# DESIGN.md — Calendrier harmonisé Cockpit Agile

**Statut : Option A approuvée par le commanditaire le 26 octobre 2026.** `EXPERIENCE.md` contient les comportements. Contrats fonctionnels antérieurs préservés.

## Brand & Style
Reprendre l'identité visuelle de la page Registres : bandeau bleu foncé contrasté, composition hiérarchique, panneaux blancs arrondis à bordures discrètes et commandes cohérentes. Pleine largeur dans le shell SMN à sidebar rétractable. Ne pas copier mécaniquement les onglets du Registre : Calendrier et Registre ont des fonctions distinctes.

## Colors
Réutiliser `--smn-brand`, `--smn-brand-contrast`, `--smn-surface`, `--smn-background`, `--smn-foreground`, `--smn-border`, `--smn-muted`, `--smn-muted-soft`. Réunions en accent bleu existant ; absences avec accent distinct compatible clair/sombre (turquoise illustratif, **aucune signification d'urgence**). Le férié et le week-end reçoivent un fond gris, pas une interdiction déduite de la couleur. Aujourd'hui : contour renforcé + texte.

## Typography
Titre et sous-titre du bandeau comme Registres. Contexte équipe/cycle et dates lisibles ; événements en taille adaptée aux sept colonnes, titres distincts des horaires. Labels FR/EN centralisés ; pas de contenu métier factice.

## Layout & Spacing
1. Bandeau d'identité contrasté pleine largeur : titre/sous-titre/contextes réels et navigation cycle avec Cartes/Agenda.
2. Panneau distinct de filtres réunions/absences et fuseau horaire ; légende compacte.
3. Grand panneau de cartes ou Agenda, blanc à bordure discrète ; sept colonnes desktop sur largeur utile. Toutes les dates réelles visibles ; début de grille = début de période.
4. Cartes de hauteur cohérente. En-tête jour/date, nom férié immédiatement sous date, **12–16 px** de respiration avant la première réunion. En pied : `+ Réunion` / `+ Absence` côte à côte et alignés, conditionnés aux droits.
5. Responsive : 320/375/390/768/1024/1440 ; pas de chevauchement des sélecteurs ou contrôles ; défilement accessible si nécessaire pour les sept colonnes, Agenda utilisable.

## Elevation & Depth
Panneaux discrets, ombres légères uniquement si déjà utilisées dans SMN, hiérarchie par contraste et espacement. Pas d'animation obligatoire ; focus bien visible.

## Shapes
Conserver les arrondis existants des panneaux/cartes et les gabarits Bootstrap. Actions utilisables au toucher ; cible recommandée 44×44 px aux largeurs mobiles.

## Components
- Bandeau Cockpit Agile : contexte vérifié + navigation explicite.
- Filtre état actif visible et exposé via `aria-pressed`.
- Bascule Cartes/Agenda exclusive ; sélection perceptible sans dépendre de la seule couleur.
- Carte du jour : week-end/férié grisé, aujourd'hui contour renforcé ; liste d'événements ordonnée et actions en pied si autorisées.
- Événements : pictogrammes Bootstrap existants, heures locales lisibles, absence différenciée, tooltips accessibles.
- Formulaires : modales métier **inchangées**.

## Do's and Don'ts
**Faire :** styles CSS isolés au Calendrier, conserver les tokens et le rendu des Registres, FR/EN, clair/sombre, Scrum/Kanban, droits admin/user et états d'erreur.  
**Ne pas faire :** remplacer les données par le prototype, cacher des réunions, retirer les actions de création sur férié de semaine, ajouter un statut ou une alerte fictive, changer les règles métier, mélanger cet habillage avec la correction fonctionnelle CAL-09.
