---
name: "SMN — Tickets CSV historiques — Design Cockpit Agile"
status: "partial-validation"
updated: "2026-11-13"
description: "Contrat visuel BMAD pour tous les écrans et modales du module Tickets"
sources:
  - "../../architecture/architecture-tickets-2026-11-13/ARCHITECTURE-SPINE.md"
  - "../../../../docs/UX-REFERENTIEL-BMAD.md"
colors:
  primary: "inherit:--smn-brand / palette SMN active"
  surface: "inherit:--smn-surface"
  foreground: "inherit:--smn-foreground"
  border: "inherit:--smn-border"
  muted: "inherit:--smn-muted-soft"
  contextual: "inherit:--smn-context-start / --smn-context-end"
typography:
  base: "inherit:SMN / Bootstrap / system-ui / Segoe UI"
  hierarchy: "inherit:existing Cockpit Agile heading hierarchy"
rounded:
  panels: "inherit:SMN Cockpit Agile panels"
  modals: "inherit:.smn-cockpit-modal"
spacing:
  page: "inherit:SMN full-width content / page gutters"
  panels: "inherit:existing Cockpit Agile panel gaps"
components:
  header: "Cockpit Agile contextual page header with title and icon actions"
  tabs: "Fichiers / Consultation / Comparaison"
  filters: "dedicated white Cockpit Agile panel"
  tables: "full-width responsive data tables with legible headers and actions"
  modal: "existing .smn-cockpit-modal and shared modal header/body/footer"
---

# DESIGN.md — Tickets CSV : apparence

**Statut :** disposition des écrans « Fichiers » et « Consultation » approuvée en conversation le 13/11/2026 ; **rendu Cockpit Agile impératif** confirmé. Les autres écrans et modales doivent suivre les mêmes règles, mais leurs détails ne sont pas encore validés.

**Normativité :** présent DESIGN.md pour l'apparence et [EXPERIENCE.md](EXPERIENCE.md) pour les comportements priment sur toute maquette illustrative. Les captures validées approuvent la **disposition**, pas une nouvelle palette, de nouveaux composants ni des chiffres fictifs. En conflit, le référentiel UX SMN actuel et ses avenants les plus récents prévalent.

## Brand & Style

Toutes les vues **Tickets**, **Fichiers**, **Consultation**, **Comparaison** et toutes les modales (**Importer un CSV**, **Indicateurs**, confirmations et erreurs) doivent avoir le **rendu Cockpit Agile natif de SMN**. Aucun écran ou dialogue à l'apparence générique Bootstrap, aucune seconde identité visuelle indépendante. Reprise des classes/tokens et conventions déjà utilisées par l'application.

Références d'implémentation vérifiées :
- `src/app/modal-cockpit.css` : `.smn-cockpit-modal`, `.smn-cockpit-modal-header`, `.smn-cockpit-modal-body`, `.smn-cockpit-modal-footer`, `.smn-cockpit-form-actions`.
- `src/app/app/reports/report-center-cockpit.css` : en-têtes Cockpit Agile, blocs de filtres et de résultats distincts, boutons, tableaux.
- `src/lib/private-navigation.ts` et `src/app/app/private-shell.tsx` : navigation, équipe et sprint/période du header.
- `docs/UX-REFERENTIEL-BMAD.md` : référentiel approuvé ; modifications récentes à vérifier avant livraison.

## Colors

Ne jamais figer les couleurs violet/bleu de l'illustration. Utiliser exclusivement la palette active SMN et ses variables (par exemple `--smn-brand`, `--smn-surface`, `--smn-foreground`, `--smn-border`, `--smn-muted-soft`) et les classes existantes.

- Les **blocs de contenu** sont blancs en thème clair, selon les surfaces Cockpit Agile existantes, avec leurs bordures/ombres ; en mode sombre, ils suivent les tokens de surface adaptés, sans blanc forcé.
- Statuts de tickets : couleur + texte et/ou symbole, jamais couleur seule.
- La ligne sélectionnée et l'onglet actif ont un état visuel explicite compatible avec clavier, contrastes et thèmes.
- Icônes cohérentes avec le catalogue Bootstrap Icons SMN.

## Typography

Reprendre les polices, tailles et niveaux de titre existants. Un titre de page « Tickets », un contexte d'équipe/cycle et des sous-titres de blocs courts et cohérents. Ne pas remplacer les libellés complets par des icônes isolées sans nom accessible ; actions d'en-tête : icône + libellé.

## Layout & Spacing

