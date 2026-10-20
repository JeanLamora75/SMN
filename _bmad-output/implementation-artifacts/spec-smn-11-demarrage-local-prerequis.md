---
title: "SMN-11 — Démarrage local et diagnostic des prérequis"
type: "feature"
created: "2026-10-20"
status: "in-review"
route: "dispatch"
review_loop_iteration: 0
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

- **Recette utilisateur Windows partielle (20/10/2026) :** le démarrage SMN et l'affichage de la page de diagnostic sur localhost:3003 sont confirmés par capture d'écran utilisateur. Message visible : « La connexion à la base SMN n'est pas encore configurée ». L'utilisateur a installé et lancé l'application via pnpm et GitHub Desktop ; commande Git CLI absente du PATH, sans incidence pour ce parcours. Deux captures supplémentaires du 20/10/2026 confirment visuellement le refus d'accès (« Accès indisponible / Access unavailable ») pour `http://localhost:3003/app` et `http://localhost:3003/setup`. Le statut HTTP 404 de ces routes a été démontré en CI Linux, pas mesuré sur le PC Windows. Les droits PostgreSQL locaux, les autres cas de diagnostic et la coexistence simultanée des services locaux restent non vérifiés sur le PC.

## Spec Change Log

## Review Triage Log

## Design Notes

Le diagnostic ne crée pas de base : l'installateur SMN-12 assurera sa création confirmée sur le poste. État incertain = refus d'accès privé, jamais interprété comme installation vierge. Le futur domaine reste indépendant des adaptateurs.

## Verification

**Commands:**
- `pnpm install --frozen-lockfile` — reproductibilité.
- `pnpm lint && pnpm test && pnpm build` — contrôles automatisés.
- `pnpm dev` — démarrage, à recetter sous Windows standard.

**Manual checks:**
- Sur le PC : PostgreSQL arrêté, mauvaise connexion, droits insuffisants, base absente, vierge ou existante et URL privée directe. Aucun secret transmis au chat.
