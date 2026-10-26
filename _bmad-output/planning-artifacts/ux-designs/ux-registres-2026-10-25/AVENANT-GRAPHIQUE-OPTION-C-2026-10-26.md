---
name: "SMN — Registre global — avenant graphique Option C"
status: approved-design
updated: 2026-10-26
scope: "Index global des registres : Liste, Cartes, filtres et responsive"
sources:
  - "DESIGN.md"
  - "EXPERIENCE.md"
  - "https://lmn24.atlassian.net/browse/SMN-228"
---

# Registre global — Avenant graphique Option C / Cockpit Agile

**Conception approuvée avec Sally le 26 octobre 2026.**
**Implémentation proposée dans la branche `feat/registry-cockpit-option-c-20261026`.**
Cet avenant complète `DESIGN.md` et `EXPERIENCE.md` du 25/10 ; leurs invariants métier et d'interaction prévalent. La validation de la conception ne signifie ni validation du build ni recette applicative.

## 1. Décisions visuelles approuvées

| Zone | Contrat |
| --- | --- |
| Identité | Option C « Cockpit Agile » : bandeau contrasté, composition nette, fonds/panneaux du thème existant |
| En-tête | Titre localisé, sous-titre d'aide, bascule Liste/Cartes et action de création autorisée |
| Catégories desktop | Sept pastilles arrondies, icônes Bootstrap existantes, focus et sélection visibles |
| Catégories smartphone | Un seul sélecteur regroupant exactement les sept catégories |
| Filtres | Panneau séparé, recherche toujours visible ; Suivi, Cycle, Statut, Tri et Responsable selon droits |
| Contexte | Équipe, vue, nombre réel de fiches et nombre de points d'attention disponible, sans valeurs fictives |
| Liste | Colonnes inchangées, typographie et espacement améliorés, catégories et statuts distingués |
| Cartes | Accent supérieur par catégorie et en-tête affirmé ; aucun accent assimilé à une alerte |
| Mobile | Filtres secondaires repliables (option A), bouton de création « + » en tête (option B) |
| Points d'attention | Bandeau compact existant au-dessus de l'en-tête et compteur produit par SMN-104 |

## 2. Transcription technique proposée

- `src/app/app/admin/registries/registry-list.tsx` : composition visuelle, sélecteurs, panneau responsive, contexte réel.
- `src/app/app/admin/registries/registry-list-row.tsx` et `registry-card.tsx` : marqueur visuel de catégorie seulement.
- `src/app/app/admin/registries/registry-cockpit.css` : styles isolés par `.smn-registry-cockpit`, sans incidences sur les fiches détaillées.
- `src/app/app/admin/registries/page.tsx` : import CSS limité au registre global.
- `src/i18n/fr.json` et `src/i18n/en.json` : textes supplémentaires.
- `tests/registry-cockpit-option-c.test.ts` : tests source ciblés à exécuter.

Les variables SMN existantes restent prioritaires (`--smn-brand`, `--smn-surface`, `--smn-foreground`, `--smn-border`, `--smn-muted`). Les accents de catégorie sont uniquement des indices graphiques, jamais une déduction de criticité.

## 3. Invariants fonctionnels (non modifiés)

Six types de fiche et sept onglets, même API, filtres, pagination, mémorisation Liste/Cartes, modales de création et d'édition, liens de navigation, protections admin/user et sessions, signaux d'attention vérifiés. Aucun changement de route, de base de données, de statuts, de règles métier, de permissions ou de snapshots historiques.

## 4. Accessibilité et responsive

Contrôler à 320/375/390/768/1024/1440 px, zoom 200 %, FR/EN, thèmes clair/sombre, clavier et lecteur d'écran. Le + mobile conserve un `aria-label` explicite, une cible de 44 × 44 CSS px, et la restriction `canManage`. Le bouton Filtres dispose de `aria-expanded` et `aria-controls` ; les filtres actifs restent appliqués quand la zone est repliée.

## 5. Références de validation de Sally

Les fichiers de l'atelier validés le 26/10/2026 restent des pièces jointes de la conversation, et ne sont pas versionnés ici :
`SMN_Registres_Cible_OptionC_LIST.png`, `SMN_Registres_Cible_OptionC_CARDS.png`,
`SMN_Registres_OptionC_Prototype_Responsive_B.html`,
`SMN_Registres_OptionC_Responsive_B_390.png`, et l'avenant graphique brouillon.

## 6. Conditions de livraison

À exécuter sur un checkout complet du projet avec Node 24 et pnpm 12 :
`pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, puis recette navigateur. Les résultats sont à renseigner réellement ; aucune réussite n'est présumée.

**Publication de ce contrat :** il documente une proposition de code sur une branche dédiée en attente de validation technique ; la branche `main` n'est pas modifiée par cette opération.
