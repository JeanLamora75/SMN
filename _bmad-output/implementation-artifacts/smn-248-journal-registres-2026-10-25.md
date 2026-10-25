# SMN-248 — Journal de suivi : chronologie, commentaire rapide et filtres

**Story :** https://lmn24.atlassian.net/browse/SMN-248  
**Date :** 25 octobre 2026  
**Branche :** `feat/smn-248-registres-journal`, issue de `feat/smn-247-registres-commentaires` / PR #134 ; dépend des PR #133 à #126.  
**Statut :** code sur branche, tests et recette non exécutés ; PR en brouillon, Story non validée.  
**UX :** `_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/{DESIGN,EXPERIENCE,CONTRAT-DEVELOPPEMENT,RECETTE-UX}.md`.

## Réalisation et traçabilité

1. **Source métier vérifiable** : `src/app/api/admin/registries/[id]/journal/route.ts` fournit une réponse unique `{comments,legacy,events}` depuis `withSprintIndexDb` (transaction SQL **READ ONLY**), autorisation collective serveur existante. Cette route réutilise `readRegistryComments` de SMN-247 et `readRegistryJournalLinks` de SMN-248 ; elle ne déclenche ni DDL, ni écriture, ni migration de données historiques. En cas d'indisponibilité du producteur, HTTP 503, **pas de faux journal vide**.
2. **Événements de fiches liées** : `src/server/registries/journal-links.ts` retourne uniquement les associations **courantes et réellement auditées** des Actions, Décisions et Faits marquants. La source est `smn_registry_relation` jointe à une révision `smn_registry_relation_audit` de type `linked`, dont l'instant est cohérent avec la création du lien courant. Les deux fiches sont bornées à l'équipe installée `singleton` en Scrum/Kanban ; absence de tables de relations = absence vérifiée d'événements de ce type. L'acteur est lu depuis le vrai compte associé à l'audit lorsqu'il existe et uniquement transmis au rôle admin. **Aucune création ou association non auditée n'est reconstituée à partir d'un statut actuel.**
3. **Payload sécurisé & filtres** : `src/lib/registry-journal.ts` valide IDs, types, dates PostgreSQL avec fuseau, cohérence des états `edited`/`withdrawn`, dates réelles et champs legacy. Entrées fusionnées/ordonnées sur l'**instant de dernière activité connue** (création du commentaire, date de correction/retrait, association audité), du plus récent au plus ancien ; filtres `Tout / Commentaires / Actions / Décisions / Faits marquants` sans mutation de la source.
4. **Composant client** `src/app/app/admin/registries/registry-journal.tsx` : affichage au sein de la Synthèse SMN-244 ; types, auteurs **lorsqu'autorisés et connus**, horodatages `Europe/Paris`, commentaires en texte intégral, badge « Modifié », retrait discret « Commentaire retiré », liens réels vers les fiches autonomes, états `Chargement / Vide / Aucun résultat du filtre / Indisponible` avec Réessayer et Réinitialiser.
5. **Saisie rapide** : admin uniquement, champ dans le panneau **sans modale** ; POST `/api/admin/registries/[id]/comments` (SMN-247), texte limité à 4 000 caractères ; brouillon conservé sur validation, 400/409, 503 ou panne, effacé et confirmation accessible **après seule réponse 201 `ok=true`, ID et révision confirmés**. Un GET reconstitue le journal ensuite, sans entrée optimiste artificielle.
6. **Correction/retrait** : boutons admin, correction inline via PATCH avec `revision`, concurrence 409 sans perte du texte, retrait après confirmation via HTTP DELETE **logique** du producteur SMN-247 ; contenu retiré masqué en lecture collective. Confirmation avant d'abandonner un brouillon de correction et protection `beforeunload` des saisies en cours.
7. **Versions** : volet de lecture **admin uniquement**, GET `.../comments/[commentId]/revisions` après activation manuelle, vérification des révisions et horodatages, affichage Avant/Après et acteur connu ; contenu de l'audit non rendu au rôle user. Aucune duplication de l'onglet Historique technique.
8. **Commentaire historique `smn_registry_item.comment`** : déplacé de `registry-summary.tsx` vers une **zone séparée** du journal si retourné par l'API (admin seulement), identifié `legacy`, auteur et instant individuels inconnus, non inclus dans la chronologie datée, jamais dupliqué et **aucune migration ou réécriture**.
9. **UX / i18n** : `src/app/globals.css` cartes compactes, boutons/touch targets mobiles, retour une colonne depuis SMN-244 et thèmes existants ; `fr.json` / `en.json` 22 clés `registryJournal` identiques + réutilisation des 26 clés `registryComments` de SMN-247.
10. **Régressions** : `tests/smn-243-registry-detail.test.ts` et `tests/smn-244-registry-summary.test.ts` actualisés pour remplacer l'ancien état « journal indisponible » par le composant réel ; `tests/smn-248-registry-journal.test.ts` contient **15 scénarios non exécutés**.

