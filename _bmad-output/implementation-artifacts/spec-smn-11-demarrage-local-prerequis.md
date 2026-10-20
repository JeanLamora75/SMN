---
title: "SMN-11 — Démarrage local et diagnostic fiable des prérequis"
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

**Problem:** Aucune application SMN exécutable n'existe : impossible de lancer le projet sous Windows 11 ou de savoir si PostgreSQL est utilisable sans exposer de secrets.

**Approach:** Fournir le socle Next.js local et un diagnostic serveur explicite, relançable et sécurisé. Montrer une entrée d'installation uniquement si la base dédiée SMN est accessible et non initialisée ; fermer par défaut les routes privées.

## Boundaries & Constraints

**Always:** TypeScript, Node 24 LTS, pnpm, Next.js 16/React 19, Bootstrap 5.3, PostgreSQL/Prisma 7 ; aucun droit administrateur Windows, IDE, Docker ou NestJS requis. Produit fixe, modes Scrum/Kanban, serveur loopback. Les secrets sont fournis localement, jamais dans le dépôt, les URL, les messages ou journaux. Le succès nécessite une vérification réelle ; connexion et privilèges runtime contrôlés sans présumer CREATEDB. Tout accès privé et tout second amorçage anonyme restent refusés.

**Never:** Créer ou modifier LMN24 ; exécuter des migrations contre des données existantes sans confirmation ; installer silencieusement une base, créer un compte, une équipe ou un cycle au démarrage ; simuler l'authentification ; déclarer le parcours Express complet dans cette Story (SMN-12).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Démarrage | Windows standard, dépendances installées | URL locale et page de diagnostic accessible | Échec de démarrage explicite |
| PostgreSQL vierge SMN | Base dédiée accessible, schéma non initialisé | État « à initialiser » et entrée de parcours préparée | Aucune donnée métier créée |
| Base absente | PostgreSQL répond, base SMN manquante | État « base à créer pendant l'installation » | Ne pas affirmer que l'installation est opérationnelle |
| Connexion impossible | Service arrêté, mauvais identifiants ou timeout | Diagnostic sans secret et nouvelle tentative possible | Aucun faux succès |
| Droits insuffisants | Connexion possible, droits runtime manquants | État bloquant et droits nécessaires indiqués | Aucune élévation ni privilège présumé |
| Instance déjà initialisée | Marqueur de schéma et état d'installation connus | Refus côté serveur de /setup sans session | Aucune seconde initialisation |
| Requête anonyme privée | Accès direct à /app ou API métier | Accès refusé côté serveur | Pas de donnée sensible retournée |

</frozen-after-approval>

## Code Map

- Aucun `package.json`, code Next.js, schéma Prisma ni fichier de verrouillage dans la branche documentaire lue ; construire un socle neuf, sans modifier les fichiers BMAD installés.
- `docs/PROJECT-CONTEXT.md`, `docs/ETAT-PROJET-BMAD.md` : règles de reprise et de suivi.
- `_bmad-output/planning-artifacts/preparation-premier-travail-i0.md` : scénario d'installation, limites et preuves attendues.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` : clé `1-1-démarrer-smn-localement-et-vérifier-les-prérequis`, état initial backlog.
- `src/app/`, `src/server/`, `prisma/`, `scripts/` : emplacements futurs ; ne pas feindre qu'ils existent déjà.

## Tasks & Acceptance

**Execution:**
- [ ] `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts` — initialiser et verrouiller une chaîne reproductible Next 16/React 19/Prisma 7/Bootstrap 5.3 compatible Node 24.
- [ ] `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` — rendre la page locale et son état serveur en français, adaptée aux écrans courants.
- [ ] `src/server/installation/diagnostic.ts`, `src/server/db/connection.ts` — vérifier réellement l'accès PostgreSQL et les privilèges de lecture nécessaires, classifier les états sans fuite de secret.
- [ ] `src/app/setup/page.tsx`, `src/app/app/page.tsx` — placer des gardes serveur par défaut, sans inventer le login ou le parcours complet des Stories suivantes.
- [ ] `scripts/doctor.mjs`, `prisma/schema.prisma` — contrôler les prérequis et définir seulement le contrat minimal de version/état, sans création ni migration implicites.
- [ ] `tests/installation-diagnostic.test.ts`, `tests/access-guards.test.ts` — couvrir la matrice (y compris service arrêté, base étrangère et défaillance d'autorisation) par doubles de test et tests serveur.
- [ ] `docs/INSTALLATION.md`, `README.md`, `_bmad-output/implementation-artifacts/sprint-status.yaml` — décrire commandes exactes, limites et preuves ; mettre le suivi à jour selon l'état réel, sans annoncer une livraison non testée.

**Acceptance Criteria:**
- Given un environnement Windows standard conforme, when SMN est lancé, then une adresse locale est affichée et le navigateur peut ouvrir la page sans IDE ni droits élevés.
- Given une base dédiée accessible, when le diagnostic s'exécute, then il distingue installation vierge et installation déjà amorcée sans créer d'objets métier.
- Given une erreur de connexion ou de privilège, when le contrôle échoue, then le message est relançable, explicite et ne révèle aucun secret.
- Given un visiteur anonyme après initialisation, when il accède à /setup ou /app directement, then le serveur refuse la requête sans modifier le système.
- Given les dépendances figées, when l'installation, le lint, les tests et le build sont exécutés, then les échecs sont corrigés ou documentés honnêtement avant revue.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

**Découplage indispensable :** le diagnostic SMN-11 ne crée aucune base ; le script d'installation SMN-12 assurera cette création avec consentement et droits contrôlés. Si la base est absente, le diagnostic l'indique, mais ne prétend pas que l'application métier est prête. Gardes fermés jusqu'à la livraison d'une authentification réelle.

## Verification

**Commands:**
- `pnpm install --frozen-lockfile` — dépendances reproductibles.
- `pnpm lint` et `pnpm test` — vérifications statiques et comportements simulés.
- `pnpm build` — build de production sans exiger d'accès à une base inexistante.
- `pnpm dev` — lancement local en compte ordinaire (preuve Windows sur le PC de l'utilisateur).

**Manual checks (if no CLI):**
- Sous Windows, tester service PostgreSQL arrêté, credentials invalides, droits limités, base absente ou vierge et accès anonyme aux routes ; ne pas transmettre de secrets dans la conversation.
