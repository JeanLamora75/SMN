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

<frozen-after-approval reason="intent métier validé dans Jira ; arbitrage restant à confirmer">

## Intent

**Problème :** SMN-11 démarre mais ne peut pas encore installer une base ni enregistrer le produit, l'équipe et l'administrateur initial. Le Scrum Master attend un parcours Express sans SQL manuel.

**Approche :** assistant local en deux phases : préparation/confirmation explicite de la création de la base dédiée `smn`, puis initialisation cohérente du mode Scrum/Kanban, produit, équipe unique et administrateur. Aucun accès privé anonyme.

## Boundaries & Constraints

**Toujours :** Windows 11 sans privilèges élevés, Node 24/pnpm, Next 16/React 19, Prisma 7/PostgreSQL 18, Bootstrap ; port SMN 3003, autres ports 3000–3002 réservés. Administrateur initial `admin@locahost.com` (graphie validée dans l'architecture), secret jamais publié ni enregistré en clair, changement obligatoire avant métier. Les seules données *métier* requises sont mode Scrum/Kanban, produit et équipe unique. Base dédiée locale, confirmation préalable des impacts et droits, migrations versionnées, protections serveur, état incohérent = blocage.

**Jamais :** LMN24, modifications d'une base étrangère, suppression/recréation silencieuse, création de rôle PostgreSQL sans autorisation, SAFe/ART, Sprint ou période Kanban automatique, publication de secrets dans GitHub ou les journaux, faux login, privilèges Windows élevés, accès aux données métier sans session.

## I/O & Edge-Case Matrix

| État / scénario | Résultat |
|---|---|
| Base absente / droits CREATEDB disponibles | afficher cible et impacts, recueillir confirmation, créer seulement `smn` ; pas avant |
| Base absente / privilèges insuffisants | expliquer la reprise, aucune création revendiquée |
| Base dédiée vierge | préparer/appliquer uniquement les migrations validées après confirmation |
| Base étrangère ou état non reconnu | refuser toute adoption / modification |
| Mode, produit ou équipe invalides | rejet sans écriture, validation côté serveur |
| Installation Express réussie | installation, produit, équipe et compte admin uniques et persistants, sans cycle |
| Double requête / panne à mi-parcours | une seule initialisation ; absence de succès partiel, reprise explicite |
| Réouverture anonyme | assistant d'écriture refusé après succès, données privées jamais accessibles |

</frozen-after-approval>

## Open Questions

- **Accès après l'initialisation (conflit d'étapes Jira) :** SMN-12 AC2 demande d'aller au tableau de bord, alors que SMN-14 porte la connexion et la protection des sessions. **A (recommandé) :** SMN-12 crée le compte et affiche un succès sans ouvrir le tableau de bord privé ; SMN-14 ajoutera connexion et accès au tableau de bord. **B :** SMN-12 inclut dès maintenant une authentification minimale avec changement obligatoire du secret initial pour accéder à un premier tableau de bord ; périmètre et risques supplémentaires.

## Code Map

- `src/server/installation/diagnostic.ts`, `src/server/db/probe.ts` — garde-fous de SMN-11 : mise à jour nécessaire pour reconnaître les migrations officielles plutôt que des fixtures.
- `src/app/setup/page.tsx`, `src/app/page.tsx`, `src/server/access-policy.ts` — flux Express et verrouillage anonyme.
- `prisma/schema.prisma`, `prisma.config.ts` — contrat et migrations versionnées ; ne pas lancer `prisma db push` sur la base utilisateur.
- `scripts/serve.mjs`, `docs/INSTALLATION.md` — configuration locale et procédure Windows existantes, préserver 3003.
- `tests/postgres-integration.test.ts`, `.github/workflows/verify-i0.yml` — PostgreSQL éphémère / jobs Linux et Windows ; aucune fixture sur une vraie base utilisateur.

## Tasks & Acceptance

**Execution :**
- [ ] `src/server/installation/**` — états d'amorçage et contrôles de droits/versions, choix de cible, confirmation explicite, idempotence et revalidation avant mutation.
- [ ] `src/server/db/**`, `prisma/migrations/**`, `prisma/schema.prisma` — création dédiée si absente et autorisée, schéma réel versionné, transactions et journal des migrations ; ne toucher aucune base existante inconnue.
- [ ] `src/app/setup/**`, `src/app/page.tsx` — interface Express (Scrum/Kanban, produit, équipe) et saisie de l'administrateur ; secrets masqués, pas de données métier en URL.
- [ ] `src/server/auth/**` — compte initial unique, secret dérivé avec sel et indicateur de changement obligatoire ; fermer l'anonymat après initialisation.
- [ ] `tests/**`, `.github/workflows/**` — base absente, vierge, étrangère, privilèges limités, installation interrompue/concurrente, validations et absence de fuite ; CI Linux PG18 + Windows.
- [ ] `docs/INSTALLATION.md`, `README.md` — guide GitHub Desktop/PowerShell, confirmation de création, sauvegarde et reprise, sans secrets réels.

**Critères d'acceptation :**
- Given un PostgreSQL 18 local, when l'utilisateur confirme une installation dédiée, then seule la base SMN visée est créée si les privilèges le permettent, jamais LMN24.
- Given les données Express valides, when l'installation est confirmée, then produit, équipe et administrateur sont persistés de manière cohérente sans cycle.
- Given deux installations concurrentes ou une panne, when l'amorçage échoue, then aucune seconde installation ni accès métier anonyme n'est obtenu.
- Given un compte initial, when SMN prépare l'accès, then le secret n'est pas publié et son changement est obligatoire avant l'usage métier.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

**Ordre de livraison visé :** base et droits → migrations versionnées → formulaire Express → compte initial et contrôle d'unicité → tests sur base éphémère → recette Windows après validation. La création PostgreSQL `CREATE DATABASE` n'est pas transactionnelle ; reprendre explicitement après interruption. Conserver un accès local d'amorçage à usage unique sans considérer le seul loopback comme une authentification.

## Verification

**Commandes :** `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`, `pnpm typecheck`, `pnpm build`, smoke HTTP et PostgreSQL 18 en runner isolé, Windows en CI.

**Recette réelle ultérieure :** installer depuis GitHub Desktop sur Windows standard et confirmer chaque écriture ; ne transmettre aucun identifiant PostgreSQL à ChatGPT.
