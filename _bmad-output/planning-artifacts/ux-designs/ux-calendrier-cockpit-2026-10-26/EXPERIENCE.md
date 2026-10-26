---
name: "SMN — Calendrier — Cockpit Agile Option A (Experience)"
status: approved-design
updated: 2026-10-26
sources:
  - "DESIGN.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-calendrier-periodes-2026-10-22/CALENDRIER-CONTRAT-UX.md"
---
# EXPERIENCE.md — Calendrier harmonisé Cockpit Agile

## Foundation
Application web SMN, Bootstrap et traductions JSON FR/EN. Visuel normatif : [DESIGN.md](DESIGN.md). Cette harmonisation conserve l'expérience existante, à l'exception de la structuration visuelle approuvée.

## Information Architecture
1. Bandeau haut : identification écran, équipe courante et cycle choisi, dates/statut, sélecteur et navigation précédent/suivant/Aujourd'hui, modes Cartes/Agenda.
2. Panneau secondaire : filtres Cérémonies et réunions / Absences, fuseau actif/éventuel sélecteur, accès à la légende.
3. Zone principale : jours du cycle en cartes ou agenda, événements et actions jour par jour. Les écrans de consultation/modales métier existants restent accessibles.

## Voice and Tone
Descriptions courtes et orientées tâche ; « Calendrier d'équipe », « Cérémonies et réunions », « Absences », « Cartes », « Agenda », « Fuseau horaire », « Aujourd'hui », « + Réunion », « + Absence ». Libellés localisés à l'aide des JSON existants.

## Component Patterns
- Sélecteur de cycle et précédent/suivant : même comportement et mêmes bornes qu'avant la refonte.
- Bascule Cartes/Agenda : une seule vue active à la fois, filtres/horaires inchangés.
- Toggles réunions/absences : indépendants, état annoncé par sémantique de contrôle.
- Fuseau : indication actuelle lisible, choix disponible lorsqu'applicable, avertissement si source de zones indisponible.
- Événement : titre, icône, horaires, ordre chronologique ; détails et interactions existantes préservés.
- Actions par date : seules actions autorisées ; déclenchement des modales existantes avec date préremplie.

## State Patterns
- Chargement : ne pas présenter les données illustratives de la maquette.
- Erreur API/fuseau : état compréhensible, pas de fausse absence de données.
- Sans période : afficher toutes les dates du mois civil actuel.
- Période actuelle/prévue/clôturée : libellés réels et droits conservés.
- Aucune réunion / absence filtrée : éviter d'interpréter filtre masqué comme zéro événement.
- Férié de semaine : fond grisé mais commandes de création si autorisées.
- Week-end : fond grisé, réunions enregistrées consultables, aucune commande `+`.
- Aujourd'hui : bordure renforcée, y compris si férié ou week-end.

## Interaction Primitives
Clic, focus et clavier accessibles. Garder la consultation des réunions et les modales actuelles. Après sauvegarde, actualiser la carte et conserver la période/vue si le comportement existant le permet. Aucune écriture silencieuse ni action supprimée au motif de la refonte.

## Accessibility Floor
Contraste AA, focus visible, libellés accessibles pour les contrôles, interactions tactiles, zoom 200 %, responsive à 320/375/390/768/1024/1440. Indiquer les statuts par texte et/ou forme en plus de la couleur. Les secrets/raisons individuelles des absences demeurent limités aux habilitations existantes.

## Key Flows
**Parcours 1 — Scrum Master, planifier une réunion.** Ouvre Calendrier, voit l'équipe et le sprint dans le bandeau, retrouve le jour du cycle, utilise `+ Réunion` d'un jour autorisé ; modale actuelle préremplie ; après sauvegarde, retrouve l'événement dans le calendrier.

**Parcours 2 — Scrum Master, absence d'un membre.** Active Absences, identifie une date et clique `+ Absence` ; choisit un membre dans la modale existante ; calendrier et fiche membre restent cohérents.

**Parcours 3 — Utilisateur lecture seule.** Ouvre un cycle et passe de Cartes à Agenda pour lire les événements collectifs autorisés ; aucune action de création n'est proposée.

**Parcours 4 — Équipe Kanban / mobilité.** Choisit une période Kanban, consulte les dates et réunions depuis un écran étroit grâce au reflow des contrôles, au défilement de cartes ou à Agenda, sans perte de dates.

## Responsive & Platform
Desktop : sept cartes par ligne sur largeur utile ; tablette : grille scrollable ou adaptée mais jamais troncature des dates ; smartphone : commandes refluées, bascule Agenda facile. Aucun défilement horizontal de toute la page par accident.

## Préservation et arbitrage connu
Les règles historiques `CAL-01` à `CAL-15` et leurs rectificatifs sont la référence du métier. Le code actuel ouvre un dialogue au clic d'une réunion ; le contrat CAL-09 demande un lien vers la page dédiée. **Laisser le comportement actuel intact dans cette refonte graphique**, tracer l'écart en recette et ouvrir si nécessaire un autre ticket fonctionnel.

**Pas de backend, DB, calcul, permission, ni nouvelle fonctionnalité dans cette Story.**
