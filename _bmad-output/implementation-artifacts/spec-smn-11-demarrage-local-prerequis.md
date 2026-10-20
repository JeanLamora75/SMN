---
title: "SMN-11 — Démarrage local et diagnostic des prérequis"
type: "feature"
created: "2026-10-20"
status: "done"
route: "dispatch"
review_loop_iteration: 1
baseline_commit: "9f6cc9ba1a1a23d47234511d7801e5a0cc54fe86"
context:
  - "_bmad-output/implementation-artifacts/epic-1-context.md"
  - "_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ADR-I0-001-STACK.md"
  - "_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ADR-I0-002-MIGRATIONS-SECRETS.md"
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** SMN n'a encore aucun exécutable : le Scrum Master ne peut ni lancer l'application sous Windows 11 ni vérifier PostgreSQL sans intervention technique.

**Approach:** Créer le socle web local et un diagnostic serveur fiable. N'autoriser l'entrée de première installation que lorsque son état réel est connu ; refuser les routes privées sans authentification.

## Boundaries & Constraints

**Always:** TypeScript, Node 24, pnpm, Next 16/React 19, Bootstrap 5.3 (pas Tailwind), PostgreSQL/Prisma 7 ; aucun IDE, Docker ou privilège Windows élevé. Loopback local. Contrôles côté serveur, échecs explicites et relançables, aucun secret dans les URL/logs/Git. Vérifier les droits effectifs sans présumer CREATEDB.

**Never:** Modifier LMN24 ; créer silencieusement des bases, rôles, comptes, équipes ou cycles ; migrer des données existantes sans confirmation ; simuler une session ; déclarer SMN-12 (installation complète) livré par SMN-11.

## I/O & Edge-Case Matrix

| État | Comportement attendu |
|---|---|
| Windows standard, dépendances OK | URL locale affichée, page accessible |
| PostgreSQL et base SMN vierge | Diagnostic « à initialiser », aucun objet métier créé |
| Base SMN absente | Signaler que l'installateur devra la créer, aucun faux succès |
| Service arrêté, identifiants erronés, délai dépassé | Échec compréhensible sans secret ; relance possible |
| Connexion possible mais droits limités | Identifier les droits manquants ; pas d'élévation |
| Installation existante ou requête anonyme /app | Refuser /setup et les routes privées côté serveur |
| Base étrangère ou schéma incompatible | Ne pas l'adopter et bloquer le parcours métier |

</frozen-after-approval>

## Code Map

- Aucun code applicatif, `package.json` ni lockfile dans la branche documentaire consultée : partir d'un nouveau socle.
- `_bmad-output/implementation-artifacts/epic-1-context.md` : règles de l'Epic 1.
- `_bmad-output/planning-artifacts/preparation-premier-travail-i0.md` : parcours et cas à tester.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` : suivi en backlog, clé Story 1.1.
- Emplacements `src/app/`, `src/server/`, `prisma/`, `scripts/` inexistants à créer, sans altérer les skills installés.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts` — initialiser la stack et figer des versions réellement compatibles.
- [x] `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` — écran de démarrage minimal, lisible et responsive en français/anglais.
- [x] `src/server/installation/diagnostic.ts`, `src/server/db/connection.ts` — états PostgreSQL, droits minimaux et absence de fuite de secrets.
- [x] `src/app/setup/page.tsx`, `src/app/app/page.tsx` — gardes serveur fermés sans session ; aucune initialisation implicite.
- [x] `scripts/doctor.mjs`, `prisma/schema.prisma` — diagnostic des prérequis et contrat minimal d'état de schéma, sans écriture ni migration automatique.
- [x] `tests/installation-diagnostic.test.ts`, `tests/access-guards.test.ts` — tester tous les cas de la matrice, avec doubles de test et vérification serveur.
- [x] `docs/INSTALLATION.md`, `README.md` — consignes Windows, secrets privés, limitations actuelles et commandes reproductibles.
- [x] `_bmad-output/implementation-artifacts/sprint-status.yaml` — renseigner uniquement une progression réellement démontrée.

