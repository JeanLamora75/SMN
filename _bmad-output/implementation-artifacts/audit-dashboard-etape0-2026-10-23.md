---
project: Scrum Master Notebook
date: 2026-10-23
language: fr
scope: "SMN-21 / SMN-235 à SMN-238"
status: "audit-source-realise; garde-fous-d-implementation-a-verifier"
publication: main
---

# SMN — Étape 0 : audit des producteurs, de la lecture et de la traçabilité du dashboard

## 1. Portée et résultat

**Périmètre autorisé :** préparation technique avant de commencer SMN-235, sans brancher de KPI réel ni modifier le schéma PostgreSQL. L'utilisateur demande désormais une publication **directement dans `main`**, sans travail par PR à gérer.

**Réalisé :**
- Inspection des sources de `main` : dashboard, Sprint, objectifs, SP, capacités, événements, clôtures et permissions.
- Contrat TypeScript pur `src/lib/dashboard-data-contract.ts`, couvrant les sections collectives et les états des données.
- Tests unitaires de ce contrat `tests/dashboard-data-contract.test.ts` rédigés, **non exécutés sur le poste utilisateur**.
- Matrice de raccordement et garde-fous ci-dessous, utilisables pour le développement de SMN-235.

**Non réalisé :** raccordement des services SQL aux cartes, changement de calcul de capacité, migration des données, modifications des anciennes clôtures, tests PostgreSQL et tests d'intégration navigateur.

## 2. Matrice source métier → projection collective → carte

| Donnée / carte | Fait vérifié dans le code | Tables / données pertinentes | Intégration autorisée | Contrôles requis |
| --- | --- | --- | --- | --- |
| Équipe / Sprint | `readCollectiveDashboard`, `readSprintContext` et `selectedSprint` | `smn_installation`, `smn_team`, `smn_sprint` | Conserver le `teamId/cycleId` unique et le Sprint réel choisi | Périmètre installation/équipe ; exclure `deleted_at` ; lectures sans mutation |
| Objectifs | `readSprintGoals` dans `src/server/sprints/goals.ts` | `smn_sprint_goal` : `title`, `evaluation`, `revision` | SMN-235 : liste complète et états, puis présentation UX synthétique | `readSprintGoals` appelle `ensureSprintGoalsSchema` (DDL) ; découpler avant lecture cockpit |
| Story Points | `readStoryPoints` dans `story-points.ts` | `smn_sprint_story_points` : `initial_sp`, `added_sp`, `removed_sp`, `done_sp` | SMN-235 : **initial_sp** et **done_sp**, jamais `final` à la place de l'initial | `readStoryPoints` appelle `ensureStoryPointsSchema` ; bigint SQL retourné en texte, conversion sûre ; 0 ≠ null |
| Capacité initiale | `readInitialSnapshot` dans `capacity/opening.ts` | `smn_capacity_initial_snapshot`, `smn_capacity_period_override` | SMN-235 : `initialJh` figé à l'ouverture, avec provenance | Ne pas recalculer une valeur initiale absente à partir des absences ultérieures ; ne pas exposer les membres |
| Capacité réelle | `readSprintCapacityReview` et `readActualCapacity` | `smn_capacity_actual_override`, `smn_capacity_actual_snapshot`, moteur `readDevelopmentCapacity` | SMN-235 : réel retenu, source `Saisie`/`Calcul`/`Non renseigné` et qualité | `review-capacity.ts` appelle `ensureSprintSchema` ; `readActualCapacity` **ouvre et clôt sa propre transaction READ ONLY** ; refactorer avant transaction globale |
| Clôture Sprint | `listSprintClosures` / `snapshot` dans `sprints/closure.ts` | `smn_sprint_closure_snapshot` : `version`, `snapshot` JSONB | SMN-235/238 : préférer le **dernier instantané Vn** pour un Sprint clôturé | `listSprintClosures` appelle `ensureClosureSchema` ; snapshot inclut objectifs, SP, capacités et événements ; ne pas afficher l'état courant comme historique |
| Événements du Sprint | `template-occurrences.ts`, `exceptional-meetings.ts`, calendrier central | `smn_scrum_template_occurrence`, `smn_sprint_exceptional_meeting` et `smn_sprint_ceremony` historique | SMN-237 : réunir les occurrences réellement enregistrées, max 5 en aperçu | `ensureTemplateOccurrenceSchema` et `ensureExceptionalMeetingSchema` peuvent écrire ; `generation_source=reconstructed` n'est pas une preuve de tenue |
| Tickets initial / terminés | Carte UX présente ; **pas de producteur Scrum collectif fiable confirmé lors de cet audit ciblé** | Contrat métier à confirmer | SMN-236 : source agrégée explicite, sans dériver des SP ni ouvrir Jira | Vérifier les tables et écrans avant schéma minimal, ne jamais afficher un faux zéro |
| Jours ouvrés restants | Carte statique dans `cycle-overview.tsx`; calendrier équipe existant | Bornes Sprint, zone IANA ; jours ouvrés lundi-vendredi | SMN-236 : calcul pur de la période, non capacité humaine | Inclure/exclure aujourd'hui à arbitrer avant codage ; éviter valeurs négatives et erreur DST |
| Obstacles / risques / notes | `operational-overview.tsx` présente actuellement des états indisponibles | Producteurs Epic 5 non tous livrés | SMN-238 : connecter après disponibilité réelle et règles de clôture Vn | Pas de fiche fictive ; tri, permissions, provenance historique ; SMN-104 reste le cockpit métier de l'Epic 5 |
| Comparaisons | Présentation UX, pas de projection du précédent fiabilisée | SMN-86 (comparaison/tendances) | Intégration différée avant clôture complète SMN-21 | Ne comparer que les cycles/données comparables, pas de moyenne SP multiéquipe |

