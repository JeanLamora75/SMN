# SMN-250 — Relations regroupées, recherche métier et dissociation confirmée

**Story :** https://lmn24.atlassian.net/browse/SMN-250  
**Date :** 25 octobre 2026  
**Branche :** `feat/smn-250-registres-relations` issue de `feat/smn-249-journal-fiches-liees` / PR #136 ; dépendances amont : PR #135 à #126.  
**État :** implémentation sur branche GitHub ; **tests locaux et recette PostgreSQL non exécutés**, PR brouillon ; ne pas déclarer la Story terminée.

**Contrats validés :** `_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/{EXPERIENCE,DESIGN,CONTRAT-DEVELOPPEMENT,RECETTE-UX}.md` ; Jira SMN-250 AC1–AC5.

## Implémentation

### 1. Relations métier — lecture et restitution

- `src/server/registries/relations.ts` : la lecture préexistante est enrichie des **types/statuts réellement persistés** de source et cible, du statut du Sprint de l'objectif le cas échéant, et de l'ID du Sprint réel portant cet objectif. Les liens entrants et sortants demeurent bornés à la même équipe installée ; aucune modification SQL lors d'un GET. En absence de table optionnelle d'objectifs, un repli SQL typé empêche toute invention d'objet.
- `src/lib/registry-relations-view.ts` : validation stricte des ID, catégories, statuts et sens des relations ; groupement par **type de fiche effectivement présent**, sans rubrique vide artificielle. Les objectifs de Sprint possèdent une catégorie distincte de celles des six registres. Les liens entrants affichent « depuis » et les sortants « vers » uniquement quand la direction est prouvée par la relation. Aucun statut inventé pour les objectifs.
- `src/app/app/admin/registries/registry-relations.tsx` : titres cliquables vers la vraie fiche ; pour un objectif, lien vers le Sprint portant effectivement cet objectif si l'ID est renvoyé par PostgreSQL. Groupe replié dans l'onglet Relations déjà existant, sans duplication du composant des cycles. Consultation possible selon les droits existants ; commandes d'écriture réservées à `canManage`.

### 2. Associer une fiche par titre et type, sans UUID

- `src/server/registries/relation-candidates.ts` et `src/app/api/admin/registries/[id]/relation-candidates/route.ts` : recherche **GET lecture seule**, authentification collective, résolution de l'équipe depuis la fiche source et l'installation `singleton` Scrum/Kanban. Entrées strictes `kind=record|goal`, `types` connu, `search` de 120 caractères maximum, résultats triés et limités à **25**. Paramètres SQL et échappement de `%/_/\\` ; exclusion de la fiche source, pas de DDL ni de liste artificielle quand la source manque (404) ou le producteur est indisponible (503).
- Pour les objectifs (uniquement une fiche **Action**), l'API propose les objectifs de Sprints **non clôturés**, dans la même équipe. L'ancien contrat serveur `changeRelation` vérifie toujours la même contrainte lors de l'écriture.
- `src/app/app/admin/registries/registry-target-search.tsx` : champ natif de recherche de titre, filtre par catégorie de fiche, résultat affichant **titre, type et statut enregistrés** ; choix explicite d'un objet existant, sans demander de coller son ID. Chargement, aucun résultat, source indisponible et Réessayer sont distincts. Les ID ne transitent dans la mutation qu'après sélection d'un résultat fourni par le serveur.
- `registry-relations.tsx` : bouton « Associer une fiche existante », choix enregistré, puis PATCH autorisé sur l'API `relations` déjà auditée. Échec 400/404/409/503 sans faux succès, données de lecture rechargées uniquement après réponse `ok:true`.

### 3. Dissociation sûre et compatibilité des liens connexes