**Acceptance Criteria:**
- Given un Windows 11 ordinaire avec prérequis, when SMN démarre, then l'URL locale s'ouvre sans IDE ni élévation.
- Given une base SMN accessible, when le diagnostic passe, then l'état vierge ou initialisé est distingué sans créer d'équipe ni cycle.
- Given une connexion, un schéma ou des droits incorrects, when la vérification échoue, then l'utilisateur obtient une erreur relançable sans secret.
- Given un visiteur anonyme, when il ouvre /app ou /setup sur une installation existante, then le serveur refuse l'accès.
- Given le lockfile, when l'installation, les tests et le build sont exécutés, then leurs résultats sont tracés sans faux succès.

## Implementation Notes

- Implémentation livrée sur la branche `dev/bmad-i0-20261020` : Next.js 16, React 19, TypeScript, Bootstrap 5.3, diagnostics PostgreSQL en lecture seule, gardes serveur fermés, état d'installation connu/absent/incompatible.
- CI GitHub Actions sur Node.js 24, pnpm 12.10.0 et PostgreSQL 18.6 éphémère : **19 tests sur 19 réussis**, ESLint, TypeScript, build de production et contrôle HTTP `/` (200), `/setup` (200 sur base vierge), `/app` (404), `/api/diagnostic` (état vierge) réussis. Preuve : https://github.com/JeanLamora75/SMN/actions/runs/39386473764.
- `pnpm-lock.yaml` généré par le runner après approbation ciblée des scripts pnpm et publié sur la branche ; présence relue directement depuis GitHub.
- Adaptation : dépôt absent du conteneur de l'assistant et accès GitHub par connecteur ; implémentation vérifiée par comparaison de commits GitHub et runner CI plutôt que travail Git local. Aucune migration, aucune base utilisateur ni secret n'ont été modifiés.
- **Preuve restante :** lancement `pnpm dev`, comportement et droits effectifs sur le poste Windows 11 standard de l'utilisateur ; non attestés. SMN-12 et SMN-14 ne sont pas livrés. Le ticket Jira ne doit pas être marqué terminé.
- **Revue BMAD indépendante :** en attente des trois couches prévues par l'étape 04 (aucune capacité subagent dans cette session) ; l'état `in-review` n'est pas une validation de revue.

