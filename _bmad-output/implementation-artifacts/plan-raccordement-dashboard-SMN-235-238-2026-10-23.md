---
project: Scrum Master Notebook
language: fr
date: 2026-10-23
status: stories-creees-planification-a-developper
scope: MVP Scrum
parent_story: SMN-21
stories: [SMN-235, SMN-236, SMN-237, SMN-238]
branch: docs/bmad-dashboard-raccordement-20261023
---

# SMN — Contrat BMAD : raccordement des données du tableau de bord

## Décision produit du 23 octobre 2026

L'utilisateur autorise la formalisation dans **Jira et BMAD** de quatre Stories de raccordement du cockpit SMN et la préparation d'un plan par étapes. Aucun développement, modification de base, test Node/PostgreSQL, fusion dans `main` ni changement de statut des Stories sources ne sont réalisés par cet acte.

Les contrats UX **DESIGN.md** et **EXPERIENCE.md** validés le 21/10/2026 restent normatifs. La sélection du Sprint du header a été réparée avec la PR #104 ; cela n'atteste pas du raccordement des métriques. SMN-21 demeure la Story intégratrice transversale.

### Jira : lots et Epics

| Lot | Jira | Epic parent | Valeur | Source(s) métier / dépendances |
|---|---|---|---|---|
| L1 | [SMN-235](https://lmn24.atlassian.net/browse/SMN-235) | [SMN-1](https://lmn24.atlassian.net/browse/SMN-1) | Objectifs, capacités initiale/réelle J/H, SP initialement engagés/terminés | SMN-21, SMN-83/84/85, SMN-57 à SMN-60 |
| L2 | [SMN-237](https://lmn24.atlassian.net/browse/SMN-237) | SMN-1 | Cérémonies issues des modèles et réunions exceptionnelles dans Événements | SMN-64, SMN-77/78/79, calendrier et fiches existantes |
| L3 | [SMN-236](https://lmn24.atlassian.net/browse/SMN-236) | SMN-1 | Tickets agrégés initial/terminés et compteur des jours ouvrés restants | SMN-21 ; source des comptes tickets à vérifier/définir |
| L4 | [SMN-238](https://lmn24.atlassian.net/browse/SMN-238) | [SMN-5](https://lmn24.atlassian.net/browse/SMN-5) | Obstacles, risques, notes/alertes, faits marquants dans les colonnes | SMN-89/90, SMN-92–94/97, SMN-104, SMN-106–108, SMN-111/112 |

**Pourquoi SMN-238 dans Epic 5 ?** Les registres et le cockpit « Points d'attention » sont produits par Epic 5. SMN-238 est seulement **leur projection vers les colonnes du dashboard de SMN-21**. Aucun doublon avec la surveillance métier SMN-104. Les événements de calendrier sont distincts des faits marquants des registres.

## Analyse de l'existant — vérifiée dans `main`

- `src/server/dashboard/read.ts` : `currentCycle:null`, `objectives:[]`, `metrics:[]`, `events:[]`, `attention:[]` sont des valeurs de structure, **pas des données connectées**.
- `src/app/app/page.tsx` : Sprint actif et `cycleId` de sélection effectivement reliés au bandeau.
- `src/app/app/cycle-overview.tsx` : objectifs et métriques encore en états fixes « non renseigné/source non raccordée » ; compteur des jours non calculable.
- `src/app/app/operational-overview.tsx` : quatre colonnes UX statiques, sources encore indisponibles.
- `src/server/sprints/goals.ts` : `readSprintGoals` et source `smn_sprint_goal`.
- `src/server/sprints/story-points.ts` : `readStoryPoints` et source `smn_sprint_story_points`.
- `src/server/sprints/review-capacity.ts` : `readSprintCapacityReview` et services capacity initial/actual.
- `src/server/sprints/context.ts` : liste non paginée des Sprints autorisés pour l'équipe unique du MVP.
- `src/server/sprints/template-occurrences.ts` et `src/server/sprints/exceptional-meetings.ts` : occurrences de cérémonies et réunions exceptionnelles.
- **Aucun producteur fiable de la carte Tickets du cockpit Scrum n'a été vérifié** : ne jamais déduire ses valeurs des SP, d'une liste Jira ou d'un autre compteur.
- Les registres qualitatifs de l'Epic 5 sont largement **à faire** dans Jira ; ne pas simuler des risques, notes ou obstacles en attendant.

**Point de vigilance technique :** certaines fonctions `readSprintGoals` et `readStoryPoints` appellent encore `ensure...Schema` (DDL à l'exécution). Le raccordement du dashboard **ne doit pas les appeler directement dans une transaction strictement en lecture seule sans séparer cette étape**. Préférer une projection SQL de lecture sûre sur tables existantes (avec détection contrôlée des schémas) ou refactorer préalablement les fonctions `ensure` sans changement des contrats métier. Ne jamais faire de `CREATE TABLE`, `ALTER`, `INSERT`, `UPDATE`, `DELETE` ou réconciliation de Sprint pendant une lecture du dashboard.

## Ordre conseillé pour Amelia — progression et points de contrôle

### Étape 0 — Préparation de l'intégration, sans développer de KPI

1. Synchroniser `main` et lire le code source réel, les quatre Stories Jira et les contrats UX.
2. Dresser la matrice **source SQL → règle métier → valeur/provenance → cycle sélectionné → composant UI** pour chaque information.
3. Valider les protections des anciennes données et des snapshots de Sprint clôturé ; détecter les tables absentes, sans migration implicite.
4. Prévoir un contrat TypeScript de projection collective nullable au lieu de recopier la structure statique dans plusieurs composants.
5. Conserver un fonctionnement isolé pour chaque lot, avec tests et merge dédiés seulement après recette utilisateur.

**Sortie attendue :** mapping vérifié, risques de mutation en lecture résolus, base de tests de Sprint A/B et données partielles.

### Étape 1 — SMN-235 : objectifs, capacité, SP

- Lire un Sprint autorisé de bout en bout et ses objectifs **multiples**.
- Afficher capacité initialement retenue vs réelle en **J/H**, garder source/qualité, respect des règles de gel.
- Afficher SP **initialement engagés** et SP **terminés**, distincts des SP ajoutés/retirés et de l'engagement final.
- Valeur 0 explicite ≠ null ≠ estimation ≠ erreur ; données historiques clôturées depuis version applicable seulement.
- Mise à jour atomique des valeurs affichées en cas de changement de `cycleId` et liens vers les bilans.
- **Porte de recette :** sélectionner Sprint 1 puis Sprint 2, vérifier exactement le nom, les objectifs, les deux J/H et les deux SP enregistrés dans le bilan (sans donnée d'un autre Sprint).

### Étape 2 — SMN-237 : événements et cérémonies

- Raccorder la **seule source modèle actif** utilisée par les cérémonies des nouveaux Sprints, plus les réunions exceptionnelles ; préserver lecture des anciennes données si elles existent.
- Afficher au plus 5 événements éligibles et un compteur fiable ; accès à la fiche existante dans le même contexte.
- Séparer statut réel de tenue, occurrence programmée et occurrence historique reconstituée ; fuseaux et dates locales.
- **Porte de recette :** le Sprint choisi dans le header affiche ses vraies réunions dans le dashboard, sans duplication ni génération supplémentaire ; changer de Sprint met les événements à jour.

### Étape 3 — SMN-236 : tickets agrégés et échéance

- **Sous-étape 3A :** identifier la vraie source des tickets agrégés Scrum ; si absente, documenter le plus petit contrat de saisie agrégée et son emplacement métier **avant de créer la table/les formulaires** ; ne pas ouvrir la portée à Jira ni à des tickets unitaires.
- **Sous-étape 3B :** connecter les comptes initialement engagés/terminés ; protéger engagement initial, zéro explicite, null et historiques.
- **Sous-étape 3C :** calculer jours ouvrés restants lundi-vendredi, fuseau local du Sprint, bornes `[début,fin)`, sans jours négatifs. **Arbitrage à confirmer avec le Product Manager : jour courant inclus s'il reste ouvrable, ou comptage des seuls jours complets futurs.** Ne pas improviser cette règle.
- **Porte de recette :** compteur vérifié sur un vendredi, un dimanche, début/fin de cycle et Sprint terminé ; valeurs de tickets conformes à la source agrégée approuvée.

### Étape 4 — SMN-238 : registres et alertes (après leurs producteurs)

- Attendre les premières vues de lecture collectives livrées dans Epic 5, puis raccorder colonne par colonne, **sans bloquer l'usage des autres colonnes**.
- Filtre statut non clos/non terminé, association au Sprint, criticité/tri UX, 5 fiches maximum, compteur, Voir tout, Ajouter selon autorisation et disponibilité réelles.
- Aucune fiche absente matérialisée comme « zéro » si son producteur n'est pas livré.
- Historique : données courantes pour cycle ouvert/rouvert, clichés V1/V2 pour clôturés, selon réalisation effective de SMN-111/112 ; aucune rétroprojection de l'état actuel comme ancien état.
- **Porte de recette :** risques/obstacles/notes d'un Sprint A ne se retrouvent pas arbitrairement sur B ; correction et clôture ne changent pas l'état passé figé.

### Étape 5 — Validation transversale et clôture progressive de SMN-21

- Tester les deux rôles `admin`/`user` ; sécurité serveur, aucune donnée membre personnelle dans la projection collective.
- Vérifier FR/EN depuis `src/i18n/fr.json` / `en.json` ; 4/2/1 colonnes, clavier, repli responsive, absence de faux boutons actifs.
- Tests Node.js ciblés + `pnpm typecheck`, `pnpm test`, `pnpm build` sur le PC Windows quand disponibles ; recette navigateur et PostgreSQL réels.
- Vérifier `cycleId` explicite et par défaut, Sprint en cours/futur/terminé/clôturé, données null/0/estimées, erreurs, pas de mutation de lecture.
- Conserver **SMN-86** pour les tendances de cinq clôtures et comparaison historique ; le raccordement au dashboard devra être contrôlé au moment de SMN-21, sans prétendre que ces quatre Stories le couvrent déjà.
- Ne déclarer SMN-21 entièrement terminée que lorsque ses critères UX et tous les producteurs livrables ont passé leurs tests et la recette utilisateur.

## Synthèse des dépendances et priorités

`SMN-235` et `SMN-237` constituent les **premiers gains d'usage** sur l'installation Scrum, car des producteurs existent dans le code. `SMN-236` est conditionnée par la source Tickets et un arbitrage mineur sur la convention du compteur. `SMN-238` dépend des registres Epic 5 et de leurs snapshots.

Pas de travaux SAFe/ART ni d'intégration Jira automatique dans ces Lots. Kanban possède ses métriques et contrats spécifiques (Epic 7) et ne doit pas recevoir de faux SP Scrum.

## Documents de référence

- [Story dashboard SMN-21](https://lmn24.atlassian.net/browse/SMN-21) ; [Story cockpit qualitatif SMN-104](https://lmn24.atlassian.net/browse/SMN-104).
- [DESIGN.md](../planning-artifacts/ux-designs/ux-SMN-2026-10-21/DESIGN.md) et [EXPERIENCE.md](../planning-artifacts/ux-designs/ux-SMN-2026-10-21/EXPERIENCE.md) — contrats UX du 21 octobre.
- `_bmad-output/implementation-artifacts/spec-smn-21-tableau-de-bord.md` — état de SMN-21.
- `_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ARCHITECTURE-SPINE.md` — lecture collective, provenance, snapshots, accès et calendrier.

## État de réalisation

**Jira :** quatre Stories créées et rattachées aux Epics identifiées ; critères d'acceptation inscrits.  
**BMAD :** contrat et séquencement publiés dans une branche documentaire dédiée en attente de fusion.  
**Développement :** non commencé dans ce lot. **Tests :** non exécutés. **`main` :** inchangée.