### Attention aux bornes de capacité

La fonction `readSprintCapacityReview` forme actuellement `start_on/end_on` via la date locale du `start_at/end_at` et transmet l'intervalle au moteur de capacité **inclusif**. Les bornes Sprint sont conceptuellement `[start_at,end_at)`. Lorsqu'un Sprint se termine exactement au début d'un jour local, la date terminale inclusive doit être vérifiée pour éviter une journée ajoutée. Ce point est un **risque de vérification**, non un bug reproduit sur PostgreSQL dans cette session.

## 3. Écart structurant : lectures actuellement non purement lectrices

**Constat vérifié :** les méthodes métier `readSprintGoals`, `readStoryPoints`, `readSprintCapacityReview`, `listSprintClosures` et certaines lectures de réunions déclenchent `ensure...Schema`. Les `ensure` peuvent exécuter `CREATE TABLE` / `ALTER TABLE`. Les appeler depuis une transaction PostgreSQL `READ ONLY` peut lever une erreur ; les appeler dans une connexion écrivable pour un simple dashboard est contraire au contrat de sécurité.

**Garde-fou pour SMN-235 :**
1. Pour les sources déjà initialisées, créer un lecteur SQL `SELECT` dédié à la projection, ou extraire la partie lecture des services existants et laisser leurs `ensure` au chemin d'installation/migration.
2. Utiliser les paramètres SQL pour `sprintId` et le contrôle `teamId` ; ne pas faire confiance aux seuls paramètres URL.
3. Ne jamais créer automatiquement une table manquante à la consultation. Une source absente devient `unavailable(schema-missing)`, pas une table créée, un chiffre nul ou une erreur non contrôlée.
4. Pour un même rendu, regrouper les lectures cohérentes dans **une transaction explicite REPEATABLE READ READ ONLY**, avec une seule responsabilité de `BEGIN/COMMIT/ROLLBACK`.
5. **Ne pas imbriquer directement `readActualCapacity`** dans cette transaction tant qu'elle ouvre sa propre transaction. Prévoir une variante prenant la transaction externe, ou une lecture de snapshots/agrégats dédiée dont les effets sont maîtrisés.

## 4. Contrat commun posé au niveau TypeScript

`src/lib/dashboard-data-contract.ts` définit :
- `CollectiveCycleProjection` : **un** `teamId`, **un** `cycleId`, et les familles objectifs/JH/SP/tickets/jours restants/événements/registres ;
- `DashboardMetric` : états exclusifs `available`, `not-recorded`, `unavailable` ;
- en état `available` : **valeur numérique (0 autorisé)**, qualité `known/estimated`, source `manual/calculated/imported/closure-snapshot`, date et version Vn si applicables ;
- `DashboardCollection<T>` : distinction explicite **liste fiable vide** (`available,items:[]`) et **source indisponible** ;
- les fonctions constructrices pures `metricAvailable`, `metricNotRecorded`, `metricUnavailable`, `collectionAvailable`, `collectionUnavailable` avec validation des versions et valeurs.

