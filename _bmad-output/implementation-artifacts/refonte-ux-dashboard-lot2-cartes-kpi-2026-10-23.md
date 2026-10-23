---
project: Scrum Master Notebook
date: 2026-10-23
language: fr
change: ux-dashboard-lot-2
branch: main
status: code-publie-recette-windows-attendue
depends_on: [SMN-21,SMN-235,SMN-236,lot-1-entete]
epic5: differe
---

# Refonte UX dashboard — Lot 2 : cartes KPI

## Objectif et décisions

Le PO souhaite rapprocher les cartes KPI existantes du rendu PJ2 fourni dans la conversation, tout en préservant les règles métier. Ce lot succède au bandeau Sprint compact (lot 1) ; il ne modifie **aucune source PostgreSQL, aucun calcul métier, aucune ACL et aucun instantané Vn**.

- Quatre cartes, **pas** de cinquième carte « Avancement global » sans règle approuvée.
- Les trois premières conservent exactement leurs sens : **capacité prévue / capacité réelle disponible (J/H)**, **SP initialement engagés / SP réalisés**, **tickets initialement engagés / tickets réalisés**.
- Mise en avant de la valeur initiale, séparateur fin, valeur réalisée dessous et provenance (Saisie/Calcul/Instantané de clôture) si connue.
- Pictogrammes vectoriels **Bootstrap Icons officiels**, locaux et décoratifs : `people-fill`, `stack`, `ticket-perforated-fill`, `calendar-event` ; licence existante `docs/third-party/bootstrap-icons-LICENSE.md` valable pour ces tracés supplémentaires.
- **Anneau comparatif interne facultatif**, uniquement si les deux valeurs sont disponibles, de qualité `known`, avec référence initiale strictement positive et valeur réalisée non négative. Ratio `réalisé/initial *100`, arrondi à l'unité. Si plus de 100 %, le **texte montre le pourcentage réel**, mais le remplissage de l'anneau est plafonné visuellement à 100 %.
- Le ratio de **capacité réelle/prévue** concerne uniquement la disponibilité collective, jamais l'effort produit ni une productivité ; aucune couleur « bonne/mauvaise performance ». Les deux ratios SP et tickets ne prouvent pas le nombre d'items initialement engagés qui ont été terminés (périmètre potentiellement évolutif).
- Source absente, valeur `null`, `unavailable`, qualité `estimated` ou zéro initial : **pas** de ratio ni de jauge fictive. Un zéro réel enregistré reste affiché comme **0**. Aucune reconstruction depuis un Sprint précédent.
- La comparaison avec le Sprint précédent reste distincte : **« Comparaison indisponible »** tant que ce producteur historique n'est pas raccordé.
- **Jours ouvrés restants** : grand compteur numérique et unité **jours** si valeur disponible ; sans anneau ni seuil d'alerte inventé. Le choix métier provisoire « aujourd'hui inclus » est inchangé.

## Réalisation publiée directement sur `main`

| Chemin | Fonction |
| --- | --- |
| `src/app/app/kpi-cards.tsx` | Composants `KpiMetricPair` et `KpiDeadline` : présentation sémantique `dl/dt/dd`, unité, provenance, ratio uniquement valide, textes accessibles |
| `src/lib/dashboard-metric-ratio.ts` | Fonction pure de calcul du ratio, distinctions 0/absent/estimated, dépassements de 100 % |
| `src/app/app/cycle-overview.tsx` | Raccorde les cartes au même `CollectiveCycleProjection` du Sprint précédemment sélectionné |
| `src/app/app/bootstrap-icon.tsx` | Ajout des quatre tracés Bootstrap Icons officiels, sans police ni CDN |
| `src/app/dashboard.css` | Hiérarchie typographique, anneau neutre, séparateur, icônes, responsive 4/2/1 colonnes et tokens du thème SMN |
| `src/i18n/fr.json`, `en.json` | Unité « jours » et libellés ARIA explicatifs des ratios, avec descriptions précises |
| `tests/dashboard-ux-kpi-cards.test.ts` | Assertions de rendu FR/EN, provenance, ratio nominal, absent, zéro, estimated, >100 %, 4 cartes et responsive |
| `tests/dashboard-cycle-overview.test.ts` | Révision des attentes de l'état vide sans Sprint ; ni dates ni métriques fictives |

## Critères de vérification

- AC-UX-KPI-01 : un Sprint réellement sélectionné produit **quatre** cartes avec 4 icônes Bootstrap distinctes.
- AC-UX-KPI-02 : valeurs initiales en grand, valeurs réalisées en second, labels complets et unités J/H, SP, tickets.
- AC-UX-KPI-03 : provenance et nuance `estimated` préservées.
- AC-UX-KPI-04 : ratio absent quand 0 initial, données incomplètes, non fiables ou absence de Sprint ; aucun `NaN`/`Infinity`.
- AC-UX-KPI-05 : valeur réalisée 0 affichée correctement, ratio 0 % uniquement avec initial positif réellement enregistré.
- AC-UX-KPI-06 : ratio >100 % affiché honnêtement (ex. 12 SP réalisés / 8 engagés → **150 %**), mais anneau rempli au maximum visuellement ; aucune interprétation de succès.
- AC-UX-KPI-07 : jours restants = mesure séparée, lisible en nombre de jours, libellé temporel selon statut, pas de faux feu rouge.
- AC-UX-KPI-08 : comparaisons au Sprint précédent non simulées, pas d'avancement global.
- AC-UX-KPI-09 : responsive en 4/2/1 colonnes, FR/EN, thèmes clair/sombre, focus et ARIA; jauges avec description textuelle du ratio.
- AC-UX-KPI-10 : aucune migration/écriture BD, aucune modification des calculs métier et aucune dépendance Epic 5 introduite.

## Recette utilisateur Windows

Depuis GitHub Desktop récupérer `main`, puis dans PowerShell :

```powershell
pnpm typecheck
pnpm exec tsx --test tests/dashboard-ux-kpi-cards.test.ts tests/dashboard-cycle-overview.test.ts tests/dashboard-ux-compact-sprint-header.test.ts tests/dashboard-data-contract.test.ts
pnpm exec tsx --test tests/smn-235-dashboard-projection.test.ts tests/smn-236-sprint-tickets-working-days.test.ts
pnpm build
pnpm dev
```

Comparer visuellement les quatre cartes sur un Sprint réel en FR/EN, puis sur un Sprint futur sans saisie et un Sprint clôturé. Tester initial 0 / terminé 0 / données partielles / ratio >100 (jeu d'essai), les 3 palettes et clair/sombre. Zoom 200 %, écrans 320/375/768/1280 px. Vérifier l'absence de débordement des mots longs et que les textes décrivent le taux lu par une technologie d'assistance.

**Validation exécutée à ce stade :** inspection des fichiers de `main`, contrôle statique des branches et de la parité i18n. **Non exécuté** dans le runtime de ce travail : `pnpm typecheck`, tests, build, navigateur et lecture PostgreSQL réelle. Leur succès reste à démontrer. Ne pas clôturer SMN-21 ni les Stories de données depuis ce seul lot.

## Suites

- Lot 3 : icônes Bootstrap spécifiques aux événements/ceremonies avec étiquette accessible et mapping métier.
- Lot 4 : cartes Obstacles/Risques/Notes/Alertes suivant les nouvelles sources Epic 5 ; SMN-238 reste différée.
