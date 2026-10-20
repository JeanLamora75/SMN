---
title: "SMN-11 — Démarrage local et diagnostic des prérequis"
type: "feature"
created: "2026-10-20"
status: "draft"
route: "dispatch"
review_loop_iteration: 0
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
- [ ] `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts` — initialiser la stack et figer des versions réellement compatibles.
- [ ] `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` — écran de démarrage minimal, lisible et responsive en français.
- [ ] `src/server/installation/diagnostic.ts`, `src/server/db/connection.ts` — états PostgreSQL, droits minimaux et absence de fuite de secrets.
- [ ] `src/app/setup/page.tsx`, `src/app/app/page.tsx` — gardes serveur fermés sans session ; aucune initialisation implicite.
- [ ] `scripts/doctor.mjs`, `prisma/schema.prisma` — diagnostic des prérequis et contrat minimal d'état de schéma, sans écriture ni migration automatique.
- [ ] `tests/installation-diagnostic.test.ts`, `tests/access-guards.test.ts` — tester tous les cas de la matrice, avec doubles de test et vérification serveur.
- [ ] `docs/INSTALLATION.md`, `README.md` — consignes Windows, secrets privés, limitations actuelles et commandes reproductibles.
- [ ] `_bmad-output/implementation-artifacts/sprint-status.yaml` — renseigner uniquement une progression réellement démontrée.

**Acceptance Criteria:**
- Given un Windows 11 ordinaire avec prérequis, when SMN démarre, then l'URL locale s'ouvre sans IDE ni élévation.
- Given une base SMN accessible, when le diagnostic passe, then l'état vierge ou initialisé est distingué sans créer d'équipe ni cycle.
- Given une connexion, un schéma ou des droits incorrects, when la vérification échoue, then l'utilisateur obtient une erreur relançable sans secret.
- Given un visiteur anonyme, when il ouvre /app ou /setup sur une installation existante, then le serveur refuse l'accès.
- Given le lockfile, when l'installation, les tests et le build sont exécutés, then leurs résultats sont tracés sans faux succès.

## Implementation Notes

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
