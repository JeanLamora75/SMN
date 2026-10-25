# SMN-251 — Historique : chronologie réelle et différences dépliables

**Story Jira :** https://lmn24.atlassian.net/browse/SMN-251  
**Date :** 25 octobre 2026  
**Branche :** `feat/smn-251-registres-historique` basée sur `feat/smn-250-registres-relations` (PR #137), chaîne dépendante des PR #136 à #126.  
**Statut :** code publié sur branche, **tests non exécutés**, PR brouillon, DoD non atteinte.  
**Référentiels :** `_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/{EXPERIENCE,DESIGN,CONTRAT-DEVELOPPEMENT,RECETTE-UX}.md`, notamment **REG-T25 et REG-T26**.

## Livrable

### Chronologie serveur, strictement auditée

- `src/server/registries/audit-timeline.ts` : nouveau lecteur **sans DDL/écriture**, exécuté via `withSprintIndexDb` et sous installation `singleton` Scrum/Kanban. Une requête de présence `to_regclass` identifie les producteurs audités existants. Si la table centrale d'audit manque, le lecteur échoue explicitement : **pas de faux historique vide**.
- Sources intégrées lorsque leur table d'audit existe réellement :
  1. `smn_registry_item_audit` (création et révisions générales).
  2. `smn_risk_assessment_audit` et `smn_risk_roam_audit` (évaluation, classification).
  3. `smn_dependency_parties_audit`, `smn_dependency_vigilance_audit` (parties et vigilance).
  4. `smn_decision_detail_audit` (justification/remplacement).
  5. `smn_registry_comment_revision` joint à `smn_registry_comment` (ajout, correction et retrait logique, y compris **Avant/Après** du contenu réellement audité).
  6. `smn_registry_relation_audit`, `smn_registry_cycle_link_audit`, `smn_action_link_audit` (associations/dissociations, y compris relations entrantes si fondées).
- Chaque famille produit `id,kind,revision,event_at,actorName,action,before,after`. Les liaisons historiques sont déduites de leurs **tables d'audit**, jamais des liens courants ou d'un état final. Les libellés de cible sont recherchés en lecture seule, avec vérification d'équipe quand le producteur le permet ; cible indisponible → valeur neutre, **jamais UUID brut ni titre inventé**.
- Les résultats sont fusionnés dans un **UNION ALL SQL** avec ordre global `event_at DESC,id DESC`. Pagination serveur **25 événements/page**, récupération d'une 26e entrée pour `hasMore`, pages bornées 1–10000 ; aucun chargement exhaustif de centaines de révisions en React.
- La route `GET /api/admin/registries/[id]/history?page=N` utilise toujours **`authorizeApi(read,{type:"audit"})`** : pas de changement de droits, route refusée au rôle `user`, page invalide → 400, fiche absente/hors périmètre → 404, source SQL indisponible → 503. Ancien `readRegistryHistory` conservé pour compatibilité des consommateurs historiques.

### Différences et UX

- `src/lib/registry-audit-timeline.ts` : valide strictement type d'événement, action, date réelle avec fuseau, numéro de version, payload et ID. `changedFields` compare de manière déterministe **les seuls champs métier connus du type d'audit**, en excluant `revision`, `teamId`, horodatages techniques et autres métadonnées. Compare aussi les valeurs `null` et les corrections/retraits de texte ; affiche uniquement les changements effectivement tracés.
- `formatAuditValue` ne rend jamais de chaînes UUID ; les parties externes peuvent afficher un nom réellement enregistré, les parties locales une désignation non technique, les objets structurés inconnus restent indisponibles. Les statuts et ROAM connus sont localisés **uniquement pour les champs enum**, sans traduire par erreur le contenu littéral des titres/commentaires.
- `src/app/app/admin/registries/registry-history.tsx` : chronologie compacte **la plus récente d'abord**, type/nature/date/acteur si disponible, `<details>/<summary>` au clavier pour les différences **Avant / Après**, chargement et erreur avec Réessayer, bouton **Charger les événements suivants** si une page supplémentaire existe. Les dates sont formatées en **`Europe/Paris`**, FR/EN ; aucune heure inventée sur une date métier.
- Auteur absent, identifiant technique ou compte non retrouvé : **« Auteur indisponible »**, jamais `actorId` brut. Une entrée d'audit sans valeur métier comparable conserve la trace (date/nature/acteur) mais indique qu'aucune différence comparable n'est disponible, sans inventer une mutation.
- `registry-detail.tsx` donne une **clé `id`** au composant afin que la pagination ne réutilise pas l'historique d'une autre fiche après navigation.
- `src/i18n/fr.json`, `en.json` : catalogue `registryAudit` de même structure, `src/app/globals.css` : cartes compactes, détails natifs, focus et responsive mobile.

### Frontières et arbitrages

- **Ne pas ouvrir l'audit au rôle `user`** : l'arbitrage métier de lecture de l'historique reste ouvert ; le message `historyRestricted` dans la fiche est conservé tel quel. L'accès aux corrections/retraits détaillés des commentaires reste aligné sur SMN-247.
- **Historique technique ≠ Journal de suivi** (SMN-248/249) : les événements sont présentés selon les versions persistées, pas injectés dans les commentaires. Aucun doublon optimiste ni création de fiche.
- **Événement audité ≠ valeur historique reconstruite** : les libellés des cibles supprimées/inaccessibles sont affichés comme indisponibles ; le lecteur ne fabrique pas une ancienne version à partir des propriétés courantes de la fiche.
- **Aucune modification** du modèle de Sprint, des audits append-only, de la création/dissociation de relations ni des snapshots Vn de cycles clos.
- Pagination OFFSET : si plusieurs écritures interviennent entre deux pages, le jeu de résultats peut évoluer ; une pagination sur snapshot durable serait une amélioration ultérieure, non revendiquée ici.

## Critères d'acceptation

| AC | Implémentation | Preuve à recueillir |
|---|---|---|
| AC1 | Audit SQL multi-sources, ordre réel décroissant, nature/date/auteur | PostgreSQL : révisions simultanées et sources optionnelles |
| AC2 | Diff par champs métier modifiés, `null` avant/après, détail accessible | Cas titre seul, changement état, description effacée et ROAM |
| AC3 | Versions commentaires créées/corrigées/retirées et relations/cycles/actions exclusivement audités | Audit réel pour correction/retrait, association/dissociation, aucun événement en absence de table |
| AC4 | Nom quand connu, neutre si auteur manquant/UUID, FR/EN Europe/Paris | Création, correction, auteur supprimé et changement d'heure |
| AC5 | Lecture `audit` admin inchangée, user bloqué dans API et fiche | Test manuel admin/user et accès URL direct |
| AC6 | Pages de 25, états vide/indisponible distincts, détails natifs, tests dédiés | Test 0/1/25/26/100+ événements, erreurs 400/404/503, clavier, 320–1440 px, zoom 200 % |

## Vérifications réellement réalisées

- Story Jira, contrats UX, modèle PostgreSQL des audits et code GitHub consultés.
- **17 tests `node:test` écrits, NON exécutés** : `tests/smn-251-audit-timeline.test.ts`. Cas diff mono-champ/null, commentaire corrigé/retiré, format d'acteur, pagination, installations sans audit, droits, i18n, absence de mutations. Le test historique existant `tests/smn-91-registry-history.test.ts` est conservé.
- Revue statique ciblée positive des sources/droits/typages et de la parité FR/EN ; **aucune exécution de `pnpm`**, pas de validation PostgreSQL ou navigateur, donc pas de DoD.
- Adaptation du workflow BMAD : `.agents/skills/bmad-agent-dev/SKILL.md`, `.agents/skills/bmad-build/SKILL.md`, personnalisations et référentiel UX lus depuis GitHub ; **`uv run .../render_skill.py` non exécuté** faute d'accès au checkout et à uv dans les connecteurs. Aucun résultat de script BMAD n'est revendiqué.

### Validation Windows 11

```powershell
pnpm exec tsx --test tests/smn-91-registry-history.test.ts tests/smn-247-registry-comments.test.ts tests/smn-248-registry-journal.test.ts tests/smn-249-journal-linked-creation.test.ts tests/smn-250-relations-ux.test.ts tests/smn-251-audit-timeline.test.ts
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Recette UI : dates FR/EN Europe/Paris ; commentaire historique et versions autonomes ; risque (probabilité/impact/ROAM), dépendance, décision, associations entrantes/sortantes, lien de cycle et action ; null/ancien acteur inconnu ; 0/1/26/plus de 100 événements ; pagination, réessai après 503 ; droits administrateur vs user ; clavier, focus, clair/sombre, 320/375/768/1024/1440 px et zoom 200 %.

**Ne pas fusionner la PR ni déclarer la Story terminée avant typecheck/build/tests/PostgreSQL/recette réellement exécutés.**
