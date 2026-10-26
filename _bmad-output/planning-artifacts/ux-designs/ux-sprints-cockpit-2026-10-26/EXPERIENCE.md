# EXPERIENCE.md — Index Sprints, présentation Cockpit Agile

**Statut : Option A approuvée pour le visuel uniquement (26/10/2026).** Complément à [EXPERIENCE Sprints 23/10](../ux-sprints-pilotage-2026-10-23/EXPERIENCE.md), qui conserve l'autorité sur les comportements. [DESIGN.md](DESIGN.md) décrit l'habillage.

## Foundation
Web responsive SMN sous Windows 11 prioritaire ; shell global conservé, Bootstrap, FR/EN, thèmes configurables, permissions admin/user. Aucune nouvelle capacité fonctionnelle.

## Information Architecture
Même route `/app/admin/sprints`, même équipe source et liste paginée. Les trois zones visuelles hero / filtres / tableau remplacent les groupements actuels, sans ajouter d'écran ni de route.

## Voice and Tone
« Sprints de l'équipe », « Reprise historique », « Générer des sprints », « Filtres et recherche », « Actualiser », « Sprint », « Période », « État », « Actions ». Garder les libellés métier déjà traduits ; ajouter uniquement les clés FR/EN réellement indispensables. Ne pas annoncer « Calendrier disponible » si le contrôle actuel signale une navigation en attente.

## Component Patterns
Les pastilles d'état sont un **présentoir** du filtre `status` déjà fourni par l'index ; sélection synchronisée avec les valeurs et la requête URL déjà interprétées (sans changer format des URL, ni leur priorité). À défaut d'un état dans les pastilles, le présenter dans une commande accessible, pas le supprimer. Le tri `priority/newest/oldest` reste identique, sprint courant en tête sous `priority`.

Reprise historique et Générer conservent leurs liens ; actions en ligne conservent leurs effets **tels qu'implémentés**, y compris l'avertissement « calendrier à venir », le lien vers outils de gestion, et l'ouverture existante de fiche par le nom. Aucun comportement à arbitrer ici.

## State Patterns
États chargement/erreur/aucun résultat/liste vide/conflit de plusieurs actifs/statut non vérifié/lecture seule restent visibles, informatifs et atteignables au clavier. `total` et `teamName` doivent venir du producteur déjà existant ; erreur de chargement ≠ zéro résultat.

## Interaction Primitives
Conserver Enter/Tab/Escape selon les contrôles existants, focus lisible, pas de modification de permissions ou d'événements clavier. Si filtres secondaires repliables sur mobile : leur état n'annule pas les filtres appliqués, et un bouton annonce son état déployé/replié.

## Accessibility Floor
Contraste en clair et sombre, zoom 200 %, labels explicites pour Calendrier provisoire et ⋯, statut jamais représenté par seule couleur, `role=status` des totaux chargement inchangé, clics et liens distincts. Tests sur 320/375/390/768/1024/1440 px et clavier.

## Key Flows (non modifiés)
1. **Chercher** un sprint par son nom, voir la liste filtrée, changer le tri et paginer.
2. **Lire** les sprints courants et terminés ; identifier l'actuel au libellé et à l'accent doux.
3. **Consulter** une fiche existante en cliquant son nom — sans changer la destination réelle.
4. **Utiliser** les boutons et messages de l'index tels qu'ils existent ; les améliorations de navigation sont **reportées** à une décision UX ultérieure.

## Non-régression critique
Conserver les URL, la taille de page et le comportement de chargement, les anciens outils de gestion, les erreurs, les droits, les états suspendus/inhabituels, les mécanismes d'historique. Ne pas introduire de mutation en base lors de la consultation ni toucher aux scripts de migration.

## Responsive & Platform
Même liste métier réorganisée visuellement sur petit écran ; pas d'onglet Cartes. Les pastilles peuvent devenir un sélecteur natif sur smartphone ; aucune date ni action masquée.

**Priorité documentaire** : [UX référentiel](../../../../docs/UX-REFERENTIEL-BMAD.md) et [contrat fonctionnel Sprints](../ux-sprints-pilotage-2026-10-23/EXPERIENCE.md) prévalent pour les interactions. Aucun workflow BMAD exécuté localement, aucun test applicatif revendiqué par Sally.
