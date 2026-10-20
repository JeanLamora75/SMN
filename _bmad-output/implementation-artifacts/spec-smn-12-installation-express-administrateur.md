---
title: "SMN-12 — Installation Express et premier Administrateur"
type: "feature"
created: "2026-10-20"
status: "in-progress"
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

**Décision approuvée du 20/10/2026 (option A) :** après une installation réussie, afficher une confirmation sans accès privé ; la connexion, le changement du secret initial et le tableau de bord seront livrés avec SMN-14. Le secret initial ne doit jamais être créé ou affiché de manière implicite.

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
| Installation terminée | afficher le succès sans session ni tableau de bord ; verrouiller l'amorçage anonyme et les données privées |

</frozen-after-approval>

## Amendement approuvé — installation autonome du pilote (20/10/2026)

La demande utilisateur **approuve explicitement l'installation complète incluant PostgreSQL portable lorsque nécessaire, sans droits administrateur ni aucune saisie technique**. Cette décision ultérieure **supplante les préconditions de PostgreSQL préinstallé et de configuration PowerShell manuelle** inscrites dans la première conception ci-dessus, sans effacer leur historique approuvé. Les critères ajoutés et la procédure détaillée figurent dans le [plan d'installation portable sur `main`](../../../docs/SMN-12-CONCEPTION-INSTALLATION-PORTABLE-PILOTE.md).

**Périmètre de reconception :** produire une distribution Windows x64 avec Node intégré, qualifier la distribution PostgreSQL 18 portable (source, licences, SHA-256, prérequis), lancer un cluster SMN strictement dédié sous le compte Windows, protéger automatiquement la configuration locale et fournir un assistant pilotable par double-clic, sans jeton, URL ni commande manuelle. Instance PostgreSQL d'une autre application : jamais de réutilisation ou modification implicite. Confirmation avant toute création ; aucun accès métier avant SMN-14.

**État de réalisation réel :** l'implémentation SMN-12 initiale a passé sa CI mais nécessite encore `SMN_DATABASE_URL` et `SMN_SETUP_TOKEN` ; elle **ne satisfait pas** les nouveaux critères d'installation autonome. La Story revient donc à `in-progress`. Les coches existantes sous Tasks & Acceptance correspondent **seulement à l'ancienne implémentation**, pas au nouveau paquet portable. Phase suivante : P0 faisabilité du binaire Windows standard avant de promettre une livraison utilisable.

## Code Map

- `src/server/installation/diagnostic.ts`, `src/server/db/probe.ts` : diagnostic conservateur SMN-11, à raccorder aux migrations vérifiées.
- `src/app/setup/page.tsx`, `src/app/page.tsx`, `src/server/access-policy.ts` : routes d'installation à protéger.
- `prisma/schema.prisma`, `prisma.config.ts` : schéma actuel de marqueur, migration métier à ajouter.
- `tests/postgres-integration.test.ts`, `.github/workflows/verify-i0.yml` : CI éphémère Linux/Windows, ne jamais viser la base personnelle.

## Tasks & Acceptance

**Execution :**
- [x] `src/server/installation/**` : préflight, cible et droits, autorisation locale temporaire, confirmation et reprise.
- [x] `src/server/db/**`, `prisma/schema.prisma`, `prisma/migrations/**` : création contrôlée de la base, migrations versionnées et manifeste, garde-fous et transaction métier.
- [x] `src/app/setup/**`, `src/app/page.tsx` : formulaire Express, validations, erreurs et succès sans fuite de secrets.
- [x] `src/server/auth/**` : Administrateur unique et secret sécurisé, changement obligatoire avant métier.
- [x] `tests/**`, `.github/workflows/**` : tests sur PG éphémère des créations, droits limités, refus, panne et concurrence ; Windows.
- [x] `docs/INSTALLATION.md`, `README.md` : instructions PowerShell/GitHub Desktop et reprise sans SQL manuel normal.

