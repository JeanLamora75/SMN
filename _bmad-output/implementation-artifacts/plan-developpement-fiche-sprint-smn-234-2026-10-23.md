---
project: SMN
story: SMN-234
epic: SMN-228
date: 2026-10-23
language: fr
status: d0-documented-d1-d6-code-published-awaiting-local-recette
source: _bmad-output/planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/FICHE-SPRINT-CONTRAT.md
---

# SMN-234 — Plan de développement en lots de la fiche Sprint

## État initial vérifié

La route `src/app/app/admin/sprints/[sprintId]/page.tsx` **existe**, mais ne contient encore qu'une fiche collective en lecture seule (nom, dates, état et objectifs). Le système possède des producteurs de données pour objectifs, SP, tickets, réunions, J/H **de développement** et tendances de Sprints clôturés. Le rôle Utilisateur est en lecture collective ; les actions d'édition exigent des guards serveur. Les producteurs des six registres (Epic 5), la génération IA (Epic 9) et les notes de confiance / clarté du Sprint restent à construire. Les J/H de **présence** demandés ne sont pas les J/H de développement déjà exposés par `src/server/capacity/engine.ts`.

**Pas de nouveau projet, IDE, outil local ou GitHub Actions requis.** Windows 11, Node.js/pnpm, GitHub Desktop, GitHub/Jira connectés. Code sur branche dédiée + PR recommandé ; décision explicite de publication directe sur `main` reste à confirmer pour chaque développement si nécessaire. Ici : **documentation uniquement**.

## Plan — increments indépendants et critères de sortie

| Étape | Livrable fonctionnel testable | Services / dépendances | Critère de sortie |
|---|---|---|---|
| **D0 — Analyse des sources et contrats** — **audit documenté le 23/10/2026 (sans test exécuté)** | Contrat d'entrée par `sprintId`, composant fiche et modèle de droits ; matrice valeurs persistées/calculées/indisponibles ; arbitrages ouverts documentés | SMN-234, dashboards SMN-235–238, Epic 3/4 | Validation des schémas, route, RBAC, APIs et du contrat présence sans régression ; tests ciblés définis |
| **D1 — Structure et bandeau** — **code publié, recette complète en attente** | Bandeau compact nom/dates/équipe/statut et 7 onglets. Crayon sur nom/dates seulement si commandes sûres ; navigation depuis liste/dashboard, design responsive | SMN-230, SMN-232, première route déjà présente | Même `sprintId` dans tous les onglets, FR/EN, user lecture, permissions serveur, no false edit; aucune rubrique synthèse |
| **D2 — Objectifs** — **code publié, recette locale en attente** | Liste complète, ajout, édition nom/commentaire/évaluation par objectif, historique et erreurs | SMN-83 / `goals.ts` | Cas 0,1,n ; non évalué par défaut ; édition admin uniquement ; clôturé protégé ; corrections concurrentes couvertes |
| **D3 — Indicateurs** — **code publié, recette complète en attente** | 8 champs F01/F02/F03/F04/F10/F11/I01/I02 éditables et sauvegardés ; 4 dérivés F05/F06/F07/F12 recalculés en brouillon et après save | SMN-84, tickets `ticket-counts.ts`, nouvelles persistances I01/I02 | Équations vérifiées, zéro/null/dénominateur absent/dépassement ; 1..5 ; révisions et audit ; UI temps réel sans writes automatiques |
| **D4 — Cérémonies** — **code publié, recette complète en attente** | Liste exhaustive de toutes les occurrences, statuts visibles, provenance des statuts si possible, durées, actions contextuelles vers réunions/calendrier | SMN-72–81, SMN-64, travaux icônes Bootstrap par type | Tri temporel, pagination sans perte, statuts prévus/tenus/non tenus/annulés ; « ajourné » uniquement après règle validée ; DST, historique sans faux « tenue » |
| **D5 — Capacité et équipe** — **code publié, recette locale en attente** | Liste des contributeurs avec J/H de présence **principaux**, disponibilité développement secondaire et totaux explicites ; absences et contextes sans données sensibles | SMN-42–64, `src/server/capacity/engine.ts` ; **nouveau contrat de J/H présence à valider** | Membre entrant/sortant, temps partiel, absences/jour férié, demi-journée, non-calculable ; cohérence J/H et autorisation nominative |
| **D6 — Tendances graphiques** — **code publié, recette complète en attente** | Trois courbes/tableaux accessibles, cinq clôtures éligibles du même collectif (G04/G05/G06/G07) | SMN-86, `src/server/sprints/trends.ts` | 0–5 clôtures, Vn, non-comparables = null, ordre correct, i18n, unité SP/%/JH, pas de graphiques fictifs |
| **D7 — Bilan manuel / IA éditable** | Deux éditeurs enregistrant séparément Analyse et Analyse IA, côte à côte desktop, empilés mobile, révisions/audits | modèle de texte de bilan à établir ; Epic 9 **pour génération IA ultérieure** | Édition admin, cohérence attribution/provenance, versionnement, concurrent edit, historique Sprint clos, aucune fausse IA |
| **D8 — Registres** | Liste commune chronologique des six registres avec plage d'activité/ouverture pendant Sprint, fiche centrale unique, historique Vn | **Epic 5 SMN-89–112 : condition bloquante pour ce lot**, pas pour D1–D7 | Fiches avant/durant le Sprint, résolues pendant, multi-cycles, registre partiel indisponible, filtrage serveur, 0/1/>5, liens sûrs |
| **D9 — Finalisation et recette transverse** | Simplification des vieux formulaires redondants après vérification d'accès, documentation et recette navigateur Windows | D1–D8 livrés avec preuves ; rapport SMN-113 non requis pour les sept onglets | Navigation cohérente et aucun recul sur Paramètres/Calendrier/dashboard ; tests et captures réels ; tickets mis à jour sur résultats vérifiés |

