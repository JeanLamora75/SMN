# SMN-249 — Créer des Actions, Décisions et Faits marquants liés depuis le journal

**Story Jira :** https://lmn24.atlassian.net/browse/SMN-249  
**Date :** 25 octobre 2026  
**Branche :** `feat/smn-249-journal-fiches-liees`, issue de `feat/smn-248-registres-journal` (PR #135) ; dépend aussi des PR #134 à #126.  
**Statut :** code développé sur branche, **tests et recette non exécutés**, PR brouillon sans fusion.  
**Sources fonctionnelles :** `_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/{EXPERIENCE,DESIGN,CONTRAT-DEVELOPPEMENT,RECETTE-UX}.md`.

## 1. Parcours fonctionnel

- Depuis le journal de la **Synthèse** de n'importe quelle fiche, seul l'administrateur voit le bouton **« Créer une fiche liée »**.
- Son activation révèle le choix limité à **Action, Décision, Fait marquant** ; chaque option ouvre le formulaire complet de SMN-246 **en modale**.
- La modale reçoit l'équipe autorisée depuis `registry-detail.tsx` → `registry-summary.tsx` → `registry-journal.tsx`, l'ID source de l'URL de la fiche et son titre en contexte **informatif**. Date proposée selon `Europe/Paris`, sans inventer le contenu de la nouvelle fiche ; type et statuts validés selon le référentiel existant.
- La modale réutilisée `registry-create-modal.tsx` accepte `linkedFromJournal` et borne son sélecteur aux trois types. Les autres créations ordinaires depuis la liste ou les réunions conservent leurs types, API et comportement antérieurs.
- À la sauvegarde, la modale appelle **POST `/api/admin/registries/[id]/linked`**, et non deux requêtes indépendantes. **Après réponse serveur 201 confirmée uniquement**, elle se ferme, le journal se recharge, le filtre du nouveau type est sélectionné, et les actions **Voir la fiche**, **Créer une autre** et **Retour à la fiche source** sont proposées. La relation apparaît dans l'onglet Relations lors de sa consultation, les composants existants relisant la base à leur montage.
- Refus, réseau indisponible, 400/409/503 : aucune annonce trompeuse ; les champs de saisie restent dans la modale, sans suppression du brouillon. Escape/Annuler suivent le garde existant de SMN-246. Les commandes sont absentes au rôle `user`.

## 2. Sécurité et transaction serveur

- `src/lib/registry-linked-creation.ts` : contrat strict de type `action | decision | highlight`, `requestId` UUID et propriétés autorisées uniquement. Le client ne peut pas fournir `sourceId`, `cycleId`, acteur, ID de fiche ou champs métier d'un autre type. `details` de décision est limité aux champs prévus ; les validations détaillées sont ensuite celles de `createRegistryItem`.
- `src/app/api/admin/registries/[id]/linked/route.ts` : `authorizeApi(write, settings)` administrateur ; extrait **sourceId des paramètres URL**, jamais du corps soumis, puis appelle `createRegistryItem(db,actor.id,{...fields,sourceId:id},requestId)` sous `withAuthDb`. Les erreurs métier sont exposées en 400/404/409, les erreurs DB en 503. L'API générique `POST /api/admin/registries` est inchangée.
- `src/server/registries/items.ts` : la transaction **BEGIN → validations équipe/source → écritures fiche et audit de création → relation et audit → COMMIT** de SMN-246 est **réutilisée telle quelle**, avec un argument optionnel `requestId` pour le parcours du journal. La source doit exister dans l'équipe active de l'installation `singleton` en Scrum/Kanban ; les types Action/Décision/Fait n'ont aucun lien de cycle implicite et aucun `cycleId` client n'est accepté. Un échec de relation ou d'audit déclenche un ROLLBACK complet, sans fiche orpheline.
- **Protection anti-doublon** : nouvelle table additive `public.smn_registry_linked_request` initialisée dans la transaction d'écriture seule, `request_id` unique, source et acteur, empreinte SHA-256 du contenu métier normalisé et ID de la nouvelle fiche. L'ID créé possède une FK **différée jusqu'au COMMIT** ; la relation `new_item_id` est unique. Une deuxième requête ayant le même ID, la même source, le même acteur et le même contenu renvoie l'ID initial (`replayed:true`) **sans nouvelle création ni écriture d'audit**. Si une même clé est réutilisée avec un contenu différent, retour métier `conflict` → HTTP 409. La modale conserve une clé stable sur les relances identiques et la renouvelle lorsqu'un champ change.
- Les autres producteurs existants (`decision-actions.tsx`, liens de réunions, API générique) n'envoient pas cet argument ; ils ne passent pas par le nouveau contrat. Aucune modification des snapshots Vn clos ni des objets de Sprint.

## 3. Journal fondé sur des faits

- `src/server/registries/journal-links.ts` : lit les relations courantes auditées de SMN-248. Lorsqu'elle existe, la table `smn_registry_linked_request` apporte la preuve explicite que la relation vient du **COMMIT de création du journal**. Elle est rapprochée de la même association **et du même horodatage PostgreSQL de transaction** (`journal_origin.created_at=a.changed_at`) pour éviter de confondre une création initiale avec une **nouvelle association ultérieure**. Si la table n'existe pas, les liens historiques restent affichés comme simples associations.
- `src/lib/registry-journal.ts` : le payload inclut `eventKind: created | linked`, validé strictement. En UI, la première catégorie se traduit par **« Création d’une fiche liée »** ; sinon **« Association »**. Aucun événement n'est déduit d'un statut ouvert, d'une date proche ou d'une fiche simplement disponible.
- Le tri par date réelle, les cinq filtres, le texte legacy non daté et les restrictions auteur/user des Stories SMN-247/248 restent en vigueur.

## 4. Fichiers et tests

Implémentations :
- `src/lib/registry-linked-creation.ts` (nouveau).
- `src/app/api/admin/registries/[id]/linked/route.ts` (nouveau).
- `src/server/registries/items.ts` (extension transaction idempotente).
- `src/server/registries/journal-links.ts`, `src/lib/registry-journal.ts` (provenance vérifiée).
- `src/app/app/admin/registries/registry-create-modal.tsx`, `registry-journal.tsx`, `registry-summary.tsx`, `registry-detail.tsx` (UX).
- `src/i18n/{fr,en}.json` (libellés R11), `src/app/globals.css` (choix compact, mobile).
- `tests/smn-249-journal-linked-creation.test.ts` : **16 scénarios** préparés, **non exécutés**.
- `tests/smn-248-registry-journal.test.ts` adapté au type de provenance et étendu à un scénario (**16 tests**), `tests/smn-246-registry-modal.test.ts` adapté au sélecteur désormais contextuel.

**Contrôles réalisés :** inspection statique des fichiers GitHub, parité JSON FR/EN, structure des autorisations, transaction et source, anti-doublon, création complète, mise à jour des tests précédents. Il ne s'agit **pas** d'une validation TypeScript ou navigateur.

**Non réalisés :** `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, tests PostgreSQL réels, navigation clavier, mobile, zoom 200 %, tests de rôles et concurrents. Aucune exécution de la commande `uv run .../render_skill.py` : le checkout BMAD et uv ne sont pas disponibles dans la session connectée, workflow adapté manuellement aux connecteurs GitHub/Jira sans prétendre exécution officielle.

## 5. AC / recette indispensable

| AC | Code prévu | Preuve encore requise |
|---|---|---|
| AC1 | Bouton journal admin, choix trois types, modale complète réutilisée | Cliquer les trois choix, FR/EN, clavier et mobile |
| AC2 | POST strict, fiche ID unique, audit/association sous COMMIT unique, replay idempotent | PostgreSQL, rollback injecté, soumission simultanée, replay même payload |
| AC3 | Date Paris, source/team validées côté serveur, cycleId refusé | Mauvaise équipe, source non existante, injection sourceId/cycleId, cycle clôturé |
| AC4 | Fiche autonome, Relations existantes et journal avec événement `created` prouvé | Ouvrir registre catégorie cible, Relation source, entrée créée et nouvelle association distincte |
| AC5 | 403 user, 400/404/409/503 sans faux succès ni perte brouillon ; API décision/réunion préservée | Recette rôles, panne réseau, répétition de requête, non-régression réunions/décisions |

### Commandes sur Windows 11 avec GitHub Desktop

```powershell
pnpm exec tsx --test tests/smn-246-registry-modal.test.ts tests/smn-247-registry-comments.test.ts tests/smn-248-registry-journal.test.ts tests/smn-249-journal-linked-creation.test.ts
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Puis tester les trois créations, l'absence de doublons après retry, les droits admin/user, le statut métier valide, la source hors équipe, l'échec d'audit, Relations, les cinq filtres, les thèmes, les résolutions 320/375/768/1024/1440 et le zoom 200 %.

**DoD non atteint avant tests et recette. Ne pas fusionner en main sur la seule revue statique.**