**Important :** ces types et constructeurs ne signifient pas que les données ont déjà été raccordées. Ce contrat sera consommé progressivement par SMN-235, SMN-237, SMN-236 puis SMN-238. Il n'inclut aucune information nominative individuelle.

## 5. Sécurité et histoire : invariants du futur lecteur

- Authentification serveur par `currentAccount` ou `authorizeApi` ; `canAccess(...,{type:"collective",exists:true,inScope:true})` permet aux profils MVP `admin` et `user` la consultation collective autorisée, pas l'accès aux fiches individuelles.
- `cycleId` fourni par l'URL doit être **résolu côté serveur** dans la liste des Sprints de l'équipe actuelle ; pour un ID inexistant/hors périmètre, ne rien divulguer ni opérer sur cet ID.
- Le bandeau et toutes les cartes doivent dépendre d'un **même cycle résolu** et d'un instant cohérent. Il ne suffit pas de charger plusieurs services séparément en `READ COMMITTED` si des modifications surviennent entre les lectures.
- Pour un Sprint **clôturé**, appliquer les dernières données historiques Vn présentes et leur provenance ; si une valeur manque dans l'instantané, **ne pas** la récupérer silencieusement depuis l'état courant.
- Dans une projection **collective**, n'exposer ni nom d'un membre ni liste des absences/participants. Les agrégats doivent être élaborés sur le serveur.
- FR/EN obligatoires dans `src/i18n/fr.json` et `src/i18n/en.json`. Les états techniques `available/not-recorded/unavailable` sont des codes, pas des libellés affichables directement.

## 6. Prérequis et définition de prêt pour SMN-235

| Porte | Action à réaliser | Statut à l'issue de l'étape 0 |
| --- | --- | --- |
| G0-01 Sources et propriétaire | Cartographier objectifs, SP, J/H, clôture et calendrier | **Documenté** |
| G0-02 Sécurité collective | Garder périmètre `teamId/cycleId` et RBAC serveur | **Contrat défini ; tests intégration encore à faire** |
| G0-03 Lecture sans DDL | Séparer `ensure...Schema` des requêtes dashboard | **Travail du début SMN-235 ; non modifié dans cette étape** |
| G0-04 Cohérence transactionnelle | Construire une projection sur une transaction stable, sans `BEGIN` imbriqué | **Travail du début SMN-235 ; architecture cadrée** |
| G0-05 Historique Vn | Lire la version figée et distinguer valeur absente/0/source | **Règle documentée ; tests des sources à venir** |
| G0-06 États de qualité | Utiliser un contrat sans zéro factice, testable indépendamment | **Contrat TypeScript créé ; tests rédigés, non exécutés** |
| G0-07 Producteurs incomplets | Tickets et registres sont explicitement hors du premier lot de lecture | **Dépendances consignées** |

L'étape 0 est **terminée sur le plan du cadrage technique et des garde-fous de conception**, mais le produit n'est pas déclaré techniquement testé ni prêt à afficher les métriques.

## 7. Validation sur Windows avant SMN-235

Depuis `main` synchronisée, exécuter dans PowerShell :

```powershell
pnpm typecheck
pnpm exec tsx --test tests/dashboard-data-contract.test.ts
```

Puis, lors de SMN-235, ajouter les tests des lecteurs PostgreSQL avec une base de test et de la recette du dashboard. Les commandes ci-dessus **n'ont pas été lancées sur le poste utilisateur** dans cette intervention.

## 8. Traçabilité

- [SMN-21](https://lmn24.atlassian.net/browse/SMN-21)
- [SMN-235](https://lmn24.atlassian.net/browse/SMN-235), [SMN-236](https://lmn24.atlassian.net/browse/SMN-236), [SMN-237](https://lmn24.atlassian.net/browse/SMN-237), [SMN-238](https://lmn24.atlassian.net/browse/SMN-238)
- `_bmad-output/implementation-artifacts/plan-raccordement-dashboard-SMN-235-238-2026-10-23.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/DESIGN.md` et `EXPERIENCE.md`
