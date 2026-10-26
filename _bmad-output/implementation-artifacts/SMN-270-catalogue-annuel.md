# SMN-270 — Catalogue annuel Pays et jours fériés

## Portée

Refonte de `/app/admin/countries` à périmètre national et administrateur uniquement, sans suppression de fonctionnalités existantes.

- AC1 : page pleine largeur, drapeaux avec repli globe, liste compacte et action « Gérer ». Les formulaires historiques restent accessibles dans un panneau d'outils replié, jusqu'à SMN-271/277.
- AC2 : année globale initialisée avec le fuseau `Europe/Paris`, consultation ciblée par pays/année, aucun changement en base lors du changement d'année.
- AC3 : recherche normalisée avec accents/casse ignorés, filtres annuels, compteur, état vide et réinitialisation.
- AC4 : statut annuel non agrégé. Les couvertures historiques `configured` sont **à vérifier** faute d'attestation humaine. Le backend métier conserve ses statuts techniques pour les calculs existants.
- AC5 : lecture authentifiée des dates par `GET /api/admin/countries/calendar?country=FR&year=2026`, contrôle serveur `settings/read`, consultation accessible en dialogue natif, textes FR/EN.

## Décision métier transversale

Le catalogue de pays affiche un **état administratif**, différent de la colonne `smn_national_calendar_coverage.status` qui demeure la couverture technique. Une éventuelle preuve de validation devra être fournie par le serveur et associée à une révision persistée (SMN-275). Aucun calendrier ne devient administrativement « Configuré » par préchargement.

Aucune migration ni mutation de calendrier dans cette story.

## Vérifications

- 6/6 tests du module pur de projection des statuts exécutés avec Node 22 `--experimental-strip-types` sur une **copie locale de ce module** (et non le checkout SMN).
- Parité des 3 142 clés FR/EN et des placeholders vérifiée par relecture des deux JSON de la branche.
- Tests additionnels de lecture backend ajoutés à `tests/country-calendar-read.test.ts`, **non exécutés**.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, recette navigateur, PostgreSQL : **non exécutés** faute de checkout / dépendances SMN dans l'environnement connecté.

## Suite

La création/renommage en modale est traitée dans SMN-271, l'éditeur calendrier complet dans SMN-272/273, la validation explicite et les mutations dans SMN-275/276, les imports unifiés dans SMN-277/278.

## Adaptation BMAD

Les sources officielles des skills `bmad-agent-dev` et `bmad-build` ont été lues sur GitHub. L'environnement ChatGPT ne dispose pas du checkout exécutable complet : le renderer `uv run ... render_skill.py` du workflow `bmad-build` n'a **pas** été lancé, et il serait inexact de prétendre avoir exécuté les étapes d'un snapshot rendu. Le développement a été conduit directement via le connecteur GitHub, sur branche dédiée. Livraison **à revoir / vérifier** avant fusion.

## Revue complémentaire du 26/10/2026

### Corrections effectuées sur la branche

- Navigation année précédente/suivante, bornée à 1900–2200, en complément du sélecteur de millésime (années sans couverture également accessibles).
- Échec de lecture du catalogue : état d'erreur distinct de l'état vide, bouton de nouvelle tentative, sans affichage trompeur « aucun pays ».
- Une erreur de lecture d'un calendrier est remise à zéro à l'ouverture d'un autre pays.
- Traductions FR/EN des contrôles de navigation.

### Preuves disponibles

- Relecture des deux catalogues JSON après corrections : **3 144 clés de chaque côté**, mêmes chemins et paramètres interpolés, sans clés d'interface introuvables dans cette story.
- Tests purs « statut/recherche/année Paris » : **6/6 réussis** avec Node 22 `--experimental-strip-types`, uniquement sur copie isolée. Ils ne remplacent pas `pnpm test` et ne valident pas l'intégration Next.js.
- GitHub Actions sur la PR : exécutions terminées en **failure** en quelques secondes ; les jobs `windows-smoke` et `linux-postgres` ne renvoient aucune étape, et la récupération des journaux retourne 404 `BlobNotFound`. Des exécutions récentes sur `main` présentent également le statut `failure`. **Origine non établie ; ne pas attribuer un défaut de code ni considérer cette CI comme réussie.**
- Pas de dépôt complet dans l'environnement d'exécution ; `git ls-remote` échoue (résolution DNS github.com), et les dépendances Node du projet ne sont pas disponibles. **Ni build ni vérification PostgreSQL/navigation vérifiés.**

### Décision de qualité

**PR en brouillon / Jira En cours.** La fusion et le statut Terminé sont bloqués jusqu'à obtention d'une vraie recette `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, plus contrôle navigateur admin/non-admin sur données réelles. Le passage à SMN-271 doit préserver ce statut de livraison non vérifiée.
