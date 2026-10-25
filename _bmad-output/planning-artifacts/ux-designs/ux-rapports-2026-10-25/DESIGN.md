---
name: Scrum Master Notebook — Studio de rapports
status: draft-validation-ux
updated: 2026-10-25
description: Contrat visuel proposé pour le Centre Rapports, les modèles, le studio et l'export ; 21 choix UX approuvés en atelier, document à valider avant publication.
sources:
  - https://github.com/JeanLamora75/SMN/blob/main/docs/UX-REFERENTIEL-BMAD.md
  - https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/DESIGN.md
  - https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/sprints/%5BsprintId%5D/report/preview/print.css
  - SMN-SYNTHESE-UX-STUDIO-RAPPORTS-2026-10-25.md
colors:
  brand-primary: '#165293'
  brand-primary-strong: '#0E3567'
  text-primary: '#10264D'
  text-secondary: '#506482'
  surface-page: '#F5F8FC'
  surface-card: '#FFFFFF'
  surface-muted: '#EDF3F9'
  surface-context: '#E4F2FF'
  border-subtle: '#DCE6F2'
  focus-ring: '#236CC0'
  success: '#087D58'
  warning: '#945600'
  danger: '#BA2525'
  info: '#1668BA'
  on-primary: '#FFFFFF'
  paper: '#FFFFFF'
  paper-ink: '#172E49'
  paper-rule: '#D8E2ED'
typography:
  body:
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '14px'
    fontWeight: '400'
    lineHeight: '1.5'
  page-title:
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '24px'
    fontWeight: '700'
    lineHeight: '1.2'
  section:
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '17px'
    fontWeight: '650'
    lineHeight: '1.35'
  label:
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '12px'
    fontWeight: '600'
    lineHeight: '1.4'
  caption:
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '12px'
    fontWeight: '400'
    lineHeight: '1.4'
  report-title:
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '28px'
    fontWeight: '700'
    lineHeight: '1.2'
  report-body:
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '11pt'
    fontWeight: '400'
    lineHeight: '1.45'
rounded:
  sm: '6px'
  md: '9px'
  lg: '13px'
  xl: '16px'
  full: '9999px'
spacing:
  '1': '4px'
  '2': '8px'
  '3': '12px'
  '4': '16px'
  '5': '20px'
  '6': '24px'
  header-height: '66px'
  content-gutter: '16px'
  studio-plan-width: '244px'
  studio-properties-width: '276px'
  report-page-margin: '14mm'
components:
  centre-report-header:
    background: '{colors.surface-card}'
    border: '{colors.border-subtle}'
    title: '{typography.page-title.fontSize}'
  report-row:
    background: '{colors.surface-card}'
    border: '{colors.border-subtle}'
    radius: '{rounded.md}'
  model-card:
    background: '{colors.surface-card}'
    border: '{colors.border-subtle}'
    radius: '{rounded.lg}'
  studio-plan:
    background: '{colors.surface-card}'
    width: '{spacing.studio-plan-width}'
  studio-canvas:
    background: '{colors.surface-muted}'
    pageBackground: '{colors.paper}'
  studio-properties:
    background: '{colors.surface-card}'
    width: '{spacing.studio-properties-width}'
  report-block:
    border: '{colors.border-subtle}'
    selectedOutline: '{colors.focus-ring}'
  status-label:
    radius: '{rounded.full}'
    text: '{typography.caption.fontSize}'
  primary-button:
    background: '{colors.brand-primary}'
    foreground: '{colors.on-primary}'
    radius: '{rounded.sm}'
  quality-panel:
    background: '{colors.surface-card}'
    border: '{colors.border-subtle}'
    radius: '{rounded.lg}'
  focus-indicator:
    color: '{colors.focus-ring}'
    width: '3px'
---

# SMN — DESIGN.md — Studio de rapports