**Ordre conseillé : D0 → D1 → D2 → D3 → D4 → D5 → D6 → D7 ; D8 après arrivée des registres, puis D9.** D6 peut être réalisé avant D5 si la définition exacte des J/H de présence doit être validée ; D7 n'a pas besoin d'attendre la génération IA de l'Epic 9 pour la saisie manuelle des deux blocs. Le pipeline de tests ne doit pas bloquer les petits incréments indépendants.

## Check-list BMAD à chaque livraison

- User Story / AC concernés identifiés dans les commits et les tests ; aucune modification de source collective sans garde-fou serveur.
- Avant modification : relire architecture, endpoints et tests existants, préférer réemploi à duplication.
- Ajouter tests ciblés `tests/*.test.ts`, de préférence test-first, couvrant vrais statuts, cas zéro et absence de producteur.
- Vérifier sur PC Windows : `pnpm typecheck` ; `pnpm exec tsx --test tests/<fichier>.test.ts` ; `pnpm build` ; `pnpm dev` ; recette Chrome responsive 320/375/768/1440, zoom 200 %, thèmes FR/EN, admin/user.
- **Ne pas prétendre** que ces commandes sont exécutées sans retour d'exécution. GitHub Actions indisponibles et non exigés.
- Pas de clôture Jira ni déclaration de fonctionnalité terminée sur seules vérifications de présence de fichiers. Enregistrer écarts et captures de recette.

## Arbitrages métier à valider avant les lots concernés

1. Calcul des **J/H de présence** (plages effectives, allocations, RTT/absences, inclusions fériés, arrondis, profil ayant accès au nom des membres) — avant D5.
2. Sémantique **ajournée/reportée** vs annulée/non tenue — avant étendre les statuts en D4.
3. Fréquence et historique de **Confiance / Clarté 1–5** — avant la persistance de D3.
4. Contrat de provenance, persistance et corrections **Analyse IA** — avant D7.
5. Modalité d'onglet initial et placement du bandeau — à recetter après D1, proposition Indicateurs non entérinée.

## Stratégie Jira

SMN-234 est la **Story mère UX** existante de l'Epic SMN-228. Ne pas la dupliquer dans Epic 3 : les services de membres/calendriers/capacités restent dépendances de l'Epic 3 et les données Sprint liées à SMN-4. Pour réduire la taille des livraisons, **proposer ultérieurement** le découpage D1–D9 en Stories techniques indépendantes ou sous-tâches pour acceptation utilisateur **avant leur création**, et préserver une traçabilité vers les AC de SMN-234. Ce plan n'ouvre aucun nouveau ticket, ne réalise aucun développement et ne change aucun état Jira.

## Références

- Jira : https://lmn24.atlassian.net/browse/SMN-234
- Epic : https://lmn24.atlassian.net/browse/SMN-228
- UX : `_bmad-output/planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/FICHE-SPRINT-CONTRAT.md`
- Code initial : `src/app/app/admin/sprints/[sprintId]/page.tsx`
- Validation prévue : `_bmad-output/planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/RECETTE-UX.md`


## Journal d'avancement — 23 octobre 2026

