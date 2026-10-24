# Epic 7 — C5 : audit de validation et portes de recette
Date : 2026-10-24
Branche examinée : main

## Exécution réalisée
- Lecture statique des fichiers du calendrier, des rapports Kanban, des tendances et des contrats de capacité via le connecteur GitHub.
- Tentative de clonage Git dans l'environnement de vérification : impossible (résolution DNS de github.com indisponible).
- Node 22.16.0 et Git disponibles dans cet environnement, pnpm non installé.
- Aucun test automatisé ni build exécuté : résultats inconnus, **pas de validation technique**.
- Aucune connexion à la base PostgreSQL de l'utilisateur, aucune migration exécutée.

## Défauts corrigés
1. `src/app/app/team-calendar/team-calendar-view.tsx` : `save()` exigeait `selectedSprint` même en mode Kanban, bloquant effectivement l'API `/api/admin/kanban-meetings`. La condition n'exige désormais un Sprint qu'en Scrum.
2. `src/server/kanban/report-preparation.ts` : le bloc de capacité disponible fournissait `realizedJh`, tandis que l'aperçu Kanban attendait `actualRetainedJh`. Le modèle de préparation renseigne désormais ce nom de champ à partir de la valeur existante.

## Contrôles restant obligatoires (non effectués)
1. Synchroniser main, `pnpm install --frozen-lockfile` si nécessaire, puis `pnpm build`.
2. Exécuter la suite `tests/smn-136-*.test.ts` à `tests/smn-158-*.test.ts` et les tests `tests/epic-7-c1-*.test.ts` à `tests/epic-7-c4-*.test.ts`. Sous PowerShell, utiliser `Get-ChildItem tests -Filter '*kanban*.test.ts'` et passer les chemins obtenus à `pnpm exec tsx --test` avec attention aux autres fichiers C1–C4.
3. Sur une base de test PostgreSQL : migration depuis base vierge et base déjà remplie, vérification des droits admin/user.
4. Kanban : création de périodes, ouverture exacte + rattrapée, capacité manuelle et calculée, réunions explicites, états, rattachements qualitatifs, replanification et événements hors bornes.
5. Clôture V1, réouverture, modifications, clôture V2 : vérifier que V1 reste bit-à-bit inchangée, les inconnues restent des inconnues et les droits n'exposent aucune information nominative privée.
6. Préparer un rapport, inspecter l'HTML sans archivage, figer la référence, générer le PDF, vérifier l'empreinte du fichier archivé, retenter l'export, vérifier l'accès aux anciennes archives.
7. Vérifier la traduction FR/EN. L'aperçu figé Kanban contient actuellement des intitulés français même lorsque `language='en'`.
8. Vérifier les chemins de sérialisation des objets PostgreSQL et les éventuelles transactions concurrentes : état et capacités sont lus dans plusieurs requêtes et certaines lectures exécutent des écritures de réconciliation.
9. Vérifier que la création de réunion Kanban fonctionne réellement : sélection de période, formulaire, POST, GET calendrier, consultation et préservation en replanification.

## Risques connus non résolus
- Initialisation du schéma par DDL dans des services de lecture.
- Synchronisation de l'ouverture Kanban déclenchée par la réconciliation ; l'exécution exactement à l'heure attendue n'est pas garantie sans ordonnanceur.
- Replanification Kanban : occurrences futures générées non recalculées (politique actuelle : préserver).
- Rapport Kanban : photographies préparées via plusieurs lectures sans isolation garantissant un instantané global ; export non validé avec un navigateur réel.
- Clichés et tendances historiques : cohérence des métriques à vérifier, notamment pour les anciennes versions.
- Préparation/aperçu PDF : certains libellés, formats et rubriques restent à aligner avec le contrat de l'Epic 6.

## Décision
Epic 7 non validé. Ne pas modifier les statuts Jira avant recette confirmée par l'utilisateur.
