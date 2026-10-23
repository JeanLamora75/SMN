# Amelia — Étape 0 : préparation technique de la refonte de la page Sprints

**Date :** 23 octobre 2026  
**Projet :** Scrum Master Notebook, BMAD Method v6.12.4  
**Périmètre :** audit, cartographie et garde-fous de non-régression ; **aucune modification fonctionnelle de la page Sprints**.  
**Référence UX :** [contrat de développement Sally](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/CONTRAT-DEVELOPPEMENT.md) et [matrice de fonctions](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/MATRICE-FONCTIONS.md).  
**Jira :** [Epic SMN-228](https://lmn24.atlassian.net/browse/SMN-228) ; Stories [SMN-229](https://lmn24.atlassian.net/browse/SMN-229) à [SMN-234](https://lmn24.atlassian.net/browse/SMN-234).  
**Sources analysées :** GitHub `JeanLamora75/SMN`, branche `main`, et descriptions des Stories Jira (consultation, aucune modification).

## 1. Décisions UX déjà approuvées — non à réinventer

- L'index `/app/admin/sprints` doit devenir **une seule vue Liste** pleine largeur avec nom, dates, état et actions, sprint courant prioritaire, recherche, filtres, tri et pagination/chargement complet.
- Une seule entrée « Générer des sprints » conduit à Configuration → Prévisualisation → Confirmation (1 à 6).
- Actions par **ID de sprint** : Renommer, Replanifier avec impact, Supprimer si jamais démarré ; Calendrier et Bilan accessibles dans leur contexte.
- Configurations **partagées** dans Paramètres ; modifications de **réunion** dans Calendrier / page réunion ; données d'un sprint dans la future fiche ou Bilan existant.
- Fiche Sprint `SMN-234` **différée**, aucun lien factice tant que la page n'existe pas.
- Maintenir Scrum/Kanban distincts, accès serveur, historiques, fuseau de l'équipe, données figées, FR/EN JSON, responsive, modal/focus.
- Pour les sprints historiques, l'option cérémonies désactivée par défaut reste le contrat de `SMN-160`, mais n'est **pas livrée**.

## 2. État vérifié sur la branche main

### 2.1 Surface Sprints actuelle

`src/app/app/admin/sprints/page.tsx` rend **17 instances de composants** dont `SprintForm`, `BatchPreviewForm`, `SprintStateList`, `RenameSprintForm`, `DeleteSprintForm`, `RescheduleForm`, `WorkSlotsForm`, `LunchForm`, `TemplateForm`, `TemplateOccurrencesList`, `MeetingConflicts`, `CeremonyEditor`, `ExceptionalMeetingForm`, `AttendanceForm`, `ActualDurationForm`, `ExceptionalCapacityForm`, `SprintReviewLink`. La page plafonne à **900 px**. `GoalsForm` et `StoryPointsForm` restent disponibles dans `/app/admin/sprints/review` : ne pas les classer à tort comme supprimés de la page principale.

`src/app/app/admin/sprints/state-list.tsx` a une première liste (id, nom, dates, état, suspension) et un rafraîchissement manuel. Pas de recherche/tri/filtre ou actions par ligne dans ce composant. `src/server/sprints/transitions.ts` effectue `ORDER BY s.start_at DESC LIMIT 100`.

### 2.2 Registre des destinations (transition sans perte de fonction)

| Fonction | Source actuelle / API métier | Destination prévue | Règle avant retrait |
|---|---|---|---|
| Horaires, fuseau | `work-slots-form.tsx`, `/api/admin/sprints/work-slots` | Paramètres > Jours ouvrés | Page réelle, lecture/écriture et révision vérifiées |
| Pause déjeuner | `lunch-form.tsx`, `/api/admin/sprints/lunch` | Paramètres > Jours ouvrés | Écran utilisable et non-rétroactivité testée |
| Modèles récurrents | `template-form.tsx`, `/api/admin/sprints/templates` | Paramètres > Cérémonies et modèles | Gestion des modèles et activation conservées |
| Cadence | `/app/admin/scrum-cadence` | Paramètres > Cadence des sprints | Route existante préservée |
| Liste | `state-list.tsx`, `/api/admin/sprints/states` | Index Sprints | Exhaustivité, filtre, tri, états validés |
| Création seule | `sprint-form.tsx`, `/api/admin/sprints` | Assistant, chemin `count=1` | Proposition/nom personnalisable et contrôles préservés |
| Création par lot | `batch-preview-form.tsx`, `/preview`, `/batch` | Assistant, `count=2..6` | Jeton, conflits, atomicité et historique des lots maintenus |
| Renommage | `rename-form.tsx`, `/sprints/[id]` PATCH | ⋯ sur ligne ID | Doublons signalés ; audit maintenu |
| Suppression | `delete-form.tsx`, `/sprints/delete` | ⋯ sur ligne ID | Aperçu, confirmation, protection côté serveur |
| Replanification | `reschedule-form.tsx`, `/sprints/reschedule` | ⋯ sur ligne ID | Aperçu d'impact, jeton, historique et protection des événements |
| Réunions/occurrences | Composants de cérémonies, exceptions, conflits, présence, durée et impact | Calendrier / page réelle de réunion | Chaque ancien parcours doit avoir une destination testée ; sinon conserver l'accès transitoire |
| Objectifs, SP, capacité, tendances, clôtures | `/app/admin/sprints/review` | Bilan existant, puis fiche future | La route existante ne doit pas disparaître ; contexte par sprint vérifié |
| Calendrier lié au sprint | `/app/team-calendar` | Raccourci depuis ligne | Utiliser l'ID, sélectionner exactement le bon sprint à l'arrivée |
| Fiche Sprint | Aucune route `/app/admin/sprints/[id]` UI disponible | `SMN-234`, **différée** | Nom non cliquable avant sa livraison |

La destination précise de chaque composant est aussi documentée dans [MATRICE-FONCTIONS.md](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/MATRICE-FONCTIONS.md). Il faut conserver une route de transition réelle pour les fonctionnalités dont le nouvel écran n'est pas prêt.

### 2.3 Contrats serveur déjà opérationnels à préserver

- `creation.ts` : génération unitaire transactionnelle, verrou d'équipe, vérification chevauchement, audit et création de cérémonies.
- `batch-preview.ts` / `batch-confirm.ts` : validation, preview, jeton lié à l'acteur, empreinte, verrou, réexamen, génération atomique et audit. `issueBatchPreview` ne délivre un jeton que pour `count >= 2`, bien que `validBatchRequest` accepte 1–6.
- `deletion.ts` : suppression logique seulement pour un sprint `planned` dont le début est futur, confirmation côté serveur et audit transactionnel.
- `rename.ts` : renommage autorisé sous contrôle serveur, avertissement sur homonymes et audit.
- `reschedule.ts` : preview + confirmation par token, mode `keep` pris en charge ; recalcul automatique des événements n'est pas pris en charge (ne pas le promettre).
- `access-policy.ts` et les routes API Sprints : admin peut lire/écrire `settings`, utilisateur ne peut **pas** lire `settings`, mais peut lire le type `collective` en lecture seule. La page Sprints et `/states` utilisent actuellement `settings`.

## 3. Risques / écarts classés à traiter avant bascule

| Réf. | Priorité | Fait vérifié / conséquence | Étape de résolution |
|---|---|---|---|
| R01 | **P0** | `readSprintStates` limite l'historique à **100**, idem `listSprintsForRename`, `/api/team-calendar/periods` ; la liste complète et les raccourcis anciens peuvent échouer | S2 ; prévoir pagination réelle, S4/S5 utiliser une lecture par ID si besoin |
| R02 | **P0** | L'accès à Sprints (route, menu, `GET /states`) est lié au privilège admin `settings` ; les utilisateurs autorisés ne peuvent pas encore consulter la liste | S2 ; définir endpoint de lecture collective filtré/autorisé, conserver mutations admin |
| R03 | **P0** | `GET /api/admin/sprints/states` appelle `readSprintStates` qui appelle `reconcileSprintStates` et **écrit** dans la base (transitions, déclencheurs) ; ne pas déclarer une lecture sans effets ou retirer cette réconciliation sans alternative métier | S2 ; séparer réconciliation métier et lecture de l'index avec garanties d'état |
| R04 | **P0** | Les cartes Paramètres `workingDays` (prévue, sans URL) et `ceremonies` (partielle, sans URL) sont inaccessibles. `tests/smn-225-settings-catalog.test.ts` vérifie expressément ces statuts | S1 ; créer les pages et faire évoluer en même temps les tests validés |
| R05 | **P0** | Les APIs de création unitaire/lot génèrent les cérémonies existantes ; le choix **historique facultatif** `SMN-160` est spécifié mais non implémenté | S3 ; garde-fou : ne pas simuler l'option ni prétendre qu'une réunion passée s'est tenue |
| R06 | **P1** | Batch : jeton seulement si `count>=2`; aucun nom éditable par élément dans l'aperçu actuel ; nouveau parcours 1–6 et noms modifiables nécessitent adaptation sans contourner la sécurité | S3 |
| R07 | **P1** | `team-calendar-view.tsx` choisit automatiquement un sprint (active/date), sans accepter de paramètre `sprintId` à son chargement | S5 ; ID exact, fuseau, période et retour testés avant activation du lien |
| R08 | **P1** | `reschedule-form.tsx` reconstruit un instant depuis `datetime-local` en lui ajoutant `Z`, potentiellement erroné si l'horaire est saisi dans le fuseau de l'équipe | S4 ; parser explicitement la zone IANA et revérifier la prévisualisation |
| R09 | **P1** | `/app/admin/sprints/review` existe, mais plusieurs sous-formulaires demandent de rechoisir un sprint ; lien contextuel depuis la ligne non établi | S5 ; navigation par ID vérifiée, ne pas ouvrir un autre sprint |
| R10 | **P1** | La page Sprints contient 17 composants visibles : retirer simultanément les modules de réunion/bilan avant leurs destinations rendrait des actions orphelines | S1–S5 ; check-list de transfert exhaustive puis suppression conditionnelle |
| R11 | **P1** | Dates côté calendrier parfois calculées via le fuseau du navigateur et nombre de jours basé sur une différence d'instants ; risque de décalage à la limite de période | S5 ; cas bornes inclusives et bascules été/hiver |
| R12 | **P2** | Code UI actuellement centré sur l'admin et conteneur 900px ; responsive, focus et texte i18n à qualifier après chaque incrément | S1–S5 ; matrice de recette Sally |

**Point de conception à ne pas trancher par simple renommage de route :** l'accès lecture seule des utilisateurs au registre des cycles doit demeurer compatible avec `canAccess`, les données visibles et la navigation ; aucune permission serveur ne doit être desserrée par un lien client.

## 4. Tests de référence ajoutés au dépôt

1. `tests/sprints-refonte-etape0.test.ts` — **8 tests garde-fou** : accès `canAccess`, contrôle serveur avant mutations, préservation des trois API de paramètres, transaction création unitaire, jeton/atomicité création groupée, suppression, replanification et disponibilité du Bilan.
2. `tests/sprints-refonte-dates-etape0.test.ts` — **3 tests comportementaux** : cadence IANA au passage heure d'été → hiver 2026 en Europe/Paris, proposition du lundi suivant et plage de validation des quantités 1–6.

Les premiers sont des **tests de structure/contrat** ; ils ne remplacent pas une intégration PostgreSQL ni une recette fonctionnelle. Les seconds évaluent les fonctions pures existantes, mais ne constituent pas un test de transaction.

**Exécution non réalisée par Amelia (connecteurs GitHub/Jira sans checkout local).** Leur simple création GitHub ne valide pas leurs assertions. Les tests déjà présents `tests/authorization.test.ts`, `tests/smn-225-settings-catalog.test.ts`, `tests/team-calendar.test.ts`, `tests/central-calendar.test.ts` constituent les références complémentaires.

## 5. Ordre de passage et règles de sortie (gates BMAD)

### G0 — Étape 0 préparée, tests locaux requis avant S1
- [x] Contrats Sally, Jira, code et permissions consultés.
- [x] Registre fonctions → destinations et risques R01–R12 rédigés.
- [x] Tests de référence ajoutés sur `main` sans changer l'UX ni la base.
- [ ] `pnpm exec tsx --test tests/sprints-refonte-etape0.test.ts tests/sprints-refonte-dates-etape0.test.ts` **réussit localement**.
- [ ] `pnpm i18n:check`, `pnpm typecheck`, `pnpm build` **réussissent localement**.
- [ ] Si échec, traiter la cause avant de retirer des formulaires Sprints. L'accord fonctionnel S1 existe déjà via Sally/Jira ; la vérification des tests reste indispensable.

### G1 — SMN-229 / Paramètres
- Pages dédiées effectivement navigables, données préchargées/persistées ; révisions et rôle admin ; changements non rétroactifs ; **les anciens éditeurs Sprints restent accessibles jusqu'à réussite de la nouvelle destination**.
- Mettre à jour le catalogue, ses traductions et les tests qui attendaient volontairement `href=null`.

### G2 — SMN-230 / Liste
- Page plein écran, tous les sprints, état actif prioritaire, filtres/tri sans mutations additionnelles de consultation, pagination si volume, autorisations de lecture cohérentes. **La réconciliation des états reste assurée de manière métier justifiée.**
- Pas de lien factice vers fiche future.

### G3 — SMN-231 / Génération
- Assistant 1..6, créations unitaires/lot avec transaction et validation, noms éditables, aperçu sans création accidentelle. **SMN-159/160 historique** traité réellement ou parcours explicite préservé et signalé comme non livré.
- Tests doublon, conflit concurrent, jeton expiré, cérémonie historique non générée par défaut.

### G4 — SMN-232 / Actions
- Modales par ID, droits et états ; renommer avec audit ; replanifier avec dates IANA et aperçu ; suppression jamais démarrée confirmée ; conserver tri/filtre et erreurs utiles.

### G5 — SMN-233 / Navigation et nettoyage
- Calendrier positionné par ID et bonne plage, réunion réelle accessible, anciennes opérations de cérémonie déplacées, Bilan toujours fonctionnel, retours valides.
- Supprimer les 17 widgets de l'index uniquement lorsque chaque fonction est vérifiée ailleurs ; campagne de recette UX `S01..S33`.

### G6 — SMN-234 (différé)
- Nouveau cadrage de la fiche Sprint, puis route réelle et onglets. La fin de l'étape G5 **ne dépend pas** de G6.

## 6. Procédure de recette Windows / trace vérifiable

Depuis PowerShell après GitHub Desktop **Fetch origin → Pull origin**, dans le dossier `SMN` :

```powershell
pnpm exec tsx --test tests/sprints-refonte-etape0.test.ts tests/sprints-refonte-dates-etape0.test.ts
pnpm exec tsx --test tests/authorization.test.ts tests/smn-225-settings-catalog.test.ts tests/team-calendar.test.ts tests/central-calendar.test.ts
pnpm i18n:check
pnpm typecheck
pnpm build
```

En cas d'échec, conserver la sortie du premier test défaillant ; ne pas supprimer la base ni réinitialiser les migrations. Aucun GitHub Actions requis (indisponibles selon politique du projet). Les tests de recette de Sally [RECETTE-UX.md](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/RECETTE-UX.md) contiennent **34 scénarios** à renseigner lors des lots concernés ; aucune capture écran n'est attestée dans cette étape.

**Statut de l'étape 0 : audit et préparation documentaire effectués ; contrôles de source GitHub effectués ; recette locale G0 en attente.** Ne pas marquer les Stories Jira « Terminée » pour ce seul travail préparatoire.

## 7. Adaptation BMAD et périmètre des écritures

Activation adaptée du skill `.agents/skills/bmad-agent-dev/SKILL.md` par lecture directe (`customize.toml`, surcharge équipe et référentiel UX) : commandes locales `uv run` non exécutées, faute de checkout exécutable/uv dans l'environnement connecté. L'ordre et les contrôles du contrat Sally sont suivis autant que possible.

**Écritures autorisées par la demande « commence l'étape 0 » :** uniquement ce livrable de préparation, les tests de référence et un lien dans le référentiel UX ; aucune action Jira, migration, mutation métier, interface de Sprints ou secret.