**D0 — Audit technique publié**, résultat : [audit-d0-fiche-sprint-smn-234-2026-10-23.md](audit-d0-fiche-sprint-smn-234-2026-10-23.md). Sources GitHub inspectées : fiche `[sprintId]`, index et liens, droits, API objectifs/SP/tickets/renommage/replanification/cérémonies/capacité/tendances, snapshots, lecteurs dashboard, tests existants, BMAD. Aucune mutation applicative. Résultats marquants : lecture collective différente des GET admin, événement dashboard plafonné à cinq, `pencil-square` absent, J/H de développement distincts de la présence, lecteurs legacy effectuant des DDL, données I01/I02 et analyses non persistées. **D1 peut commencer sur ce cadrage ; D1–D9 non démarrés**. Tests, `pnpm typecheck`, build, DB et navigateur **non exécutés**. Aucun statut Jira de livraison n'est changé.


## Journal D1 — 23 octobre 2026 : code publié, validation locale requise

**Livraison :** [réalisation D1](realisation-d1-fiche-sprint-smn-234-2026-10-23.md). Le bandeau compact de `src/app/app/admin/sprints/[sprintId]/page.tsx` affiche les vrais nom, dates, équipe/produit et statut ; les sept onglets sont créés, Objectifs conservé en consultation, six onglets en état honnête de préparation. Deux crayons Bootstrap déclenchent les vrais workflows administrateur : nom par PATCH, dates par prévisualisation POST/confirmation PATCH avec token, fuseau IANA et DST contrôlés. Traductions FR/EN et tests de régression ajoutés. Les écrans métier D2–D8 ne sont pas implémentés.

**Preuves limitées :** JSON FR/EN vérifiés, analyse du code et **8 contrôles unitaires isolés réussis** sur la conversion de dates (copie locale du fichier identique au blob GitHub). **Aucune exécution** de `pnpm typecheck`, `pnpm build`, tests du projet entier, PostgreSQL ou navigateur. Le lot D1 ne doit pas être considéré comme recetté ni terminé au sens Definition of Done tant que la validation locale ne réussit pas. `SMN-234` reste ouverte.


## Journal D2 — 23 octobre 2026 : gestion des objectifs raccordée

La réalisation est documentée dans [realisation-d2-objectifs-fiche-sprint-smn-234-2026-10-23.md](realisation-d2-objectifs-fiche-sprint-smn-234-2026-10-23.md). L'onglet Objectifs dispose désormais d'une liste complète, d'un bouton Ajouter en mode administrateur, de crayons d'édition par objectif, de l'évaluation et des commentaires en modal, avec révision et audit par l'API existante. La lecture commune de l'équipe est `SELECT-only` et les Sprints clôturés lisent leur dernier snapshot Vn. Le rôle `user` ne voit aucune édition. FR/EN mis à jour.

**Contrôle effectué :** revue statique 12/12 vérifications positives ; **aucune exécution** de `pnpm typecheck`, `tsx --test`, build, DB ou navigateur. **D1 et D2 codés, non recettés.** La prochaine étape de code prévue reste **D3 — Indicateurs**, après le contrôle de non-régression et la résolution des écarts rencontrés.


## Journal D3 — 23 octobre 2026 : Indicateurs codés et noyau calculé vérifié

La réalisation D3 est décrite dans [realisation-d3-indicateurs-fiche-sprint-smn-234-2026-10-23.md](realisation-d3-indicateurs-fiche-sprint-smn-234-2026-10-23.md). Huit valeurs éditables F01/F02/F03/F04/F10/F11/I01/I02, quatre dérivés F05/F06/F07/F12 mis à jour immédiatement dans les brouillons, stockage historisé des notes 1–5, snapshots Vn et lecture collective SELECT-only sont publiés sur `main`. La source SP dérivée est partagée avec le moteur d'origine. Les anciens formulaires de bilan ne sont pas supprimés.

**Contrôles effectués :** revue statique 18/18 ; compilation TypeScript isolée d'une copie du module pur authentifiée par SHA Git `22e0f92...` ; **14/14 assertions isolées réussies sous Node.js 22**. **Non exécutés :** `pnpm typecheck` global, tests du dépôt `tsx --test`, `pnpm build`, base PostgreSQL et recette navigateur. D1–D3 sont **développés mais non recettés**, la Story globale reste ouverte. **Suite prévue : D4 — Cérémonies.**


## Journal D4 — 23 octobre 2026 : cérémonies, statuts et pagination

