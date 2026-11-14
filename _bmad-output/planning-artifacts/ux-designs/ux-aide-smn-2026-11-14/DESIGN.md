---
name: "SMN — Centre d'aide et aide contextuelle Cockpit Agile"
status: "proposition-ux-a-valider"
updated: 2026-11-14
owner: "Sally — UX Designer BMAD v6.12.4"
sources:
  - "docs/UX-REFERENTIEL-BMAD.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-parametres-reorganisation-2026-11-10/DESIGN.md"
  - "src/lib/private-navigation.ts"
  - "src/app/app/admin/settings/settings-page-shell.tsx"
  - "src/app/app/dashboard-builder/modal-focus.ts"
colors:
  primary: "inherit:smn-appearance/--smn-brand"
  primaryContrast: "inherit:existing-theme-contrast"
  page: "inherit:smn-appearance/page"
  surface: "inherit:--bs-body-bg"
  text: "inherit:--bs-body-color"
  border: "inherit:--smn-border"
  focus: "inherit:smn-visible-focus"
typography:
  base: "inherit:SMN/system-ui,Segoe UI"
  heading: "inherit:SMN-page-heading"
  body: "inherit:SMN-body"
rounded:
  card: "inherit:smn-panel/rounded-4"
  modal: "inherit:existing-Cockpit-Agile-modal"
spacing:
  gutter: "inherit:smn-page-gutter"
  gap: "inherit:Bootstrap-gap"
components:
  help-navigation: "entrée unique Aide, groupe bas de sidebar immédiatement au-dessus de Paramètres"
  help-search: "recherche accessible, résultats orientés tâches"
  help-category: "quatre accès principaux et articles par module"
  help-checklist: "étapes ordonnées, états explicites et actions ouvertes selon droits"
  contextual-help-button: "bouton Aide avec icône + libellé dans l'en-tête métier"
  help-dialog: "modale Cockpit Agile contenant article contextuel et guide complet"
---

# DESIGN.md — Aide utilisateur SMN

**Décisions explicitement validées le 14/11/2026 :** entrée **Aide** dans la sidebar **au-dessus de Paramètres** ; ouverture de l'aide contextuelle dans une **modale Cockpit Agile** ; parcours initial sous forme de **checklist avec suivi de progression**.

Ce document décrit le **visuel**. [EXPERIENCE.md](EXPERIENCE.md) définit les interactions ; [RECETTE-UX.md](RECETTE-UX.md) définit les contrôles attendus. Maquette illustrative préparée en conversation le 14/11/2026 : référence visuelle **non validée pixel par pixel**. Les deux contrats écrits prévalent sur cette illustration. Aucun développement ni test navigateur n'est revendiqué.

## Brand & Style

- Réutiliser le shell privé SMN : header global clair, sidebar rétractable, contexte équipe/sprint et styles **Cockpit Agile** existants. **Ne pas ajouter de deuxième sidebar ni de second sélecteur d'équipe.**
- Centre d'aide = page métier **pleine largeur** ; en-tête d'aide conforme aux autres pages, surfaces blanches en thème clair et héritage de la palette en thème sombre.
- Une seule entrée « Aide » dans le menu principal, **directement avant Paramètres**. Si Paramètres n'est pas visible pour un rôle, Aide reste accessible en bas de navigation.
- L'aide s'adresse au Scrum Master, RTE, administrateur ou utilisateur habilité : vocabulaire fonctionnel, étapes courtes, aucune chaîne technique affichée comme identifiant d'interface.

## Colors

- Tous les états utilisent les variables de thème existantes : `{colors.primary}`, `{colors.surface}`, `{colors.text}`, `{colors.border}`.
- Checklist : **À faire**, **En cours**, **Terminé** ; texte + pictogramme + éventuelle couleur sémantique, jamais couleur seule.
- Statut « Terminé » = **déclaré par l'utilisateur**, et non « configuration vérifiée » par défaut.
- Focus clavier visible et contrasté, thèmes clair/sombre et palettes conservés ; aucun bleu de la maquette n'est codé en dur.

## Typography

- H1 unique « Centre d'aide ». H2 pour les grandes familles, H3 pour les articles ou sous-étapes.
- Écriture active et simple : « Créer une équipe », « Configurer les jours ouvrés », « Restaurer une sauvegarde ».
- Phrases concises ; les étapes numérotées sont lisibles dans une modale sans colonnes étroites.
- FR/EN : traductions intégrales, mise en page capable d'accueillir des libellés plus longs, pas de texte tronqué sans alternative.

## Layout & Spacing

### Écran A — Centre d'aide (desktop)

