# SMN-23 — Navigation contextuelle et retour aux fiches liées

**Story Jira :** https://lmn24.atlassian.net/browse/SMN-23

**Architecture :** Next.js 16 / React 19 / PostgreSQL 18 / JSON i18n (FR/EN), sans migration SQL.

## Parcours réel I0

La carte de contexte du tableau de bord comporte « Consulter la fiche équipe ». Son URL utilise l'identifiant stable **existant** de la table `smn_team`, vérifié côté serveur et limité à l'installation `singleton` initialisée. Le périmètre actuel n'a **qu'un produit et une équipe** par installation ; la sélection ne peut pas élargir ce périmètre.

La page `/app/team/[id]` présente en lecture seule le nom de l'équipe, celui du produit et le mode Agile issus de la base, sans identifiant personnel, compte, historique reconstitué ni écriture. Si l'équipe est inexistante, supprimée, archivée par une fonctionnalité future ou interdite, Next.js renvoie **404** avec un message générique ; aucun renseignement sur une ressource privée n'est fourni.

Le lien Retour vers la vue d'origine est reconstruit à partir de la liste blanche `/app`, `teamId`, `cycleId`, `filter`, `version`, `asOf`. Le véritable `teamId` provient de la base, jamais du navigateur. Une origine externe, un chemin interne différent, un fragment, des paramètres inattendus ou en double, des dates impossibles et des valeurs non bornées entraînent un retour sécurisé vers `/app`. Aucun paramètre n'est utilisé pour autoriser la lecture.

### Précaution historique

**I0 ne contient pas encore de cycle ni de version de clôture.** Les paramètres `cycleId`, `version`, `asOf` sont des références optionnelles pour préserver un futur parcours, pas des faits historiques vérifiés. Si un tel contexte est fourni, un encart prévient explicitement que la fiche montre **l'état courant** et non celui du cycle ou de la clôture. Il n'existe pas de lien actif vers un cycle inexistant.

Les filtres métier à venir ne sont **pas activés** par cette Story. La navigation conserve de manière bornée leurs paramètres pour les futurs écrans, mais ne prétend pas appliquer un filtre absent du produit actuel.

## Traçabilité AC

| AC | Implémentation | Tests |
|---|---|---|
| AC1 | `src/server/dashboard/read.ts`, `src/app/app/page.tsx`, `src/app/app/team/[id]/page.tsx` | `tests/context-navigation.test.ts`, `scripts/verify-http-ci.mjs` |
| AC2 | `requestedHistoricalContext`, encart « État courant » / « Contexte historique » | `tests/context-navigation.test.ts` et HTTP |
| AC3 | SQL filtré par installation et id ; route 404 générique | `tests/context-navigation.test.ts`, HTTP suppression/absence |
| AC4 | `src/lib/context-navigation.ts`, lien Retour `/app` filtré | `tests/context-navigation.test.ts` |
| AC5 | Session et permission `collective:read` au serveur, SQL SELECT paramétré, aucun appel externe ni mutation | `tests/context-navigation.test.ts`, `tests/authorization.test.ts`, HTTP |

## Vérifications

Tests écrits : `tests/context-navigation.test.ts`, `tests/dashboard-read.test.ts` adapté, `scripts/verify-http-ci.mjs` enrichi. Les catalogues FR et EN portent les nouvelles clés sous `detail.*`.

**À exécuter sur Windows** (après GitHub Desktop → Fetch origin / Pull origin sur `main`) :

```powershell
pnpm install --frozen-lockfile
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Recette métier : se connecter avec Admin et Utilisateur, ouvrir la fiche depuis la synthèse, revenir, tester des liens invalides et observer l'avertissement sur un lien comportant un contexte historique. Aucun cycle fictif, aucune écriture.

**Les tests ne sont pas attestés comme exécutés à ce stade** : les précédents jobs GitHub Actions ont échoué avant l'exécution de leurs étapes. L'intégration GitHub ne vaut pas recette ni passage Jira à Terminé.
