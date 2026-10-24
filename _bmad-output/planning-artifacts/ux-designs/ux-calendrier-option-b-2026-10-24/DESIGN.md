---
name: "SMN — Calendrier d’équipe : Option B"
status: approved-for-handoff
updated: 2026-10-24
description: "Avenant visuel approuvé : vues Cartes et Agenda ; absences agrégées en première ligne."
sources:
  - https://github.com/JeanLamora75/SMN/blob/main/docs/UX-REFERENTIEL-BMAD.md
  - https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-calendrier-periodes-2026-10-22/CALENDRIER-CONTRAT-UX.md
  - https://github.com/JeanLamora75/SMN/blob/main/src/app/app/team-calendar/team-calendar-view.tsx
colors:
  background: "{existing.smn-surface-page}"
  day-surface: "{existing.smn-surface}"
  day-border: "{existing.smn-border}"
  muted: "{existing.smn-muted}"
  today-ring: "{existing.smn-brand}"
  absence-surface: "{semantic.warning-soft}"
  absence-accent: "{semantic.warning}"
  meeting-surface: "{semantic.info-soft}"
  meeting-accent: "{existing.smn-brand}"
typography:
  base:
    fontFamily: "system-ui, Segoe UI, sans-serif"
    fontSize: "14px"
    lineHeight: "1.4"
  day-label:
    fontSize: "11px"
    fontWeight: "700"
  date-number:
    fontSize: "21px"
    fontWeight: "800"
  event-title:
    fontSize: "12px"
    fontWeight: "700"
rounded:
  calendar-card: "13px"
  event-chip: "6px"
spacing:
  calendar-gap: "10px"
  day-padding: "10px"
  event-gap: "5px"
  header-to-events: "12px"
components:
  day-card:
    background: "{colors.day-surface}"
    borderColor: "{colors.day-border}"
    radius: "{rounded.calendar-card}"
  today-card:
    borderColor: "{colors.today-ring}"
  absence-summary:
    background: "{colors.absence-surface}"
    color: "{colors.absence-accent}"
    radius: "{rounded.event-chip}"
  meeting-item:
    background: "{colors.meeting-surface}"
    color: "{colors.meeting-accent}"
    radius: "{rounded.event-chip}"
---

# DESIGN — Calendrier d'équipe, option B

> **Avenant visuel validé le 24 octobre 2026.** Priorité aux valeurs des thèmes et tokens réellement présents dans SMN. Les tokens symboliques ci-dessus sont des intentions, **pas** des variables CSS existantes garanties. Le fichier frère `EXPERIENCE.md` définit la logique et les états. Le prototype HTML illustre les proportions, mais les contrats écrits priment si un choix illustratif les contredit.

## Brand & Style

Calendrier Agile professionnel, **compact, clair, scan-friendly**. La date doit être lue d'abord, puis les absences collectives puis les cérémonies, enfin les actions autorisées. Préserver le style Bootstrap/SMN et la largeur utile de l'application. Conserver les modes clair/sombre et palettes ocean/forest/violet ; ne pas fixer les hexadécimaux du prototype comme couleurs définitives.

## Colors

- Cartes de jour : surface claire du thème ; week-end et férié grisés, sans perte de contraste. Aujourd'hui : contour renforcé et/ou repère textuel indépendant de la couleur.
- **Absences** : bande/puce discrète ambre, identifiable par une icône et le mot « Absences ». Jamais rouge alarmiste par défaut ; ne pas remplacer la distinction par la seule couleur.
- **Réunions et cérémonies** : fond subtilement bleuté ou surface sémantique équivalente, barre latérale fine, type de cérémonie identifiable par pictogramme **Bootstrap Icons**. Différencier notamment Planning, Daily, Review, Rétrospective, Affinage ; icône générique pour les autres réunions.
- Le libellé d'un jour férié apparaît près de sa date ; il ne doit jamais être pris pour une absence de toute l'équipe.

## Typography

- En-tête principal : **Calendrier d'équipe** ; deuxième niveau : équipe réelle + **Sprint/Période** (nom, dates, statut) ou nom du mois en toutes lettres si aucun cycle n'existe. Éviter `2026-10` seul.
- Dans chaque carte : nom du jour, puis numéro grand et mois abrégé, et éventuel nom du jour férié immédiatement sous la date ; espace visible avant le premier événement.
- Titres des événements lisibles sans devenir des paragraphes. Heures début/fin accessibles au survol et au focus ; l'affichage compact peut aussi montrer les heures dans une ligne secondaire pour **les réunions**, si l'espace le permet.
- **Absences (N)** : une seule ligne visuelle, jamais de sous-texte ni d'horaires, de catégories ou de noms. Le nombre N reste apparent, y compris sur une colonne étroite.

## Layout & Spacing

### En-tête et barre d'outils

