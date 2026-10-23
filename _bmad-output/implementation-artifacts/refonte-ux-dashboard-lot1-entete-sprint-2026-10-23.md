---
project: Scrum Master Notebook
date: 2026-10-23
language: fr
change: ux-dashboard-lot-1
status: implémentation-publiée-main-recette-locale-en-attente
scope: header-sprint-compact;objectif-sprint;fiche-sprint-lecture-seule
dependencies: [SMN-21, SMN-235]
subsequent_lots: [cartes-KPI,icones-evenements,registre-Epic-5]
---

# Refonte UX du dashboard — Lot 1 : bandeau Sprint compact et fiche

## Origine et décision

Comparaison par l'utilisateur de deux captures le 23 octobre 2026 : son dashboard actuel (PJ1) et la maquette souhaitée (PJ2). Validation explicite de l'implémentation du premier lot.

**Décisions fonctionnelles :**
1. Diminuer nettement la hauteur du bloc Sprint, sans sacrifier les informations de pilotage.
2. Répartir le bandeau en trois zones desktop : **Sprint + dates + statut** / **objectif(s) du Sprint** / **bouton de consultation de la fiche du Sprint**.
3. Remplacer les informations répétitives « Sprint sélectionné dans le contexte de pilotage » et « Consulter la fiche équipe » par un accès principal à la **fiche Sprint** quand un Sprint est sélectionné.
4. Utiliser des **tracés officiels Bootstrap Icons** (calendrier, cible, flèches), embarqués en SVG via un composant local. Aucun CDN ni police extérieure. Licence MIT conservée dans `docs/third-party/bootstrap-icons-LICENSE.md`.
5. Garder l'état sans Sprint honnête et une navigation de secours vers l'équipe ; ne pas proposer de fiche inexistante.
6. Respecter les styles thématiques existants et les 3 palettes, les textes FR/EN centralisés et les grilles adaptatives au zoom/mobile.
7. **Objectifs multiples :** la source métier SMN-235 autorise plusieurs objectifs. Ne pas inventer d'objectif principal. Montrer le premier selon l'ordre métier déjà lu, signaler s'il existe d'autres objectifs, et exposer la liste intégrale dans la fiche.
8. **Données absentes :** collection fiable vide → « Objectif non renseigné » ; source non disponible → « Non disponibles ». Pas d'objectif fictif, ni d'état fictif.

## Code publié directement sur `main`

| Fichier | Portée |
|---|---|
| `src/app/app/cycle-overview.tsx` | Nouveau bandeau condensé en trois zones, nom/date/statut, première entrée de la liste réelle d'objectifs, lien contextualisé |
| `src/app/dashboard.css` | En-tête 3 zones, espacement compact, contrastes sémantiques, repli à 950px et 650px de largeur de contenu |
| `src/app/app/bootstrap-icon.tsx` | Composant d'icônes vectorielles Bootstrap officielles, décoratives et masquées à l'accessibilité |
| `src/lib/sprint-detail-path.ts` | Route de détail centralisée et encodage de l'identifiant du Sprint |
| `src/app/app/admin/sprints/[sprintId]/page.tsx` | **Première vraie fiche Sprint en lecture seule**, contrôlée par RBAC, filtrage du Sprint à l'équipe autorisée, reprise des objectifs et des instantanés clôturés par la projection existante, retour au tableau de bord filtré |
| `src/app/app/admin/sprints/sprint-index-view.tsx` | Le nom du Sprint dans la liste devient un lien vers sa fiche |
| `src/i18n/fr.json`, `src/i18n/en.json` | Terminologie du bandeau, liste d'objectifs et première fiche |
| `docs/third-party/bootstrap-icons-LICENSE.md` | Notice MIT relative aux tracés SVG officiels |
| `tests/dashboard-ux-compact-sprint-header.test.ts` | Rendu SSR et tests de structure/permissions/objectif(s)/responsivité et navigation |
| `tests/dashboard-cycle-overview.test.ts` | Ancien test ajusté : pas de dates fictives lorsque aucun Sprint n'existe |