**Acceptance Criteria :**
- Given une base absente, when l'utilisateur confirme et dispose du droit, then SMN crée seulement sa base dédiée.
- Given les données Express valides, when l'utilisateur confirme, then installation, produit, équipe et admin sont persistés ensemble, sans Sprint.
- Given un schéma étranger ou une requête concurrente, when on tente d'initialiser, then aucune mutation illégitime ni second admin n'est créé.
- Given le premier compte, when on termine, then aucune donnée métier anonyme ni secret en clair n'est exposé.

## Implementation Notes

- 2026-10-20 — Option A approuvée et reflétée dans la description Jira SMN-12 : l'installation crée les premières données et l'Administrateur, mais le tableau de bord et le changement du secret initial restent à SMN-14.
- Réalisation : `src/app/setup` (interface et confirmation), `src/app/api/setup/route.ts` (jeton local et contrôle d'origine), `src/server/installation/install.ts` (préflight, création contrôlée et transaction), `prisma/migrations/20261020_smn12_initial/migration.sql` (schéma versionné), `src/server/db/probe.ts` (reconnaissance du schéma et du checksum), `prisma/schema.prisma` (contrat), tests et documentation.
- Les tests d'écriture PostgreSQL s'exécutent seulement sur un service éphémère GitHub Actions ; sur Windows CI, la suite PG est volontairement ignorée. Aucun essai sur le PostgreSQL réel de l'utilisateur n'a été réalisé.
- **Validation CI** : https://github.com/JeanLamora75/SMN/actions/runs/39417243723 — **Linux : 37 tests/37 réussis, lint/typecheck/build, validation du schéma Prisma et smoke HTTP** ; **Windows : tests applicatifs, build et smoke de démarrage réussis**. Les essais incluent le refus de la double initialisation et deux requêtes concurrentes sur une base dédiée jetable.
- **Restes à valider en recette locale** : saisie et confirmation dans le navigateur Windows standard, droits effectifs du rôle PostgreSQL 18.6 de l'utilisateur, dossier de secrets privé durable (SMN-19), authentification et changement forcé du mot de passe initial (SMN-14). La mutation sur la base réelle ne sera effectuée qu'après confirmation depuis le formulaire.
- **Adaptation BMAD** : `uv run .../render_skill.py` n'a pas été exécuté sur le poste utilisateur, car les commandes de ce dépôt ne sont pas accessibles localement par les connecteurs ; étapes BMAD suivies manuellement et preuve issue de GitHub Actions. Aucune revue indépendante supplémentaire n'est affirmée.


- 2026-10-20 : option A explicitement approuvée. Adaptation ChatGPT : exécution locale obligatoire du rendu BMAD impossible depuis le connecteur GitHub ; application manuelle traçable de la spécification et des étapes disponibles, sans prétendre avoir exécuté `uv run`.

## Spec Change Log

- 2026-10-20 — Retour direct utilisateur de la recette : l'installateur portable échouait après environ deux minutes sans message exploitable, le champ de mot de passe Admin de 14 caractères est rejeté, et les identifiants PostgreSQL sont demandés pour un serveur déjà installé. Correctifs fonctionnels : modes PostgreSQL existant ou portable, champs user/pwd/port, configuration locale chiffrée, valeurs Admin MVP `admin@localhot.com`/`admin`/`admin`, minimum 4 caractères, et progression par étapes. Le formulaire utilise le texte d'accueil exact demandé. Seuls des tests CI complets et un retour utilisateur permettront de déclarer cette nouvelle itération achevée.


## Review Triage Log

- Phase 1 de revue par tests et correction itérative : échec lint JSX puis correctifs, erreur Prisma datasource puis correction, nouvelle couverture PostgreSQL créée. Aucune revue externe officielle encore recueillie pour SMN-12. Le statut `in-review` représente une préparation à la recette et à l'examen de la PR, **pas une acceptation utilisateur ni une fusion dans main**.

## Design Notes

Création de base PostgreSQL non transactionnelle : diagnostic et reprise entre création, migration et amorçage. Après succès, seul un manifeste de migrations officiel permet l'état `initialized`. La seule écoute loopback ne vaut pas autorisation de mutation : prévoir une preuve locale à usage unique.

## Verification

`pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`, `pnpm typecheck`, `pnpm build`, CI PG18 éphémère/Windows. Tests Windows utilisateur seulement après autorisation de création, sans partager d'identifiants.
