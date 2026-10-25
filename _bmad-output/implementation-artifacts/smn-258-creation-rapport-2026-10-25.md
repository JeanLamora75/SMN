# SMN-258 — Création et préremplissage d'un rapport

## Fichiers et fonctions
- `src/app/app/reports/new-report-form.tsx` : création par titre, Sprint, modèle, langue ; token conservé lors d'une nouvelle tentative de la même saisie.
- `src/app/app/reports/page.tsx` et `src/server/reports/center.ts` : accès à la création y compris lorsque le Sprint ne comporte aucun rapport.
- `src/server/reports/report-documents.ts` : copie versionnée du modèle et des notes, projection métier fiable via `prepareSprintReport`, source/version historique, idempotence `creation_request_id` dans la transaction.
- `prisma/migrations/20261025_smn258_report_create_request/migration.sql` : ajout et index unique du jeton, sans modification d'archives.
- `src/app/app/reports/[documentId]/page.tsx` : lecture des indicateurs sourcés et absence de zéro fictif.
- `src/i18n/fr.json`, `src/i18n/en.json` : nouveaux libellés.
- `tests/smn-258-prefilled-report.test.ts` : règles métier de données manquantes et engagement initial indépendant.

## Acceptation
- AC1 : création rapide et structure du modèle préservée ; couverture facultative et blocs détaillés du futur Studio non créés, à compléter.
- AC2 : quatre indicateurs projetés par le contrat existant avec unité et contexte source/version ; informations supplémentaires à intégrer aux futures Stories.
- AC3 : projections null conservées ; pas de zéro fictif.
- AC4 : projection `initial_sp` dissociée de `done_sp` ; tests de non-régression à exécuter.
- AC5 : token idempotent indexé en PostgreSQL ; transaction et nouvelle tentative à tester avec véritable base, notamment sous concurrence.

## Validation
- Exécution `pnpm typecheck`, `pnpm build`, tests ciblés et migration PostgreSQL : **non exécutées** (environnement Node disponible = 22, projet exige Node 24, pnpm absent).
- La création de documents dépend des PR SMN-254 à SMN-257, non validées.
- Ni `main` ni Jira n'ont été modifiés ; aucun archivage touché.

## Risques
- Migration incrémentale à appliquer à une base disposant déjà de `smn_report_document` ; éviter le DROP.
- Ancien test SMN-254 à adapter aux lectures de projection ajoutées.
- Les emplacements de rédaction existent via `notes` ; l'éditeur de blocs du Studio est à construire.
- La provenance des indicateurs hérite des limites existantes (capacité courante peut être non renseignée).
- La prévention de doublon concerne la même requête répétée avec son jeton, pas deux créations volontairement distinctes.

Statut : incrément en brouillon, non validé et non fusionné.