La nouvelle route `/app/admin/sprints/[sprintId]` est **accessible aux rôles admin et user en lecture** mais ne fournit aucune action d'écriture. Bien que située sous le segment URL de gestion des Sprints déjà existant, l'accès est explicitement contrôlé comme **lecture collective**, puis filtré par équipe côté serveur. Un identifiant inconnu ou appartenant à une autre équipe renvoie 404 sans divulgation. La page ne crée ni ne modifie un Sprint.

## Critères de recette

- **AC-UX-01** — Un Sprint existant présente un bandeau significativement moins haut que PJ1, avec nom, dates locales et statut visibles sans information répétitive.
- **AC-UX-02** — En présence d'un objectif réel, celui-ci apparaît dans le bandeau et dans la fiche.
- **AC-UX-03** — En présence de plusieurs objectifs, le premier est montré avec un compteur d'objectifs supplémentaires, et la fiche reprend **tous** les objectifs en lecture seule.
- **AC-UX-04** — Aucune source/aucun objectif produit un état honnête. Le bandeau n'invente pas un objectif à partir du nom du Sprint.
- **AC-UX-05** — « Voir le détail du sprint » ouvre une route réelle de la fiche associée au Sprint sélectionné ; le nom d'un Sprint dans la liste ouvre la même fiche.
- **AC-UX-06** — Le bouton « Retour au tableau de bord » conserve `teamId` et `cycleId`.
- **AC-UX-07** — `user` accède à la consultation sans pouvoir écrire ; ID forgé/hors équipe interdit.
- **AC-UX-08** — Bootstrap Icons locales, zoom clavier/focus, messages traduits FR/EN, absence de défilement horizontal imposé à 320/375/768 px.
- **AC-UX-09** — Aucun changement aux calculs KPI, cérémonies ou registres ; aucune migration PostgreSQL.
- **AC-UX-10** — L'état sans Sprint demeure correct, avec accès à l'équipe et sans lien de fiche fictive.

## À réaliser sur Windows 11 après GitHub Desktop

```powershell
pnpm typecheck
pnpm exec tsx --test tests/dashboard-ux-compact-sprint-header.test.ts tests/dashboard-cycle-overview.test.ts tests/smn-235-dashboard-projection.test.ts
pnpm exec tsx --test tests/dashboard-transversal-step5.test.ts
pnpm build
pnpm dev
```

Recette navigateur : vérifier un Sprint actif, un Sprint futur et un Sprint clôturé, un Sprint sans objectif, un avec plusieurs objectifs, le passage FR/EN et thèmes clair/sombre. Vérifier aussi le bouton vers la fiche, le retour et le clic sur un nom dans la liste ; tester 320/375/768/1280 px.

**Limite :** l'environnement ChatGPT ne donne pas accès au dépôt complet avec ses dépendances Node ni à la base Windows de l'utilisateur. Les tests sont écrits et les modifications vérifiées par lecture GitHub ; **`pnpm typecheck`, `pnpm test`, `pnpm build` et recette PostgreSQL / navigateur n'ont pas été exécutés**. Aucun ticket Jira n'a été clôturé ou modifié par cette intervention.

## Lots à ne pas mélanger

- Lot 2 : ergonomie et pictogrammes Bootstrap Icons dans les cartes KPI.
- Lot 3 : pictogrammes Bootstrap Icons propres aux types de cérémonies/événements ; sélection des icônes dans les modèles sera une future fonctionnalité dédiée.
- Lot 4 : signalétique de priorité et cartes des registres, après livraison des producteurs dans Epic 5 (SMN-238).

L'objectif de cette livraison est **la qualité visuelle et l'accès réel au Sprint**, sans fabriquer les données de la maquette cible.