- Avant un PATCH `unlinked`, confirmation explicite : **« Les deux fiches seront conservées »** ou **« La fiche et l'objectif seront conservés »**. Les relations entrantes adressent le véritable `sourceId` du lien, et non automatiquement la fiche courante.
- L'API existante `changeRelation` ne fait **DELETE que sur `smn_registry_relation`** avec les trois composantes de la clé du lien ; elle ajoute une ligne à `smn_registry_relation_audit` dans la transaction, ne supprime ni fiche, ni autre relation, ni statut métier.
- Les liens vers un objectif de Sprint clôturé restent **visibles**, mais leur dissociation est remplacée par un libellé informatif (pas de bouton de mutation) et la règle serveur `s.status<>'closed'` reste bloquante.
- `src/app/app/admin/registries/action-links.tsx` : le champ UUID de liaison aux Décisions/Obstacles est remplacé par le même sélecteur, borné à ces deux types, avec confirmation de retrait. `src/server/registries/action-links.ts` renforce la lecture pour ne retourner que des cibles de la **même équipe** que l'Action.
- `src/app/app/admin/registries/registry-cycles.tsx` : confirmation uniquement à la dissociation, interdiction sur cycles clôturés, validation du payload `cycles/linkedIds` avant affichage, chargement/indisponibilité avec Réessayer. La règle serveur `changeCycleLink` demeure intacte (lien atomique et audit, vérification des cycles ouverts) ; aucune mutation des snapshots Vn.
- Groupes, état vide, sélection et recherche sont responsive et utilisent les variables de thème Bootstrap/SMN existantes dans `src/app/globals.css`, avec empilement mobile sous 575px.
- Catalogues `src/i18n/fr.json` / `en.json` complétés en parité pour recherche, direction, confirmation, absence de résultat, conflit, erreur réseau et cycle clôturé.

## Critères d'acceptation

| AC | Éléments livrés dans le code | Recette restant à exécuter |
|---|---|---|
| AC1 | Groupes de relations non vides, types/statuts réels, direction entrant/sortant, liens vers fiches et Sprint connu, cycles distincts | Parcours avec 0/1/>5 relations, plusieurs types, objectifs sans Sprint et cycles multiples |
| AC2 | Recherche par titre + type, résultat sélectionné, pas d'UUID saisi ; GET borné équipe, limite 25 | Recherche accents/espaces/caractères spéciaux, filtre, pagination/limite et rôles |
| AC3 | Confirmation avant dissociation de fiche/action/cycle/objectif, conservation annoncée | Annuler puis confirmer, liens entrants/sortants, clavier/mobile |
| AC4 | PATCH transactionnel des liens et audit préexistant, objectif/Sprint clos non modifiable, suppression d'un lien seulement | PostgreSQL : plusieurs liens, contrôle SQL, cycle clôturé, conflit 409 |
| AC5 | Lecteurs read-only et source indisponible distincte de vide, équipe isolée, tests ciblés FR/EN | Recette droits admin/user, source non installée, mauvais ID, réseau indisponible, zoom 200 % |

## Tests et limites

- `tests/smn-250-relations-ux.test.ts` : **17 tests rédigés, non exécutés**, couvrant la recherche et ses validations, les groupes et statuts, les liens entrants/sortants, l'écriture dissociée et l'audit, le refus des objectifs clôturés, la confidentialité et les traductions.
- Les tests existants `tests/smn-100-registry-relations.test.ts`, `tests/smn-99-action-links.test.ts` et `tests/smn-97-cycle-links.test.ts` ont été consultés et **ne sont pas supprimés**.
- **48/48 contrôles statiques ciblés positifs** lors de la revue GitHub des domaines critiques ; modifications complémentaires : lecture des liens d'Action bornée à l'équipe, confirmation adaptée aux objectifs et validation des cycles. **Ce nombre est un contrôle documentaire de structure, pas une exécution TypeScript/Node/PostgreSQL.**
- `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` : **non exécutés** ; aucun checkout local accessible ici, pas de dépendances Node ou base de données SMN dans cette session. Une tentative de connexion Git externe vers GitHub a échoué (DNS), donc aucun test local n'est revendiqué.
- **Adaptation BMAD :** `.agents/skills/bmad-agent-dev/SKILL.md`, personnalisations du projet et UX consultés via GitHub ; scripts `uv run .../resolve_customization.py` et `render_skill.py` non exécutés faute de checkout/uv. Approche fondée sur Jira et les connecteurs GitHub, sans prétendre avoir entièrement exécuté le workflow officiel.

### Validation Windows 11

Récupérer la branche via GitHub Desktop et lancer :

```powershell
pnpm exec tsx --test tests/smn-97-cycle-links.test.ts tests/smn-99-action-links.test.ts tests/smn-100-registry-relations.test.ts tests/smn-243-registry-detail.test.ts tests/smn-245-registry-section-editors.test.ts tests/smn-250-relations-ux.test.ts
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Recette manuelle : six catégories ; recherches par titre/type avec et sans résultats ; relations entrantes/sortantes et plusieurs liens ; objectifs de Sprint ouverts/clôturés ; 0/1/multi-cycles, action ↔ décision/obstacle ; suppression annulée/confirmée ; échecs 400/403/404/409/503 ; user lecture seule ; FR/EN, clair/sombre, clavier, 320/375/768/1024/1440px et zoom 200 %.

**Definition of Done non atteinte sans exécution technique et fonctionnelle. PR en brouillon.**