> **Portée.** Les 21 décisions de conception ont été approuvées ; **ce fichier et ses représentations visuelles sont proposés pour validation, pas encore publiés**. Il complète les contrats transverses de SMN, il ne les remplace pas. Les valeurs hexadécimales et dimensions du frontmatter sont une **base indicative issue du contrat tableau de bord**, à rapprocher des variables Bootstrap/SMN-24 et des thèmes existants avant codage. Contrat comportemental pair : [EXPERIENCE.md](EXPERIENCE.md). **Les deux contrats approuvés prévalent sur toute maquette.**

## Brand & Style

**Studio professionnel, document d'abord.** L'interface doit faire ressentir un atelier de création documentaire calme et contrôlable, pas un panneau d'administration interminable. Les données du Sprint restent lisibles, leurs unités, références historiques et réserves sont toujours visibles. La feuille A4 constitue le point focal du studio ; les commandes de composition s'effacent en modes Rédaction et Aperçu. Pas de décoration qui concurrence la lecture.

**Héritage impératif :** interface web SMN/Bootstrap et thèmes existants clair/sombre, palettes *ocean*, *forest* et *violet* ; aucune nouvelle palette n'est actée. Le prototype HTML utilise **uniquement un habillage clair/ocean illustratif** et ne valide ni une identité nouvelle ni une librairie graphique. Réutiliser la sidebar rétractable, les sélecteurs d'équipe/cycle et les principes de pleine largeur du référentiel.

## Colors

| Rôle | Jetons | Règle |
|---|---|---|
| Action/navigation | `{colors.brand-primary}`, `{colors.brand-primary-strong}` | Une seule action majeure par zone ; pas de boutons bleus pour des fonctions indisponibles |
| Texte | `{colors.text-primary}`, `{colors.text-secondary}` | Contraste lisible, jamais gris très clair pour une provenance de donnée |
| Surfaces | `{colors.surface-page}`, `{colors.surface-card}`, `{colors.surface-muted}` | Plan de travail distinct de la feuille blanche |
| Document imprimé | `{colors.paper}`, `{colors.paper-ink}`, `{colors.paper-rule}` | Ne pas imprimer la couleur du chrome applicatif |
| Alertes | `{colors.success}`, `{colors.warning}`, `{colors.danger}`, `{colors.info}` | Statut **texte + icône + couleur**, jamais couleur seule |
| Focus | `{colors.focus-ring}` | Visible au clavier, y compris en thème sombre |

Sur le thème sombre, le chrome doit hériter de la palette réellement active ; **les pages du rapport restent blanches** dans l'aperçu fidèle à l'impression, avec texte sombre. Contrastes cible WCAG 2.2 AA à vérifier, pas déclarés conformes.

## Typography

L'interface suit `{typography.body}` et `{typography.label}` ; titres de page `{typography.page-title}`, titres de panneaux `{typography.section}`, métadonnées `{typography.caption}`. Les valeurs métier utilisent des chiffres tabulaires et l'unité affichée (*SP*, *tickets*, *J/H*, score *1 à 5*). Les libellés longs FR/EN passent à la ligne et possèdent leur libellé accessible intégral. Ne pas afficher `0` à la place de « Non renseigné ».

Le document PDF utilise un **jeu de styles typographiques propre au modèle** (couverture, titre 1 à 3, paragraphe, légende, notes, tableau). Les valeurs `{typography.report-title}` et `{typography.report-body}` sont des points de départ, non une police universelle imposée aux modèles. Le zoom de l'éditeur n'altère pas les dimensions imprimées.

## Layout & Spacing

### IA — Centre Rapports

- Page en **pleine largeur** sous le header de l'application et la sidebar habituelle ; bandeau simple avec titre, contexte, action de création autorisée.
- Onglets « Rapports », « Modèles », « Archives ». Recherche/filtrage puis résultats sous forme de lignes compactes, et non une succession de gros formulaires ; sur mobile, les filtres peuvent se replier.
- Ligne de rapport : titre, Sprint/période, type et version du modèle, statut, dernière sauvegarde, actions autorisées ; éviter la troncature d'une identification de Sprint sans alternative accessible.
- Modèles : cartes avec **miniature documentaire**, type « Système » ou « Personnalisé », version, description courte ; actions « Prévisualiser », « Utiliser », « Dupliquer » ; édition seulement si autorisée.

