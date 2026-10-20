---
title: "SMN-12 — Installation Express et premier Administrateur"
type: "feature"
created: "2026-10-20"
status: "draft"
route: "dispatch"
review_loop_iteration: 0
baseline_commit: "4bf60ae4724f1015c68c8a23adf95958d135cd0d"
context:
  - "_bmad-output/implementation-artifacts/epic-1-context.md"
  - "_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ADR-I0-002-MIGRATIONS-SECRETS.md"
---

<frozen-after-approval reason="intention validée dans Jira ; arbitrage de séquencement restant">

## Intent

**Problème :** SMN démarre mais ne permet pas d'installer sa base, son produit, son équipe et son compte Administrateur.

**Approche :** proposer un parcours Express local : vérifier PostgreSQL, faire confirmer la cible et la création éventuelle de la base SMN, appliquer les migrations versionnées et enregistrer atomiquement l'installation, le produit, l'équipe et l'Administrateur.

## Boundaries & Constraints

**Toujours :** Windows 11 sans élévation, Next 16/React 19, PostgreSQL 18/Prisma 7, Bootstrap, port 3003 (3000–3002 réservés). Trois données métier requises : Scrum/Kanban, produit, équipe unique. Compte initial `admin@locahost.com` (orthographe Jira), secret dérivé/stocké sans clair, changement obligatoire avant accès métier. Base locale dédiée, confirmation avant toute écriture, contrôles côté serveur, reprise explicite sur échec.

**Jamais :** modifier LMN24/autre base ; effacer ou réinitialiser silencieusement ; créer un rôle PostgreSQL ou des cycles automatiquement ; activer SAFe ; exposer secret, données privées ou faux accès authentifié.

## I/O & Edge-Case Matrix

| Cas | Résultat |
|---|---|
| Base absente, CREATEDB disponible | créer seulement SMN après confirmation |
| Base absente, droits insuffisants | aucune création ; indiquer comment reprendre |
| Base SMN vierge | appliquer uniquement des migrations officielles validées |
| Base étrangère/partielle | blocage, aucune adoption |
| Mode/produit/équipe invalides | rejet avant écriture |
| Double initialisation/panne | une réussite maximum ; pas de succès partiel |
| Installation terminée | verrouiller l'amorçage anonyme et les données privées |

</frozen-after-approval>

## Open Questions

- **Après installation :** Jira AC2 prévoit un tableau de bord, mais la connexion appartient à SMN-14. **A — recommandé :** afficher un écran de succès sans accès métier puis livrer la connexion et le tableau de bord avec SMN-14. **B :** intégrer maintenant une première connexion et le changement forcé de secret à SMN-12 (travail de sécurité supplémentaire).

## Code Map

- `src/server/installation/diagnostic.ts`, `src/server/db/probe.ts` : diagnostic conservateur SMN-11, à raccorder aux migrations vérifiées.
- `src/app/setup/page.tsx`, `src/app/page.tsx`, `src/server/access-policy.ts` : routes d'installation à protéger.
- `prisma/schema.prisma`, `prisma.config.ts` : schéma actuel de marqueur, migration métier à ajouter.
- `tests/postgres-integration.test.ts`, `.github/workflows/verify-i0.yml` : CI éphémère Linux/Windows, ne jamais viser la base personnelle.

## Tasks & Acceptance

**Execution :**
- [ ] `src/server/installation/**` : préflight, cible et droits, autorisation locale temporaire, confirmation et reprise.
- [ ] `src/server/db/**`, `prisma/schema.prisma`, `prisma/migrations/**` : création contrôlée de la base, migrations versionnées et manifeste, garde-fous et transaction métier.
- [ ] `src/app/setup/**`, `src/app/page.tsx` : formulaire Express, validations, erreurs et succès sans fuite de secrets.
- [ ] `src/server/auth/**` : Administrateur unique et secret sécurisé, changement obligatoire avant métier.
- [ ] `tests/**`, `.github/workflows/**` : tests sur PG éphémère des créations, droits limités, refus, panne et concurrence ; Windows.
- [ ] `docs/INSTALLATION.md`, `README.md` : instructions PowerShell/GitHub Desktop et reprise sans SQL manuel normal.

**Acceptance Criteria :**
- Given une base absente, when l'utilisateur confirme et dispose du droit, then SMN crée seulement sa base dédiée.
- Given les données Express valides, when l'utilisateur confirme, then installation, produit, équipe et admin sont persistés ensemble, sans Sprint.
- Given un schéma étranger ou une requête concurrente, when on tente d'initialiser, then aucune mutation illégitime ni second admin n'est créé.
- Given le premier compte, when on termine, then aucune donnée métier anonyme ni secret en clair n'est exposé.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

Création de base PostgreSQL non transactionnelle : diagnostic et reprise entre création, migration et amorçage. Après succès, seul un manifeste de migrations officiel permet l'état `initialized`. La seule écoute loopback ne vaut pas autorisation de mutation : prévoir une preuve locale à usage unique.

## Verification

`pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`, `pnpm typecheck`, `pnpm build`, CI PG18 éphémère/Windows. Tests Windows utilisateur seulement après autorisation de création, sans partager d'identifiants.
