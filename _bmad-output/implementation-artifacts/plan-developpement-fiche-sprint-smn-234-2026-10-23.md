---
project: SMN
story: SMN-234
epic: SMN-228
date: 2026-10-23
language: fr
status: d0-documented-d1-implemented-awaiting-local-validation
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
| **D2 — Objectifs** | Liste complète, ajout, édition nom/commentaire/évaluation par objectif, historique et erreurs | SMN-83 / `goals.ts` | Cas 0,1,n ; non évalué par défaut ; édition admin uniquement ; clôturé protégé ; corrections concurrentes couvertes |
| **D3 — Indicateurs** | 8 champs F01/F02/F03/F04/F10/F11/I01/I02 éditables et sauvegardés ; 4 dérivés F05/F06/F07/F12 recalculés en brouillon et après save | SMN-84, tickets `ticket-counts.ts`, nouvelles persistances I01/I02 | Équations vérifiées, zéro/null/dénominateur absent/dépassement ; 1..5 ; révisions et audit ; UI temps réel sans writes automatiques |
| **D4 — Cérémonies** | Liste exhaustive de toutes les occurrences, statuts visibles, provenance des statuts si possible, durées, actions contextuelles vers réunions/calendrier | SMN-72–81, SMN-64, travaux icônes Bootstrap par type | Tri temporel, pagination sans perte, statuts prévus/tenus/non tenus/annulés ; « ajourné » uniquement après règle validée ; DST, historique sans faux « tenue » |
| **D5 — Capacité et équipe** | Liste des contributeurs avec J/H de présence **principaux**, disponibilité développement secondaire et totaux explicites ; absences et contextes sans données sensibles | SMN-42–64, `src/server/capacity/engine.ts` ; **nouveau contrat de J/H présence à valider** | Membre entrant/sortant, temps partiel, absences/jour férié, demi-journée, non-calculable ; cohérence J/H et autorisation nominative |
| **D6 — Tendances graphiques** | Trois courbes/tableaux accessibles, cinq clôtures éligibles du même collectif (G04/G05/G06/G07) | SMN-86, `src/server/sprints/trends.ts` | 0–5 clôtures, Vn, non-comparables = null, ordre correct, i18n, unité SP/%/JH, pas de graphiques fictifs |
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