```text
HEADER SMN : équipe / cycle / recherche / compte (inchangé)
SIDEBAR : ... Rapports
          Aide  <--- entrée active
          Paramètres (si autorisé)

CONTENU PLEINE LARGEUR
┌─────────────────────────────────────────────────────────────┐
│ Centre d'aide                                  [facultatif] │
│ Trouver une réponse et configurer SMN facilement            │
├─────────────────────────────────────────────────────────────┤
│ [Rechercher dans l'aide…                                🔎] │
│ Résultats pertinents / aucun résultat / effacer             │
├────────────────────────────┬────────────────────────────────┤
│ Bien démarrer              │ Paramétrer SMN                 │
├────────────────────────────┼────────────────────────────────┤
│ Guides par module          │ FAQ et dépannage              │
└────────────────────────────┴────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Première configuration       [x étapes déclarées terminées] │
│ ○ 1. Initialiser SMN                     [Voir l'étape]     │
│ ○ 2. Paramètres généraux                [Ouvrir l'écran]   │
│ ◐ 3. Équipe et mode Agile               [Ouvrir l'écran]   │
│ ○ 4. Calendriers et membres             [Voir l'étape]     │
│ ○ ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

- Quatre accès principaux disposés en 2 colonnes au desktop quand l'espace **utile** le permet, puis 1 colonne.
- Un bloc checklist **distinct** de la recherche et des cartes ; pleine largeur et sans scroll interne imposé.
- Les compteurs de progression ne sont pas des pourcentages de conformité métier ; libellé « x étapes marquées terminées sur y ».
- Les liens vers les écrans métiers n'apparaissent qu'avec une destination réelle et autorisée. À défaut : texte explicatif, jamais bouton inactif trompeur.
- Dans les Paramètres, conserver la séparation des panneaux, les marges et l'en-tête existants ; l'ajout d'Aide n'altère pas les actions de création/édition.

### Écran B — Aide contextuelle

```text
ÉCRAN MÉTIER — ENTÊTE COCKPIT AGILE      [Aide ?] [Créer/Actions]
                     clic « Aide »
                            ↓
┌──────────── MODALE COCKPIT AGILE ───────────────────┐
│ ?  Aide — Gestion des équipes                   [×]│
│────────────────────────────────────────────────────│
│ Ce que permet cet écran                            │
│ Comment créer une équipe :                         │
│  1. Ouvrir « Créer »                                │
│  2. Saisir les informations attendues              │
│  3. Enregistrer                                    │
│ Prérequis / avertissements utiles                  │
│────────────────────────────────────────────────────│
│ [Consulter le guide complet]           [Fermer]    │
└────────────────────────────────────────────────────┘
```

- Modale centrée **Cockpit Agile** : bandeau d'en-tête cohérent avec les autres modales, icône d'aide, titre contextuel, fermeture `×`, corps à défilement vertical si nécessaire, pied d'actions constant.
- Largeur indicative : `min(760px, 100vw - marges)`, à adapter aux composants existants ; sur petit écran, hauteur/largeur quasi totales avec zone de défilement **dans le corps seulement**.
- Aucune fenêtre latérale : **la modale remplace explicitement la proposition précédente de panneau droit**.
- Le bouton d'en-tête affiche icône et **texte « Aide »** ; ne pas utiliser un « ? » seul hors contrainte responsive. La modale n'est pas un tutoriel qui masque le formulaire en cours de saisie.

## Elevation & Depth

- Panneaux séparés par bordures légères et espacement réel ; ombres modérées. La modale utilise l'overlay, la profondeur et les tokens du thème existant.
- Fond derrière la modale inert et sans interaction, avec contraste suffisant. Interdiction de superposer deux modales interactives.

## Shapes

- Cartes et blocs d'aide : arrondis habituels `smn-panel` / Bootstrap ; taille de cible tactile et focus selon normes SMN.
- Puces numérotées accessibles ; progression sans pictogramme ambigu. Les groupes de recherche et de checklist ont chacun un contour/séparation claire.

## Components

| Composant | Présentation proposée |
|---|---|
| Entrée menu Aide | Icône Bootstrap d'aide validée, libellé visible, marqueur actif ; seule entrée, au-dessus de Paramètres |
| Champ de recherche | Label accessible persistant, bouton effacer, compteur de résultats et suggestions non obligatoires |
| Carte thématique | Icône, nom orienté besoin, résumé en 1–2 lignes, lien réel vers contenu |
| Checklist | Numéro, titre, courte finalité, état explicite, action « Ouvrir l'écran » et bouton « Marquer terminé / Reprendre » distincts |
| Article d'aide | Intitulé, prérequis, étapes, résultat attendu, liens liés, date de mise à jour si fiable |
| Bouton Aide | Action secondaire dans l'en-tête métier, sans concurrencer « Créer »/« Enregistrer » |
| Modale | Dialog, titre id, corps défilant, sortie explicite, lien guide complet |
| Aucun résultat | Message neutre, lien « Effacer la recherche », aucune carte vide |
| Article indisponible | Message d'absence de contenu ; accès au Centre d'aide, pas de texte fictif |

## Do's and Don'ts

**À faire :** un contenu partagé entre Centre d'aide et modales, une navigation cohérente, FR/EN, droits et mode Agile respectés, checklist avec état explicite, clavier/screen reader/zoom, liens directs autorisés, charte Cockpit Agile.

**À éviter :** panneau droit, iframe, liens vers fonctions non livrées, capture d'écran affichant des données réelles, duplication des guides, IA externe obligatoire, validation automatique d'étapes à partir de simples visites de pages, compteur de conformité non justifié.

## Points laissés à Winston / Amelia

- Stockage et portée de la progression (compte, installation, équipe), stratégie pour l'écran d'installation avant authentification, réinitialisation volontaire et synchronisation multi-PC : **non arbitrés**. Le UX demande seulement un suivi persistant, explicite, fiable et non trompeur.
- Structure Markdown canonique, export Word/PDF, gestion des versions, moteur de recherche et mapping route/article : contrat d'architecture à définir.
- Taille finale de la modale, couleurs de thème et contrôle WCAG AA : à mesurer lors de la recette.