## Correspondance avec les AC

| AC | Éléments implémentés | Validation restante |
|---|---|---|
| AC1 | Commentaires datés, corrections/retraits, associations auditées d'Actions/Décisions/Faits, ordre descendant et acteurs autorisés | Vérifier chronologie PostgreSQL et associations créées/dissociées/reliées |
| AC2 | POST inline, brouillon conservé sur échec, état de succès uniquement après confirmation | Tester panne réseau, 400/409/503, texte vide et 4 000 caractères |
| AC3 | Cinq filtres accessibles, états vides distincts, marqueur Modifié/retrait discret, reset | Vérifier clavier, mobile et filtre sans résultat |
| AC4 | Journal métier distinct de l'historique technique ; aucune fiche créée par un commentaire ; legacy isolé | Vérifier audits inchangés et absence de doublons |
| AC5 | Liens uniquement vers les IDs audités, consultation user sans contrôles de mutation ni nom d'acteur privé ; auteur réellement connu seulement | Tests admin/user, navigation fiche, thèmes/zoom 200 % |
| AC6 | Tests de parsing, API, SQL à périmètre, chronologie, éditeur, filtres, confidentialité et i18n rédigés | **Exécuter** les tests et la recette réelle |

## Périmètre et limites explicites

- Les **créations sans association auditable** ne sont pas injectées dans le journal : nous préférons un événement manquant à une **fausse création**. Les créations contextuelles (SMN-249) fourniront leurs propres relations atomiques via les producteurs réels ; le journal les affichera si l'audit prouve le lien courant. Les événements de dissociation restent dans l'historique technique, non dans le journal courant.
- Le nom des auteurs des commentaires et relations est **masqué au rôle user** selon le contrat d'API SMN-247, même lorsque la date et le type sont visibles. Un ancien acteur supprimé n'est pas inventé.
- Les versions détaillées sont réservées à l'administrateur (droits `audit` déjà existants). Aucune nouvelle permission ajoutée.
- Les cycles clôturés, les snapshots Vn et le code de la fiche Sprint ne sont pas touchés. Les objets métiers liés restent autonomes.
- L'ancien champ `comment` est distinct ; sa conversion automatique est exclue, conformément au contrat R09.

## Vérifications

- Sources Jira, contrat UX, skill Amelia / BMAD et code SMN-247 consultés via connecteurs.
- Inspections statiques ciblées positives sur les règles SQL, droits, cas UI, parsing, FR/EN et tests ; **ne pas assimiler à `pnpm test` exécuté**.
- **15 tests ciblés écrits, non exécutés** : `tests/smn-248-registry-journal.test.ts`. Tests de SMN-243/244 adaptés mais **non exécutés**.
- **Non exécutés :** `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, tests PostgreSQL, navigateur, lecteur d'écran et recette admin/user.
- Le rendu officiel `uv run .../_bmad/scripts/render_skill.py` nécessite un checkout et `uv` absents de l'environnement connecté. Il n'a pas été exécuté ; adaptation aux connecteurs GitHub/Jira explicitée, sans prétendre à une exécution du workflow officiel.

### Validation Windows 11 après récupération de la branche

```powershell
pnpm exec tsx --test tests/smn-91-registry-history.test.ts tests/smn-243-registry-detail.test.ts tests/smn-244-registry-summary.test.ts tests/smn-247-registry-comments.test.ts tests/smn-248-registry-journal.test.ts
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Recette : fiche ancienne contenant `comment`, 0/1/>5 commentaires, modification et retrait, versions avant/après, associations courantes/rompues, vraie cible liée, acteur connu/indisponible, 409 concurrents, panne réseau, admin/user, FR/EN, clair/sombre, 320/375/768/1024/1440px, clavier, zoom 200 %.

**Definition of Done non atteinte avant tests exécutés et corrections éventuelles.**
