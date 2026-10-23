# SMN-231 — Assistant unique de génération des sprints

**Date :** 23/10/2026  
**Epic :** [SMN-228](https://lmn24.atlassian.net/browse/SMN-228)  
**User Story :** [SMN-231](https://lmn24.atlassian.net/browse/SMN-231)  
**Dépendances :** SMN-66/67/72/77, SMN-159/160, SMN-230.  
**Référence UX :** [CONTRAT-DEVELOPPEMENT.md](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/CONTRAT-DEVELOPPEMENT.md), [EXPERIENCE.md](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/EXPERIENCE.md), [RECETTE-UX.md](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/RECETTE-UX.md).

## Parcours livré dans le code

Le bouton « Générer des sprints » de `/app/admin/sprints` ouvre désormais `/app/admin/sprints/generate` : **page dédiée**, réservée à l'administrateur. Un utilisateur en lecture seule ne peut ni ouvrir cette page ni utiliser les API d'écriture.

1. **Configuration** : quantité 1 à 6, date de départ, initialisation par la proposition déjà existante. La cadence et les horaires sont lus, non modifiés.
2. **Prévisualisation** : génération calculée selon le fuseau IANA et la cadence, dates de chaque sprint, noms par défaut éditables (160 caractères), collisions de dates **bloquantes**, noms déjà utilisés ou répétés **avec avertissement non bloquant**, liste des modèles récurrents actifs. Pour les sprints dont la date de début est passée, option « Générer les cérémonies de l'équipe » **désactivée par défaut**.
3. **Confirmation** : récapitulatif, sauvegarde atomique de tous les sprints via jeton périssable, puis retour à la liste en restaurant recherche, état filtré, tri et pagination. Une erreur ou un aperçu périmé ne provoque aucun succès fictif et permet de recalculer l'aperçu.

Annuler, fermeture et Échap protègent les modifications. Un nom ou une option historique modifiée invalide le jeton et requiert de recalculer l'aperçu. Tous les textes sont dans `src/i18n/fr.json` et `en.json`.

Les composants existants `SprintForm` et `BatchPreviewForm` restent **accessibles en transition administrateur** sur `/app/admin/sprints/tools` ; aucune ancienne API métier supprimée ou renommée.

## Backend — contraintes transactionnelles

Le nouveau service `src/server/sprints/wizard.ts` réutilise le moteur `previewSprintBatch` / `calculateSprint` et le moteur de création de cérémonies existant.

- `POST /api/admin/sprints/wizard/preview` : validation stricte `startOn`, `count=1..6`, noms facultatifs (exactement 1 par sprint si fournis), option historique booléenne explicite ; calcule périodes et conflits avant toute création de sprint. Écrit uniquement un **jeton technique** (durée 10 minutes), lié à l'admin et à l'équipe, lorsque le lot est admissible. Il peut initialiser des schémas par les routines existantes, mais ne crée **aucun sprint** pendant l'aperçu.
- `POST /api/admin/sprints/wizard/confirm` : verrou `FOR UPDATE` sur jeton non consommé/non expiré, contrôle d'identité, verrou transactionnel par équipe `pg_advisory_xact_lock`, nouvel aperçu avec vérification des conflits, puis comparaison SHA-256 des noms/dates/cadence/paramètres de réunions, y compris modèles actifs et pause déjeuner. En cas de divergence : `stale-preview`, **aucun sprint ajouté**.
- Si prévalidation réussie : `BEGIN` / `COMMIT`, insertion de chacun des 1–6 sprints, audit du nom, des paramètres et du choix de cérémonies, insertion groupée dans `smn_sprint_batch_audit`, consommation du jeton. Toute exception déclenche `ROLLBACK`. La répétition du même jeton consommé est refusée.
- Les anciennes API `/api/admin/sprints`, `/preview`, `/batch` restent fonctionnelles et sont indépendantes du nouveau contrat (notamment le lot legacy limité à 2–6).

**Sécurité :** les deux nouvelles routes utilisent `authorizeApi(request,"write",{type:"settings",exists:true,inScope:true})` et `withAuthDb` ; le contrôle Scrum/admin est assuré par la page et l'équipe cible par les requêtes métier.

## Historique et provenance de réunions

Le contrôle **SMN-160** est pris en compte dans le nouvel assistant :

- Un sprint dont le **début** est passé est considéré comme reprise historique.
- **Option décochée** : aucune cérémonie Scrum standard ni occurrence personnalisée générée pour ce sprint ; la création du sprint et son audit sont indépendants.
- **Option cochée** : la génération autorise explicitement les dates passées et marque les événements `generation_source='reconstructed'` ; ce marqueur ne signifie **jamais** « tenue ». Cérémonies Scrum standards et occurrences issues de modèles actifs sont prises en compte.
- La trace du choix, de l'initiateur, de la cadence, de la pause et des modèles réellement actifs est enregistrée dans les audits ; elle n'affirme jamais que la configuration actuelle existait déjà à la date historique.
- Les occurrences reconstituées sont labellisées dans le calendrier central d'équipe, la fiche d'une cérémonie, l'éditeur des cérémonies et la liste des occurrences personnalisées.
- La génération future conserve les contrôles antérieurs. Aucun changement automatique du statut `held`, `cancelled` ou `actual_minutes`.

**Limites de la recette :** la reconstruction suit les paramètres actuellement enregistrés, pas un historique de modèles effectifs à une date ancienne. Les exports/reportings non encore dotés d'un champ de provenance devront être audités séparément ; aucune complétude de reporting historique n'est affirmée avant leur recette.

## Schéma additive

`prisma/migrations/20261023_smn231_sprint_wizard/migration.sql` :
- crée `smn_sprint_wizard_preview` (jeton, équipe, auteur, requête, empreinte, expiration, consommation) et un index d'expiration ;
- ajoute `generation_source` aux cérémonies standards et aux occurrences personnalisées, valeur par défaut `standard` pour les données préexistantes.

Les routines `ensureBatchSchema`, `ensureCeremonySchema` et `ensureTemplateOccurrenceSchema` appliquent également les ajouts idempotents à la demande, en cohérence avec le fonctionnement du pilote SMN. **Aucune suppression de données** ni modification de métriques figées.

## Fichiers principaux

- `src/server/sprints/wizard.ts` — parseur, prévisualisation, jeton et confirmation ;
- `src/app/api/admin/sprints/wizard/{preview,confirm}/route.ts` — endpoints administrateur ;
- `src/app/app/admin/sprints/generate/page.tsx`, `sprint-generation-wizard.tsx`, `sprint-index-view.tsx` — parcours unique ;
- `src/server/sprints/ceremonies.ts`, `template-occurrences.ts`, `ceremony-edits.ts` — reconstruction et origine ;
- `src/app/api/team-calendar/meetings/route.ts`, `src/app/app/team-calendar/team-calendar-view.tsx`, `meeting/[kind]/[id]/page.tsx` — provenance dans Calendrier ;
- `src/app/app/admin/sprints/ceremony-editor.tsx`, `template-occurrences-list.tsx` — libellés administrateur ;
- `src/i18n/fr.json`, `en.json` — parité FR/EN ;
- `tests/smn-231-sprint-wizard.test.ts` — 17 scénarios unitaires sur le parseur et contrôles statiques des contrats (pas un test PostgreSQL de bout en bout).

## Recette locale et scénarios prioritaires

Après GitHub Desktop **Fetch origin → Pull origin**, depuis PowerShell :

```powershell
pnpm exec tsx --test tests/smn-231-sprint-wizard.test.ts tests/smn-230-sprints-index.test.ts tests/sprints-refonte-etape0.test.ts tests/sprints-refonte-dates-etape0.test.ts
pnpm i18n:check
pnpm typecheck
pnpm build
pnpm dev
```

Sur `http://127.0.0.1:3003/app/admin/sprints`, valider :
1. Un seul clic « Générer » → page dédiée, étapes 1–2–3 ; 1, 2 et 6 sprints sans écriture à l'aperçu.
2. Modifier le nom d'un sprint : jeton invalide jusqu'à nouvel aperçu. Nom en doublon averti mais non bloquant.
3. Modifier dates/cadence en parallèle ou créer un sprint concurrent : confirmation refusée sans insertion partielle.
4. Cliquer deux fois « Confirmer » / rejouer le même jeton : un seul lot existe. Simuler une erreur PostgreSQL sur une base de test seulement : aucune insertion partielle.
5. Reprise historique avec option **désactivée** : zéro cérémonie ; avec option **activée** : source reconstituée dans calendrier et pages détail ; jamais « tenue ».
6. Création future : cérémonies standards et modèles actifs respectés ; audit correct ; capacités figées inchangées.
7. Bouton Annuler, croix, touche Échap, navigation arrière, focus, fenêtre étroite, compte user lecture seule et mode Kanban.
8. Après confirmation, retour à la liste et présence des 1–6 sprints. Contrôler également les anciens endpoints de création et le Bilan.

**Statut des preuves :** code et documentation publiés sur `main`, vérifications statiques de cohérence réalisées. **Exécution réelle de `tsx`, `pnpm typecheck`, `pnpm build`, vérification PostgreSQL et recette navigateur non exécutées par l'assistant.** Ne pas déclarer Jira « Terminée » sans retours de recette et tests réels.

## Adaptation BMAD

Skill Amelia `.agents/skills/bmad-agent-dev/SKILL.md` et personnalisation équipe consultés. Exécution via le connecteur GitHub ; scripts `uv run` non exécutés dans un checkout local indisponible. Les artefacts et tests respectent autant que possible le flux de développement BMAD.