### Studio — Desktop

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ En-tête SMN / contexte équipe + Sprint                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Retour Centre │ Rapport / modèle Vn │ ● Enregistré │ ↶ ↷ │ Exporter PDF │ Archiver│
├─────────────────────────────────────────────────────────────────────────────────┤
│                   [ Composition ] [ Rédaction ] [ Aperçu ]                       │
├─────────────────┬─────────────────────────────────────┬─────────────────────────┤
│ PLAN            │ CANEVAS PAGINÉ                     │ PROPRIÉTÉS              │
│ Rubriques/blocs │ Zoom, feuille A4                    │ Bloc/rubrique sélectionné│
│ + Ajouter       │ Texte, KPI, graphiques, tableaux   │ Style, liaison, options  │
└─────────────────┴─────────────────────────────────────┴─────────────────────────┘
```

- Les largeurs `{spacing.studio-plan-width}` et `{spacing.studio-properties-width}` sont **indicatives**, modulables selon l'espace ; priorité à la largeur utile de la feuille.
- Plan et Propriétés sont **indépendamment rétractables** ; le centre s'élargit sans changer le contenu documentaire.
- Modes : Composition = structure/propriétés ; Rédaction = pages plus larges et barre d'édition textuelle ; Aperçu = document sans poignées de manipulation, avec actions de lecture/export.
- Panneaux sobres `{components.studio-plan}` / `{components.studio-properties}`, feuille sur fond `{components.studio-canvas}` ; éviter les ombres lourdes.

### Responsive

| Surface | Disposition |
|---|---|
| Ordinateur | Trois panneaux rétractables, tous les outils |
| Tablette | Feuille prioritaire, Plan et Propriétés en volets temporaires accessibles |
| Téléphone | Liste et lecture fluide ; texte/commentaires et corrections simples ; **aperçu A4 fidèle séparé** ; configuration des blocs réservée à plus grand écran |

Seuils exacts de largeur **non validés**, à définir par tests sur largeur utile et non seulement sur le viewport. Le contrôle du zoom et le mode Aperçu ne doivent ni effacer ni altérer les données.

### Document A4

Un **seul format A4 portrait ou paysage pour tout le rapport**, choisi à partir du modèle. Marges, entête/pied, numérotation, couverture et sommaire hérités du modèle avec dérogations prévues pour le rapport. Couverture facultative ; sommaire facultatif, actualisé à la pagination finale. Sauts de page manuels et « conserver ensemble » disponibles. **Jamais d'orientation mixte par rubrique.**

## Elevation & Depth

Plans séparés par `{colors.border-subtle}` et tons de surface, pas par d'importantes ombres. Le papier possède une légère ombre seulement en écran, **jamais dans le PDF**. Dialogues de création, choix de brief IA et avertissements au-dessus du plan avec une élévation modérée. L'état de focus est un contour visible, non une ombre décorative.

## Shapes

Rayons `{rounded.sm}` pour commandes et éléments compacts, `{rounded.md}` pour lignes et panneaux, `{rounded.lg}` pour cartes/modales, `{rounded.full}` pour statuts. Les pages A4 restent rectangulaires avec angle quasi droit. Aucune forme n'est porteuse seule d'une signification métier.

## Components

| Composant | Anatomie et spécification visuelle |
|---|---|
| `centre-report-header` | Titre, descriptif et action principale alignés ; `{components.centre-report-header.background}` |
| `report-row` | Icône document, titre, Sprint, modèle/version, statut, dernière date ; séparation fine `{components.report-row.border}` |
| `model-card` | Miniature au ratio A4, titre/version/type, description et commandes secondaires ; `{components.model-card.radius}` |
| `studio-plan` | Liste hiérarchique compacte, prises de déplacement, icônes de visibilité, bouton ajouter ; `{components.studio-plan.background}` |
| `studio-canvas` | Fond gris doux, une ou plusieurs pages blanches, règle d'échelle, zoom ; `{components.studio-canvas.pageBackground}` |
| `studio-properties` | Étiquette du bloc choisi, contrôles en groupes, paramètres avancés repliables ; `{components.studio-properties.width}` |
| `report-block` | Titre optionnel, contenu et sources ; sélection par bordure `{components.report-block.selectedOutline}`, sans changer le rendu PDF |
| `status-label` | Icône + libellé visible (Brouillon, Enregistré, Données à vérifier, Archivé) ; `{components.status-label.radius}` |
| `primary-button` | « Créer », « Exporter PDF » selon contexte, rarement plus d'un CTA ; `{components.primary-button.background}` |
| `quality-panel` | Résultat groupé par erreurs/avertissements/informations, action d'aller au bloc concerné ; `{components.quality-panel.radius}` |
| `focus-indicator` | Contour clavier `{components.focus-indicator.color}` et largeur `{components.focus-indicator.width}` |

### Bibliothèque des blocs — rendu

| Famille | Apparence dans la page | Condition à préserver |
|---|---|---|
| Titres, séparateurs, paragraphes | Typographie hiérarchisée avec espacement régulier | Un titre ne reste pas orphelin en bas de page |
| KPI | Valeur avec unité, période, nom, source/qualité | Aucun zéro fictif, pas de confusion disponibilité/effort |
| Graphique | Titre, axes/étiquettes lisibles, légende et sources | Conserver ensemble si taille admissible ; jamais de graphique trompeur |
| Tableau | Colonnes lisibles et en-tête répété aux changements de page | Fractionnement entre lignes, jamais suppression automatique |
| Registres | Cartes/tabl. risques, obstacles, dépendances, actions, événements | Sens métier et historique inchangés |
| Commentaire / analyse | Encadré optionnel de rédaction avec type d'auteur identifiable | L'analyse IA est une **inclusion choisie**, jamais produite ici |
| Image / annexe | Image proportionnée, titre/caption et documents d'appui | Provenance et légendes si nécessaires ; contenu non coupé |

### Couverture, sommaire, en-têtes et pieds

Une couverture peut afficher logo, titre, Sprint, équipe/produit, période, sous-titre et illustration facultative. Le sommaire auto contient titres hiérarchiques, numéros de pages calculés et liens internes si techniquement disponibles. En-tête/pied : titre court, identité, date, page X/Y et version figée **uniquement lorsqu'elle existe**. Réglages par modèle, surcharges par rapport sans mutation du modèle source.

## Do's and Don'ts

**À faire :** suivre les thèmes SMN existants ; préférer la densité éditoriale lisible ; réserver la couleur aux rôles fonctionnels ; conserver les unités et réserves des données ; faire de la feuille le foyer visuel ; indiquer qu'une maquette emploie des données fictives ; proposer des correctifs quand un bloc déborde.

**À proscrire :** formulaire vertical géant, action « Publier » obligatoire, sauvegarde par rubrique, historique durable des brouillons, résolution de conflit imposée, orientation mixte, IA déclenchée dans le studio, valeur métrique inventée, masquage automatique de colonnes pour faire tenir une page, troncature invisible, affichage de modifications non enregistrées comme sauvegardées.

### Références visuelles et prévalence

- [Maquette interactive — 4 surfaces et états](mockups/studio-rapports-reference.html), à ouvrir localement dans un navigateur ; les interactions sont **des simulations sans backend**.
- [Inventaire des écrans et correspondances](MAQUETTES-REFERENCE.md) ; captures PNG disponibles dans l'archive UX locale ; prototype HTML versionné dans `mockups/`.
- [EXPERIENCE.md](EXPERIENCE.md) précise les règles d'interaction et états ; il **prime avec DESIGN.md sur les maquettes**. En cas de contradiction, demander arbitrage avant développement.