**Rapport de livraison :** [realisation-d4-ceremonies-fiche-sprint-smn-234-2026-10-23.md](realisation-d4-ceremonies-fiche-sprint-smn-234-2026-10-23.md).

L'onglet Cérémonies consulte les trois sources (standards, personnalisées, exceptionnelles) en **tri chronologique et pages de 25**, sans réutiliser le plafonnement à cinq du tableau de bord. Le statut réel est mis en évidence (prévue/tenue/non tenue/annulée/inconnu) ; une tenue automatique ou une réunion reconstituée n'est **jamais** présentée comme attestation de participation. Durées prévues et réelles distinctes, liens vers les fiches Réunion, dates IANA/FR-EN ; sur clôture, dernier snapshot Vn strict. Schéma historique partiel signalé. La page Réunion standard n'affiche plus arbitrairement « unknown » quand la colonne métier est installée. **Ajournée/Reportée n'est pas encore un statut métier : arbitrage toujours ouvert.**

**Qualité :** 18/18 contrôles statiques réussis ; **compilation TypeScript isolée du module pur** et **14/14 assertions réellement exécutées sous Node.js 22**, SHA Git identique au blob publié. **Non effectués :** tests `tsx --test` du projet, `pnpm typecheck`, build, DB/Next.js, navigateur. **D1–D4 codés sur main, en attente de recette locale** ; SMN-234 reste ouverte. Suite **D5 — Capacité des membres et présence J/H**.


## Journal D5 — 23 octobre 2026 : présence et membres de la fiche Sprint

[Rapport de réalisation D5](realisation-d5-capacite-presence-fiche-sprint-smn-234-2026-10-23.md). Onglet Capacité publié : membres affectés pendant la période, J/H de **présence estimée** mis en avant (demi-journées calendaires disponibles / 2, avec absences, jours fériés et fermetures), J/H **de développement** en deuxième colonne, total seulement si toutes les données sont calculables. Aucun abattement via `developerPercent`, `allocationPercent` ni `contributionPercent`, pas de présence effective inventée. Temps partiel : le calendrier personnel doit représenter les demi-journées prévues (arbitrage de cohérence avec `contractPercent` encore ouvert).

**Droits :** le rôle utilisateur en lecture collective ne reçoit **aucune donnée nominative**, réservée à `read members`/admin ; `readSprintMemberPresence` n'est appelé que si autorisé. **Historique :** les nouveaux snapshots Vn incorporent `memberPresence` ; les anciens snapshots sans ce champ restent indisponibles au lieu d'être recalculés selon les calendriers actuels.

**Preuves :** 22/22 vérifications statiques ; copie exacte du module pur (SHA Git `a8fbdd8be09f556d81befc8167b566f7868e37a3`) compilée en TypeScript strict, **9/9 assertions isolées effectivement exécutées/réussies**. **Non effectués :** tests intégrés `tsx --test`, `pnpm typecheck` du projet, `pnpm build`, DB/Next.js et navigateur. **D1–D5 codés, non recettés**. Suite **D6 — Tendances graphiques**.


## Journal D6 — 23 octobre 2026 : trois tendances G05/G06/G07

[Rapport de réalisation D6](realisation-d6-tendances-fiche-sprint-smn-234-2026-10-23.md). L'onglet Tendances utilise le socle G04, **au plus cinq Sprints clôturés** de la même équipe jusqu'au Sprint de référence. Trois graphiques SVG natifs (SP terminés, % réalisation, capacité réelle J/H) et leur **tableau accessible**. G07 lit le snapshot `capacity.actual_jh` et **ne réutilise pas les J/H de présence D5**. Zéro réel conservé, manque = `null`, courbes interrompues, taux >100% conservés et Vn la plus récente strictement respectée. `readSprintTrends` ne fait désormais **aucun DDL à la lecture**, même depuis l'ancien écran admin. Aucun nouveau paquet graphique.

**Preuves :** 16/16 contrôles statiques GitHub ; deux modules recopiés dont SHA Git concordant (`sprint-trend-geometry.ts` et `trends.ts`), **compilation TypeScript stricte isolée réussie** ; **14 assertions graphiques + 28 assertions lecteur/projection réellement exécutées et réussies**, avec Client PG simulé. **Non exécutés :** `pnpm typecheck` du projet, `tsx --test` de la suite D6, build, PostgreSQL/Next.js et recette navigateur. **D1–D6 codés sur `main`, en attente de recette** ; SMN-234 ouverte. Suite **D7 — Bilan**.
