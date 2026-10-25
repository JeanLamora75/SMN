# SMN-247 — Commentaires autonomes, révisions et retrait logique

**Story Jira :** https://lmn24.atlassian.net/browse/SMN-247  
**Date :** 25 octobre 2026  
**Branche :** `feat/smn-247-registres-commentaires`, basée sur `feat/smn-246-registres-creation-modale` / PR #133 ; dépend de la chaîne PR #132 à #126.  
**Statut :** implémentation serveur en PR brouillon, contrôles statiques ciblés positifs ; tests d'exécution, PostgreSQL, migration en environnement et recette non réalisés.

## Contrat métier et modèle additif

La fiche `smn_registry_item` et son champ legacy `comment` **ne sont pas modifiés**. Le journal de commentaires dispose désormais de deux tables additionnelles créées seulement au premier POST autorisé, **dans la transaction de l'écriture** et jamais dans les GET :

### `public.smn_registry_comment`

- `id` (UUID stocké en `text`), `item_id` FK `smn_registry_item` avec `ON DELETE RESTRICT`.
- `body` non vide, au plus 4 000 caractères, `revision` monotone initialisée à 1.
- `author_id` (compte authentifié et actif), `author_name` (snapshot du vrai `username` serveur au moment de l'ajout), `created_at` horodaté par PostgreSQL.
- `edited_at`, `editor_id`, `editor_name` actualisés lors d'une correction ; `withdrawn_at`, `withdrawn_by`, `withdrawn_by_name` lors du retrait logique.
- L'auteur et la date de création **ne changent pas** lors d'une correction ; le texte source demeure physiquement en base lors du retrait pour permettre l'audit, mais il est masqué de la lecture courante.

### `public.smn_registry_comment_revision`

- `id`, `comment_id` FK RESTRICT, `revision` avec contrainte unique par commentaire.
- Action `created | edited | withdrawn`, `before_text`, `after_text`, `actor_id`, `actor_name` et `changed_at`.
- Insert-only par les API ; aucune API ne permet UPDATE ni DELETE sur l'audit ; la création et chaque mutation sont auditées **dans la même transaction** que l'état courant. L'historique de contenu retiré est uniquement accessible via l'API d'audit administrateur.

## API et autorisation

- `GET /api/admin/registries/[id]/comments` : lecture collective autorisée, commentaires triés `created_at DESC,id DESC`. Champs `text=null, withdrawn=true` lors d'un retrait ; date de création conservée et `edited=true` si correction réellement enregistrée. Les noms d'auteurs/éditeurs ne sont retournés qu'au rôle admin. Les lecteurs `user` voient les données collectives sans ces noms.
- `POST /api/admin/registries/[id]/comments` corps `{text}` : administrateur via `authorizeApi(write, settings)`, contrôle du périmètre `singleton`, équipe installée Scrum/Kanban, validation stricte 1–4 000 caractères (aucune origine, date ou auteur arbitraire fournis par le client), acteur actif lu en base. Réponse 201 uniquement après COMMIT et audit confirmé.
- `PATCH /api/admin/registries/[id]/comments/[commentId]` corps `{text,revision}` : administrateur, fiche et commentaire verrouillés pour la transaction, contrôle de révision, nouvelle version avant/après et acteur réel, date initiale conservée. Réponse 409 si conflit, retrait antérieur ou concurrence.
- `DELETE /api/admin/registries/[id]/comments/[commentId]` corps `{revision}` : administrateur ; **HTTP DELETE ≠ SQL DELETE**. Mise à jour `withdrawn_at` et version `withdrawn`, audit conservé, révisions suivantes interdites ; 409 si déjà modifié ou retiré.
- `GET /api/admin/registries/[id]/comments/[commentId]/revisions` : **droit audit admin uniquement**, lecteur read-only et versions `revision DESC` comprenant Avant/Après et auteur réel snapshot.
- Les erreurs de base remontent en **503**, les objets hors périmètre/non trouvés en 404 et les validations invalides en 400. Toute erreur d'INSERT audit déclenche un **ROLLBACK**. Les en-têtes privés `no-store` reprennent `jsonResult` commun.

## Stratégie *legacy* (aucune migration destructrice)

Décision d'implémentation : **ne pas migrer automatiquement** `smn_registry_item.comment` vers un commentaire autonome ; il manquerait notamment un auteur individuel, une date d'enregistrement et des preuves d'ordre. Une conversion artificielle fabriquerait une fausse chronologie et dupliquerait le texte. À la lecture, l'API renvoie le champ legacy séparément via `legacy: {text,author:null,recordedAt:null,origin:"legacy"}` **pour admin seulement**, conformément aux restrictions préexistantes de la fiche. Les utilisateurs `user` reçoivent `legacy:null`. Aucun champ legacy n'est remis à zéro, modifié, remplacé ou absorbé dans le journal. La couche UI SMN-248 devra afficher le panneau legacy à part et **éviter de dupliquer** la présentation déjà existante `registry-summary.tsx`.

Migration future éventuelle : réaliser une Story de conversion explicite après arbitrage des règles de provenance/auteur, avec simulation idempotente, audit et sauvegarde ; **aucune reprise automatique n'est exécutée dans SMN-247**.

## Découpage UI / tests

L'interface « Ajouter commentaire rapide », les filtres du journal, l'affichage chronologique et les actions « Modifié/Retiré » constituent **SMN-248**, non anticipée ici. Les valeurs enregistrées, dates, marqueurs et traductions nécessaires sont fournies par les API.

- Traductions `registryComments` : **26 clés FR/EN** pour ajout, correction, retrait, Auteur indisponible, Modifié, versions, erreurs 409/503 et legacy non daté.
- `tests/smn-247-registry-comments.test.ts` : **18 tests écrits, non exécutés** : validation, écriture atomique/audit, état hors scope, 409, rollback audit, avant/après, suppression logique, révision après retrait interdite, lecteur admin/user, absence de DDL et champ legacy séparé.
- Inspection statique sur GitHub : **30/30 contrôles ciblés positifs** (aucun `pnpm` exécuté). Ces contrôles ne garantissent pas le résultat des tests.
- `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` : **non exécutés**.
- Aucune modification de la fiche Sprint, des snapshots Vn clos, des notes ou des faits marquants automatiques.
- BMAD Amelia : skill et personnalisation projet lus depuis GitHub. Workflow `bmad-build` officiel via `uv run .../render_skill.py` **non exécuté** faute de checkout/uv accessible ; étapes adaptées manuellement aux connecteurs GitHub/Jira, sans prétendre à une validation BMAD ou SQL réelle.

## Correspondance aux AC

| Critère | Code disponible | Preuve manquante |
|---|---|---|
| AC1 | Enregistrement indépendant ; auteur depuis compte actif, date PostgreSQL, FK vers fiche ; legacy intact | Écriture réelle dans PostgreSQL et audit associé |
| AC2 | Ajout successif, tri chronologique, admin écriture, scope installation, validation, transaction | Tests rôles admin/user, multiéquipe incohérente, dates/ordre réels |
| AC3 | Concurrence par `revision`, audit Avant/Après, acteur et date de modification ; créé inchangé | Vérifier deux éditions concurrentes, données de révision réelles |
| AC4 | Retrait logique avec nouvelle révision ; `text=null` et marqueur `withdrawn` en lecture | Vérifier visibilité journal SMN-248, historisation de la suppression |
| AC5 | Legacy lu séparément, sans fausse conversion | Arbitrage d'une éventuelle migration de données historique |
| AC6 | 18 scénarios et textes FR/EN préparés | Exécution tests automatisés / API, build, migrations et recette |

## Validation locale Windows 11

Depuis le dépôt à jour sur la branche :

```powershell
pnpm exec tsx --test tests/smn-89-registry-creation.test.ts tests/smn-91-registry-history.test.ts tests/smn-247-registry-comments.test.ts
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Vérifier ensuite en base que les deux tables et leur index sont créés **au premier POST admin**, et jamais par GET ; tester explicitement admin/user, commentateurs actifs/inactifs, auteurs renommés/supprimés, fiche hors périmètre, 1/4000/4001 caractères, modification 409, retrait réitéré 409, erreur SQL audit -> rollback et une fiche contenant déjà `smn_registry_item.comment`.

**Definition of Done non atteinte avant tests, correctifs et recette. Ne pas fusionner la PR sur simples inspections statiques.**
