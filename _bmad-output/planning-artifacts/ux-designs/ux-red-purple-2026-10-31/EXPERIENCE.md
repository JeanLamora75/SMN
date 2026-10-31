---
name: SMN — Expérience palette Red & Purple
status: proposed
updated: 2026-10-31
description: Contrat comportemental de la palette SMN Red & Purple.
sources:
  - DESIGN.md
  - docs/APPARENCE-SMN-24.md
---
# EXPERIENCE — Red & Purple

## Foundation
Web desktop/responsive Bootstrap 5.3.8 ; nouveau choix `red-purple` sans modifier le fonctionnement du thème global `light | dark`. Le contrat de couleurs est [DESIGN.md](DESIGN.md). Le réglage d'apparence reste global et administrable ; pas de couleur CSS libre saisie par les utilisateurs.

## Information Architecture
Conserver Paramètres > Apparence existant : choix du mode clair/sombre puis choix de la palette. Afficher Océan, Forêt, Violet et Red & Purple dans une même liste, éventuellement avec un aperçu non bloquant. Aucun nouvel écran obligatoire et aucun changement de navigation.

## Voice and Tone
Libellé français : « Red & Purple » ; code stable `red-purple` ; traductions FR/EN à prévoir. Ne pas traduire les identifiants techniques. Avertissements d'échec neutres et accessibles.

## Component Patterns
La sélection du mode et de la palette est indépendante. Un aperçu doit rendre des tokens de {colors.brand-red}, {colors.brand-purple}, {colors.light-card}/{colors.dark-card}, avec contrôle d'accessibilité de la combinaison. Les boutons et statuts gardent leurs comportements, attributs et permissions. Les trois palettes actuelles restent visuellement et fonctionnellement identiques.

## State Patterns
Avant sauvegarde : état « modification en cours » et confirmation à l'abandon selon le formulaire existant. Sauvegarde : valider l'identifiant côté serveur, appliquer sous transaction et révision optimiste. Conflit HTTP 409 : prévenir sans écraser un autre administrateur. Valeur inconnue/base indisponible : repli sûr prévu par SMN (light/ocean) sans écriture silencieuse. Préserver la palette précédente si elle est absente d'une requête legacy.

## Interaction Primitives
Souris/clavier et focus visible dans les deux modes. Au succès, actualisation immédiate de `data-smn-palette` sur `html`, puis cohérence SSR au rechargement. Le sélecteur n'altère ni l'équipe active, ni le sprint actif, ni les métriques ni les permissions.

## Accessibility Floor
Contrastes WCAG 2.2 AA sur champs, boutons, alertes, pastilles, textes, panneaux, focus, graphiques, tableaux et modales. La couleur ne doit jamais porter seule la sémantique d'un état ou d'une série. Vérifier zoom 200 %, navigation clavier et l'en-tête gradient dans les deux modes.

## Key Flows
1. Une administratrice ouvre Paramètres > Apparence, sélectionne Clair puis Red & Purple ; une prévisualisation optionnelle reflète le choix sans changer les autres données.
2. Elle sauvegarde ; l'API valide, persiste et journalise ; toutes les pages affichent la nouvelle palette et conservent le même thème au rechargement.
3. Elle sélectionne Sombre ; les mêmes écrans adoptent les variantes sombres sans modifier les contenus métier.
4. Elle revient à Océan, Forêt ou Violet ; leur rendu demeure celui d'avant l'ajout.
5. En cas de conflit de révision ou valeur inconnue, le système affiche une erreur explicite et ne persiste pas un état partiel.

## Responsive & Platform
Même disposition et règles responsive Cockpit Agile ; ajouter un choix de palette ne doit pas couper le formulaire mobile. Les maquettes concernent Tableau de bord, Équipe et Sprints, mais la palette est **globale** (Calendrier, Registres, Liens, Rapports, Paramètres, modales, authentification).

## Critères d'acceptation UX
- UX-01 : quatre options affichées ; anciennes palettes conservées.
- UX-02 : 4 × 2 = 8 combinaisons et navigation/rafraîchissement cohérents.
- UX-03 : aucun changement de structure UX et aucun changement des données.
- UX-04 : persistance, contrôle d'autorisation et conflit inchangés.
- UX-05 : accessibilité testée et couleurs des graphiques distinctes de la sémantique métier.
- UX-06 : couverture FR/EN, clavier et responsive.

## Décisions ouvertes
Variantes exactes des couleurs pour le mode sombre et choix de prévisualisation persistante/non persistante ; validation des contrastes et inventaire des composants à couleurs fixes. Aucun test ni mise en production exécuté.