```text
Calendrier d'équipe                                    ‹  [Aujourd'hui]  ›
[Équipe réelle] · Sprint 1 · 12–25 octobre 2026 · [En cours]

Afficher : [Cérémonies et réunions ✓] [Absences ✓]      Présentation : [▦ Cartes] [☷ Agenda]
Légende : Aujourd'hui (contour) · Week-end/férié (fond grisé)
```

- Conserver la sidebar et le header de SMN ; ne pas créer une seconde navigation globale.
- Le choix de présentation est exclusif, très visible, positionné à droite de la barre des filtres (repli propre sur petit écran).
- Les filtres d'affichage masquent les types demandés **sans modifier le compte métier ni les enregistrements**.

### Vue Cartes, par défaut

- 7 cartes **par rangée desktop**, démarrant **au premier jour de la période sélectionnée** (sans insertion artificielle de jours antérieurs). Afficher la période entière, y compris sa dernière rangée incomplète.
- Cartes visuellement compactes : **pas de grande hauteur vide imposée**. Valeur indicative de `min-height` : 170–180 px sur desktop, à adapter après recette visuelle ; hauteur naturelle si événements nombreux. Ne jamais rogner des informations essentielles pour figer cette valeur.
- Une journée avec absences doit commencer sa zone événements par un **bandeau unique `Absences (N)`**. Les réunions et cérémonies occupent les lignes suivantes, triées chronologiquement.
- Toutes les cartes d'une rangée peuvent être alignées en hauteur, mais leur contenu ne doit pas être rejeté artificiellement au milieu ; actions en **pied** lorsque permises.
- Cartes week-end grisées et **aucun `+`**, mais événements existants visibles. Férié en semaine : fond grisé et deux actions `+ Réunion` et `+ Absence` selon droits.
- Conserver les deux libellés visibles, côte à côte dans une même bande en bas d'une carte éligible. Ne pas replacer un bouton `+` isolé dans le coin supérieur droit.

### Vue Agenda, complémentaire

- Une entrée de jour avec libellé complet et événements regroupés pour la **même période sélectionnée**.
- Quand des absences sont présentes, la **première ligne/pastille événement** doit être `Absences (N)`, avant toute cérémonie ; elle reste une seule ligne.
- Une journée sans événement peut afficher « Aucun événement », sans inventer de réunion ni d'absence.
- En responsive étroit, l'Agenda devient une suite verticale lisible : pas de colonnes miniature illisibles ni de défilement horizontal requis pour accéder à une action essentielle.

### Exemple visuel purement illustratif

```text
┌────────────────────────────┐
│ MER.             21 oct.    │
│                            │
│ 🟠 Absences (2)            │  ← PREMIÈRE ligne, UNIQUEMENT CE LIBELLÉ
│ 🔁 Daily Scrum             │
│    09:00 – 09:15           │
│ 🧩 Affinage                 │
│    14:00 – 15:00           │
│                            │
│ [+ Réunion] [+ Absence]     │  ← actions en pied, si autorisées
└────────────────────────────┘
```

Les emoji ci-dessus ne sont **que des substituts typographiques du croquis** : utiliser Bootstrap Icons dans SMN. Le prototype joint matérialise le choix Cartes/Agenda, les volumes et la hiérarchie.

## Elevation & Depth

Bordures fines, ombres très discrètes, aucun dégradé volumineux. Les liens et actions gagnent une indication visible au survol/focus. Le contraste doit rester suffisant sur les thèmes sombres.

## Shapes

Cartes légèrement arrondies, puces d'événements avec coin arrondi plus petit. La pastille/ligne « Absences (N) » a une hauteur de **ligne unique** ; ne pas la transformer en carte d'absence détaillée ou en groupe de cartes nominatives.

## Components

| Composant | Exigence de présentation |
|---|---|
| `CalendarViewSwitch` | Deux options visibles `Cartes` / `Agenda`, exclusives ; état actif net |
| `CalendarDayCard` | Date/férié compacts, espace avant événements, pied actions séparé |
| `AbsenceSummary` | **Première ligne, unique, `Absences (N)`**, jamais de nom/motif ; repère iconographique |
| `MeetingEvent` | Pictogramme spécifique Bootstrap Icons, titre, heures accessibles, lien vers fiche existante |
| `AgendaDay` | Libellé date complet ; même ordre que Cartes ; ligne `Absences (N)` en premier |
| `CalendarFooterActions` | `+ Réunion` et `+ Absence`, côte à côte selon droits ; absentes le week-end |

## Do's and Don'ts

**À faire :** comparaison côte à côte avec la maquette ; contrôle des deux vues ; utiliser les thèmes existants ; limiter la hauteur vide ; rendre `Absences (N)` évident d'un coup d'œil ; distinguer création et consultation.

**À éviter :** changement du contenu métier, noms des absents dans la grille, nombre de fiches d'absence comme N, filtres invasifs, sept colonnes mobiles microscopiques, données fictives présentées comme réelles, emoji comme seul système d'icônes de production, boutons + en haut des jours non ouvrés.