- **Contrainte utilisateur complémentaire du 20/10/2026 (après approbation initiale) :** les ports localhost 3000, 3001 et 3002 sont occupés par un autre projet. Implémentation additionnelle sans toucher au bloc d'intention gelé : port SMN par défaut 3003 pour `pnpm dev` et `pnpm start`, paramètre optionnel `SMN_PORT`, refus des trois ports réservés et aucune bascule implicite. Tests dans `tests/port-config.test.mjs`, `scripts/port-config.mjs` et `scripts/serve.mjs`, documentation et CI mises à jour.
- **Vérification CI additionnelle :** [GitHub Actions](https://github.com/JeanLamora75/SMN/actions/runs/39388328841) : 23 tests/23 réussis, lint, typecheck et build validés ; test HTTP de coexistence d'un serveur sur le port 3000 et de SMN sur 3003 réussi. Contrôle Windows réel encore nécessaire.

- **Recette utilisateur Windows partielle (20/10/2026) :** le démarrage SMN et l'affichage de la page de diagnostic sur localhost:3003 sont confirmés par capture d'écran utilisateur. Message visible : « La connexion à la base SMN n'est pas encore configurée ». L'utilisateur a installé et lancé l'application via pnpm et GitHub Desktop ; commande Git CLI absente du PATH, sans incidence pour ce parcours. Deux captures supplémentaires du 20/10/2026 confirment visuellement le refus d'accès (« Accès indisponible / Access unavailable ») pour `http://localhost:3003/app` et `http://localhost:3003/setup`. Le statut HTTP 404 de ces routes a été démontré en CI Linux, pas mesuré sur le PC Windows. L'utilisateur a confirmé le 20/10/2026 que les deux projets fonctionnent **séparément** sur son PC et qu'il les démarrera alternativement : leur exécution simultanée sur Windows n'est **pas un critère exigé**. La démonstration de coexistence reste limitée à la CI Linux. Les droits PostgreSQL locaux et les autres cas de diagnostic restent à vérifier sur le poste.

- **Re-vérification CI après corrections (snapshot de code `70637b8bce89697d87d718f847c790de5d5801ae`) :** [GitHub Actions 39405279101](https://github.com/JeanLamora75/SMN/actions/runs/39405279101) réussie sur Linux/PostgreSQL 18 éphémère et Windows : **30 tests sur 30 réussis**, aucun test PostgreSQL ignoré dans le job Linux, build TypeScript/Next, sondes HTTP `/app` et `/setup`, schéma étranger, migrations partielles, URL étrangère, langues FR/EN, ports alternatifs/occupés. Le job Windows confirme `pnpm dev` et les refus d'accès sur loopback, sans toucher à PostgreSQL utilisateur. La revue indépendante **doit être réexécutée** sur cette version modifiée avant éventuel verdict final.
- **Limite technique conservée / SMN-12 :** la politique de reconnaissance des migrations est un contrat I0 conservateur sur le marqueur de schéma version 1 ; la Story d'installation devra fixer la liste exacte des migrations livrées et les futurs objets métier, avant d'autoriser l'état initialisé sur une véritable installation complète. Aucun assistant d'installation fonctionnel ni session ne sont fournis par SMN-11.

## Spec Change Log

- 2026-10-20 — **Décision d'itération et feedback utilisateur après deuxième revue.** Pas de troisième salve automatique de trois relecteurs ; traiter les problèmes qui mettent en danger l'état de la base, le diagnostic et la confiance dans les tests, puis livrer l'incrément I0. Les améliorations non bloquantes et l'installation réelle sont inscrites au travail reporté et à SMN-12. Ceci est une **adaptation explicite** au cycle de revue BMAD, sans prétendre à une troisième revue indépendante.
- **Correctifs de la deuxième revue :** détection de types composites PostgreSQL, refus d'une version serveur non fournie, refus d'accès préparation sans preuve de CREATE, et interdiction de valider un marqueur de schéma/migration arbitraire en l'absence de manifeste Prisma officiel. Les schémas contenant un marqueur passent temporairement en `installation-incomplete` ; **SMN-12 est responsable de la reconnaissance de ses migrations réellement livrées**.
- **Fiabilité de la vérification :** assertions des ports réservés corrigées (processus vivant n'est jamais succès), contrôle du port avant démarrage, arrêt vérifié des processus de test, protection des fixtures après erreur, restriction de l'exécution destructive à la CI GitHub Actions et base `smn_ci`. Le parseur de langues ignore les paramètres de qualité malformés.
- **Preuve CI complète de cette itération :** Linux/PostgreSQL 18 : 30/30 tests, contrôles HTTP de production, lint, build, typecheck ; Windows : tests (intégration PG ignorée), build et démarrage `pnpm dev` sur loopback — https://github.com/JeanLamora75/SMN/actions/runs/39411560620 (réussi). Une vérification du serveur sur Windows réel a également été communiquée par l'utilisateur avant la deuxième revue.
- **Limites acceptées / suivies :** les protections de non-élévation sur Windows, l'identité exacte du processus au niveau OS, l'intégration PostgreSQL Windows et les tests de concurrence restent à améliorer par feedback. La suite `smn_ci` utilise des fixtures seulement sur runner GitHub ; le caractère éphémère de la base provient de la configuration GitHub Actions et n'est pas démontrable par le seul nom SQL.


- 2026-10-20 — **Boucle de revue 1 / révision non gelée.** Les relecteurs ont détecté une insuffisance du Code Map / Tasks & Acceptance : la preuve d'un état « vierge » ou « initialisé » repose sur un scan SQL incomplet, une liste de deux tables et un seul marqueur sans preuves de migrations. **Plan corrigé :** inspecter tous les objets applicatifs, vérifier les droits séparément et la version PostgreSQL, tester `probePostgres` réellement, n'admettre « initialized » qu'après examen de l'historique des migrations et de la politique de schéma/version explicitement enregistrée ; état inconnu = refus d'accès. Corriger URLs, scripts, i18n, least-privilege CI et contrôles Windows. **État connu mauvais à éviter :** faux `virgin` sur une base étrangère et faux `initialized` sur une installation partielle. **KEEP :** socle Next/Prisma, refus des routes anonymes, aucun accès ou mutation sur LMN24, ports 3000–3002 réservés, port SMN 3003, preuves CI et recette Windows obtenues. Adaptation connecteur : faute de clone Git local et de sous-agents directs, révision traçable par commits sur la même branche plutôt qu'un revert matériel du socle fonctionnel avant re-dérivation ; ne pas déclarer la revue close avant nouvelle vérification.


## Review Triage Log

Les **74 constats distincts** des trois relectures sont classés individuellement ci-dessous, avant regroupement. Les explications, regroupements, verdicts réfutés et décisions de route figurent également dans [review-smn-11-triage.md](review-smn-11-triage.md).

| ID | Verdict | Route | Preuve / vérification |
|---|---|---|---|
| B01 | medium | patch | Le guide emploie pnpm doctor, alors que le script local n'est invoqué que par pnpm run doctor. |
| B02 | medium | bad_spec | Le diagnostic CLI ne teste ni pnpm ni PostgreSQL et émet toujours le même message, même avec URL configurée. |
| B03 | medium | patch | Le lanceur affiche l'adresse avant la disponibilité effective ; aucune assertion sur EADDRINUSE. |
| B04 | medium | bad_spec | USAGE seul ne prouve pas CREATE ; il faut séparer diagnostic runtime et privilèges de migration. |
| B05 | medium | bad_spec | probePostgres ne récupère pas server_version_num : compatibilité inconnue. |
| B06 | high | bad_spec | La requête ignore schémas, séquences, vues et relations étrangères ; risque de fausse base vierge. |
| B07 | medium | bad_spec | La liste blanche à deux tables classifiera les futures tables SMN comme étrangères. |
| B08 | high | bad_spec | initialized ne nécessite aucune preuve de migration achevée ; faux succès atteignable. |
| B09 | medium | bad_spec | La politique de versions est une égalité codée en dur à 1, sans manifeste versionné. |
| B10 | medium | patch | Les erreurs PostgreSQL 42703/42P01 peuvent être prises pour un échec réseau. |
| B11 | high | patch | Les options de query string sont transmises à pg sans validation ; rejeter l'URL non maîtrisée. |
| B12 | high | bad_spec | Le test PostgreSQL reconstruit le snapshot sans appeler le probe applicatif. |
| B13 | medium | bad_spec | La CI HTTP n'exerce que la base vierge pour /setup, pas les autres états. |
| B14 | low | patch | Le skip des intégrations locales existe ; la documentation doit signaler explicitement ce test non exécuté. |
| B15 | medium | bad_spec | ubuntu-latest n'exerce pas de tests automatisés Windows malgré la cible Windows. |
| B16 | medium | patch | prisma.config.ts manque dans les filtres CI ; pnpm-workspace.yaml est déjà surveillé (partiel). |
| B17 | high | bad_spec | Le job d'installation de dépendances conserve contents:write et les identifiants de checkout. |
| B18 | medium | patch | RootLayout conserve html lang=fr malgré les messages en anglais. |
| B19 | medium | patch | startsWith('en') ne respecte pas les q-values d'Accept-Language. |
| B20 | false | reject | Le workflow d'activation affirme seulement le rendu officiel, non l'exécution intégrale ; la preuve est correctement qualifiée. |
| E01 | high | patch | parseConnectionSettings ignore searchParams puis transmet l'URL brute. |
| E02 | medium | bad_spec | USAGE et CREATE sont distincts ; l'étape de préparation doit afficher l'écart sans exiger CREATEDB par défaut. |
| E03 | high | bad_spec | Les relations d'autres schémas applicatifs échappent au scan SQL. |
| E04 | high | bad_spec | Les objets non-table dans public échappent au scan SQL. |
| E05 | medium | bad_spec | Version serveur jamais interrogée. |
| E06 | medium | bad_spec | Des tables futures rendent la liste blanche à deux noms incompatible. |
| E07 | high | bad_spec | La ligne singleton peut suffire pour initialized sans _prisma_migrations. |
| E08 | high | bad_spec | Aucune lecture de l'état d'échec des migrations ; une base partielle peut être acceptée. |
| E09 | medium | bad_spec | Version de schéma figée à 1, sans politique versionnée. |
| E10 | medium | patch | La projection SELECT id/state/schema_version produit 42703 si colonne absente, classé connection-error. |
| E11 | medium | patch | classifyDatabaseError omet les erreurs structurelles usuelles. |
| E12 | medium | bad_spec | Les requêtes PG sont réalisées séparément sans transaction à instantané cohérent. |
| E13 | false | reject | La page /setup ne modifie aucun état ; une concurrence après lecture ne crée pas une installation et la future mutation doit revalider (SMN-12). |
| E14 | medium | patch | La commande native pnpm doctor masque le script local. |
| E15 | medium | bad_spec | doctor n'éprouve que Node et le port ; le diagnostic PostgreSQL réel est distinct. |
| E16 | medium | patch | Le lanceur ne teste pas le conflit d'occupation et imprime l'adresse avant succès. |
| E17 | medium | patch | Aucun relais explicite des signaux parent-enfant, susceptible de laisser Next actif. |
| E18 | medium | patch | L'attribut HTML lang ne suit pas la langue calculée. |
| E19 | medium | patch | startsWith('en') accepte en;q=0 et ignore son exclusion explicite. |
| E20 | medium | patch | startsWith('en') ignore une langue anglaise supportée située après une langue non supportée. |
| E21 | low | patch | Le skip local est réel et non expliqué dans le guide. |
| E22 | false | reject | La suite intégrée actuelle ne fait que des SELECT et une tentative de connexion à une base absente ; aucune mutation de base réelle démontrée. |
| E23 | high | bad_spec | Le test PostgreSQL existant n'importe jamais probePostgres. |
| E24 | medium | bad_spec | La CI HTTP ne couvre que la base vierge. |
| E25 | medium | bad_spec | Seule la CI Linux existe ; un échec de script natif Windows serait invisible. |
| E26 | medium | patch | Le filtre CI omet prisma.config.ts. |
| E27 | medium | patch | La CI autorise une régénération silencieuse du lockfile absent. |
| E28 | high | bad_spec | contents:write est accessible au code tiers à l'installation. |
| E29 | false | reject | Le workflow bmad-build-activation est un point d'activation unique attesté ; aucune récurrence n'est promise. |
| E30 | false | reject | Le job indique officiellement un rendu et une première lecture uniquement ; il ne se présente pas comme une validation complète. |
| E31 | medium | patch | Le guide fixe encore 3003 après avoir autorisé SMN_PORT=3010. |
| E32 | medium | bad_spec | La matrice est surtout couverte par doubles de tests ; les cas PostgreSQL réels ne sont pas tous exercés. |
| V01 | high | bad_spec | Le probe réel n'est appelé dans aucune suite, seule une requête de test parallèle. |
| V02 | medium | bad_spec | initialized n'est vérifié qu'en snapshot simulé. |
| V03 | high | bad_spec | Le scan SQL de base étrangère n'est pas traversé par les tests sur PostgreSQL réel. |
| V04 | medium | bad_spec | parseConnectionSettings est testé isolément, pas par l'API avec URLs invalides. |
| V05 | medium | bad_spec | Le refus HTTP setup pour initialized/incompatible/incomplete n'est pas testé sur une base réelle. |
| V06 | medium | patch | Le test HTTP n'assert que 200, pas le texte ni le lien setup. |
| V07 | medium | patch | Les deux en-têtes no-store et nosniff ne sont pas vérifiés en HTTP. |
| V08 | medium | patch | Les variantes en/fr ne font l'objet d'aucun test HTTP avec Accept-Language. |
| V09 | medium | patch | Le port 3010 est testé par résolveur seulement, jamais sur Next réel. |
| V10 | medium | patch | Le lanceur n'est pas exercé sur les ports interdits dans les tests. |
| V11 | medium | patch | Aucun cas de port occupé dans les tests de démarrage. |
| V12 | medium | patch | pnpm dev n'est pas testé automatiquement, bien qu'observé en recette Windows. |
| V13 | low | patch | doctor est exécuté seulement sous Node 24 en CI ; aucun test du rejet d'une autre majeure. |
| V14 | medium | patch | La régénération automatique du lockfile absent masque sa suppression. |
| V15 | medium | patch | prisma.config.ts n'est pas un chemin déclencheur. |
| V16 | medium | patch | La CI ne surveille ni les PR vers main/docs ni les push sur main. |
| V17 | medium | bad_spec | L'absence de CI Windows ne teste pas le lanceur et les dépendances natives sur Windows. |
| V18 | low | defer | L'activation ponctuelle du rendu ne surveille pas les changements de skill ; hors validation en cours, outil BMAD transversal. |
| O01 | medium | patch | Le guide utilise la commande native pnpm doctor et non pnpm run doctor. |
| O02 | medium | patch | lang=fr est constant malgré des pages en anglais. |
| O03 | high | bad_spec | La requête PG ignore les objets non-table et les schémas autres que public. |
| O04 | medium | patch | Une erreur SQL 42703 est classée connection-error. |


### Triage de la deuxième revue — clôture par les risques

- **Sources :** 12 constats Blind Hunter, 26 cas Edge Case Hunter, 14 lacunes Verification Gap et 5 constats complémentaires. Un même défaut peut être rapporté par plusieurs agents : **57 observations, pas 57 défauts distincts**.
- **Corrigés / couverture ajoutée** : classification `virgin` sur types composites et snapshots incomplets ; faux `initialized` sur fausse migration ; tests de ports interdits et d'occupation ; protection du déclenchement des fixtures dans la CI ; correction des `q` malformés ; vérification des arrêts de serveurs et de la disponibilité initiale.
- **Report SMN-12 obligatoire** : manifeste Prisma, noms/checksums des migrations et schéma réellement créé ; aucun état `initialized` n'est autorisé aujourd'hui sans ces éléments. Cette limitation empêche le faux positif, tout en permettant d'implémenter la vraie installation par itération.
- **Report amélioration incrémentale** : tests du refus de `USAGE` et `SELECT` sur rôles PostgreSQL, vérification de l'adresse d'écoute au niveau OS, tests d'authentification PG et des modifications concurrentes, robustesse de processus, Windows PostgreSQL réel / utilisateur non élevé, gestion linguistique q=0 de toutes les langues, budget global de délai et historique de migrations volumineux. Ces lacunes ne permettent pas d'ouvrir l'accès privé : les gardes serveur restent fermés.
- **Adaptation BMAD validée par la demande de l'utilisateur** : clôturer l'incrément sur les preuves vérifiées, sans boucle supplémentaire de trois agents ; poursuivre par retours terrain et nouvelles Stories. Les résultats R2 ont été recueillis, mais **aucune troisième revue indépendante n'a été exécutée**.

## Design Notes

Le diagnostic ne crée pas de base : l'installateur SMN-12 assurera sa création confirmée sur le poste. État incertain = refus d'accès privé, jamais interprété comme installation vierge. Le futur domaine reste indépendant des adaptateurs.

## Verification

**Commands:**
- `pnpm install --frozen-lockfile` — reproductibilité.
- `pnpm lint && pnpm test && pnpm build` — contrôles automatisés.
- `pnpm dev` — démarrage, à recetter sous Windows standard.

**Manual checks:**
- Sur le PC : PostgreSQL arrêté, mauvaise connexion, droits insuffisants, base absente, vierge ou existante et URL privée directe. Aucun secret transmis au chat.