1. **Page pleine largeur** sous le header global, à droite de la sidebar rétractable ; **pas** de conteneur étroit plafonné à 870/900/1000 px. Le layout ne déborde pas horizontalement ; seul le tableau peut défiler horizontalement sur petit écran.
2. En-tête de page Cockpit Agile : icône Tickets, titre, sous-titre contextuel ; à droite les actions **Indicateurs**, **Comparer**, **Importer un CSV** (si droits), avec icônes.
3. Navigation secondaire à trois onglets **Fichiers**, **Consultation**, **Comparaison** ; état actif évident et navigation clavier.
4. **Vue Fichiers** : bloc d'information contextuelle ; panneau principal listant les CSV à gauche, panneau de synthèse du sprint/période à droite ; sur petit écran, empilement vertical. Tableau avec date métier, nom du fichier, taille, date/heure réelle d'import, actions.
5. **Vue Consultation** : bandeau discret identifiant le fichier et sa **date métier**, cartes de synthèse (tickets, total Story Points, types, préfixes Jira), panneau **Filtres et regroupements** physiquement **séparé** du panneau de résultats, grand tableau de tickets ; synthèses latérales contextuelles lorsque la largeur le permet.
6. **Vue Comparaison** : même style de header/onglets et mêmes panneaux blancs distincts ; deux sélecteurs de photographies, synthèse des écarts, filtres et tableau d'écarts. Son placement détaillé reste à confirmer avec l'utilisateur.
7. **Espacements visibles entre blocs** : ne pas coller filtres, résultats, synthèses, en-têtes et tableaux. Réutiliser les espacements et arrondis du Centre Rapports ; conserver la densité lisible sur desktop et le responsive.
8. Priorité à la lisibilité des colonnes Jira longues ; colonne identifiant cliquable vers Jira, en-têtes de colonnes compréhensibles et tri visualisé.
9. Les données/chiffres présents dans les maquettes sont **illustratifs uniquement**, jamais une spécification ni un jeu de données à introduire.

## Elevation & Depth

En-tête Cockpit Agile et panneaux selon les ombres et bordures natives. Pas de cadres supplémentaires décoratifs autour de chaque champ. Les modales apparaissent au-dessus d'un fond assombri, la carte modale est centrée et ses zones distinctes restent lisibles.

## Shapes

Rayons et bordures identiques aux écrans Cockpit Agile existants. Les pastilles de statuts, badges de types/préfixes Jira et boutons de pagination reprennent les formes natives de SMN.

## Components

### Header et onglets

- Le contexte équipe/sprint-période demeure gouverné par le header global, sans second sélecteur contradictoire.
- Boutons d'actions de page avec icône, libellé traduit et permissions respectées.
- Ne pas répéter les actions principales dans chaque bloc ; les actions de ligne restent contextualisées.

### Fichiers et Consultation

- Tableau de fichiers : une ligne sélectionnable, actions consulter/télécharger/supprimer selon droits ; la sélection détermine la photographie consultée.
- Tableau tickets : colonnes issues du **contrat CSV définitif** (non figé ici), clés Jira comme liens, recherche, filtres, tri, regroupement, compte de résultats et pagination adaptés au volume.
- Les totaux affichent clairement leur **périmètre** : photographie entière vs lignes filtrées ; ce choix reste à arbitrer avant développement.
- Tous les panels de filtres doivent être séparés visuellement des données, modèle Centre Rapports/Paramètres.

### Modales — règle impérative

**Toutes les fenêtres modales du module Tickets doivent utiliser le composant/style Cockpit Agile existant**, en particulier les classes `.smn-cockpit-modal`, `.smn-cockpit-modal-header`, `.smn-cockpit-modal-body` et `.smn-cockpit-modal-footer`, plutôt qu'une modal Bootstrap brute.

- En-tête avec titre explicite et bouton fermer ; corps organisé en champs correctement étiquetés ; pied avec **Annuler** et action principale clairement identifiée, icônes selon conventions SMN.
- Dialogues : importer CSV (fichier, date métier, résultat de validation), saisir indicateurs v33 **manuellement**, confirmer suppression/remplacement lorsque autorisés.
- Validation en place, messages d'erreur proches des champs ; pas de fermeture en cas d'erreur, pas de succès annoncé avant écriture confirmée.
- Modales responsives : largeur adaptée, hauteur bornée au viewport, défilement du corps et accès au pied ; focus visible, confinement du focus, restauration au déclencheur après fermeture.

## Do's and Don'ts

**À faire :** réutiliser les variables/classes existantes, pleine largeur, blanc de surface en thème clair, panneaux distincts, icônes reconnues, i18n FR/EN, états vides/chargement/erreurs Cockpit Agile, responsive.

**À proscrire :** recopier les couleurs de la maquette, injecter des styles indépendants, coder des libellés FR/EN en dur, afficher des données fictives en production, ouvrir un formulaire en pleine page à la place de la modale demandée, mélanger les filtres et le tableau dans un panneau unique, présenter une comparaison comme si elle alimentait automatiquement des indicateurs.

## Vérification visuelle préalable à la livraison

Comparer côte à côte le module Tickets et les écrans Cockpit Agile déjà livrés (Centre Rapports, Paramètres) pour en-tête, panneaux, boutons, modales, thèmes, responsive et lisibilité. Les états vide, erreur d'upload, comparaison sans second fichier et permissions limitées doivent aussi être vérifiés. **Cette recette n'est pas exécutée au moment de la rédaction.**

## Avenant visuel — modales de remplacement et suppression (13/11/2026)

Deux nouvelles confirmations sont obligatoires dans le module Tickets, avec **le rendu Cockpit Agile natif** : 
- **Remplacer le fichier du [date métier] ?** : afficher le nom du fichier existant, rappeler qu'il sera écrasé, et proposer **Annuler** / **Remplacer** (action explicite).
- **Supprimer ce fichier ?** : afficher le nom du fichier et sa date métier, et proposer **Annuler** / **Supprimer** (action destructive clairement identifiable).

Ces modales emploient les mêmes classes `.smn-cockpit-modal`, `.smn-cockpit-modal-header`, `.smn-cockpit-modal-body`, `.smn-cockpit-modal-footer` que les autres dialogues SMN. La liste des fichiers comporte une action de suppression par ligne ; sa visibilité dépend des droits. Pas d'alerte navigateur non stylée ni de confirmation implicite.
