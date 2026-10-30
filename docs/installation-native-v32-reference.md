# Référence officielle — installation native SMN v32

## Décision (30 octobre 2026)
La **baseline native v32** est le point de départ des nouvelles installations SMN.
Le mode Scrum/Kanban est **une propriété d'équipe** (`smn_team.agile_mode`) et n'est
pas demandé à l'installation. Le compte administrateur est créé sans créer d'équipe.

## Contrat de l'installation neuve
- Source SQL canonique : `prisma/baseline/v32/schema.sql` (à versionner impérativement).
- Application via `src/server/installation/install.ts`, sans exécuter les migrations v1–v31.
- Entrée unique du journal `_prisma_migrations` : `smn_v32_native_baseline`,
  avec checksum SHA-256 exact du fichier SQL.
- `smn_installation.schema_version = 32`, état `initialized`.
- `smn_installation` ne comporte plus de champ `mode`.
- Aucune équipe précréée ; choix obligatoire du mode à la création de chaque équipe.

## Historique isolé
Les fichiers `prisma/migrations/2026*/migration.sql`, les anciens
`scripts/apply-*-migration.ts` et les migrations TypeScript des services sont
des **archives techniques / moyens de maintenance pour les bases existantes**.
Ils ne constituent pas un parcours d'initialisation native.
Ils ne doivent pas être supprimés tant que les références anciennes restent
actives dans le diagnostic ou dans des environnements de test.

`pnpm db:upgrade` ne lance plus de migration v31→v32. Une base v32 native
(1 entrée) ou historique (32 entrées) est reconnue comme déjà à niveau.
Toute montée depuis une version antérieure exige une procédure de maintenance
manuelle, explicitement choisie et vérifiée.

## Diagnostic et validation
- `pnpm db:diagnose` reconnaît une baseline native avec checksum exact, ainsi
  qu'une base historiquement migrée.
- `pnpm db:diagnose:full` distingue `native-v32` et `historical-v32` ;
  la mise en garde relative aux sources SQL historiques ne s'applique qu'à
  l'historique.
- Vérifier `pnpm test:db:compat`, `pnpm typecheck`,
  `pnpm db:diagnose` et `pnpm db:diagnose:full` sur chaque installation.
- La recette sur base vierge est annoncée réussie par l'utilisateur ; son
  journal détaillé n'a pas été joint ici. Ce document n'affirme pas que la CI
  ou l'ensemble des tests ont été exécutés.

## État du dépôt et point de vigilance
Lors de cette mise à jour, le fichier `prisma/baseline/v32/schema.sql`
n'était **pas présent sur GitHub main**. La baseline testée localement doit
être publiée à ce chemin, sans données ni secrets, et contrôlée contre
le checksum attendu. Jusqu'alors, une installation depuis un checkout
vierge du dépôt peut renvoyer `baseline-v32-unavailable`.

Les futures évolutions de structure doivent partir de cette baseline,
avec migrations explicites et versionnées (v33+), sans réactiver des
créations SQL opportunistes dans le code métier.
