# SMN-242 — Bandeau des points d'attention collectifs

**Date :** 25 octobre 2026. **Statut : implémentation sur branche, non validée / non fusionnée.**
**Jira :** https://lmn24.atlassian.net/browse/SMN-242.
**Branche :** `feat/smn-242-registres-attention`.
**Base :** `feat/smn-241-registres-cartes` ([PR #128](https://github.com/JeanLamora75/SMN/pull/128)) ; cette branche dépend également des PR #127 (SMN-240) et #126 (SMN-239).
**Contrats :** `_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/{DESIGN,EXPERIENCE,CONTRAT-DEVELOPPEMENT,RECETTE-UX}.md`.

## Implémentation réelle

- `src/app/app/admin/registries/attention-cockpit.tsx` : refonte du cockpit existant en **bandeau compact et repliable**, fermé au départ, nombre connu toujours visible même fermé, `aria-expanded` / `aria-controls`, identifiant `useId` et cible toujours montée, entrées listées sans limitation arbitraire ; raison explicite, type et statut localisés, éventuelle échéance et lien vers une fiche réellement fournie par SMN-104. Erreur et bouton Réessayer ; jamais de faux nombre.
- `src/app/app/admin/registries/registry-list.tsx` : un **unique chargement** de `/api/admin/registries/attention` alimentant le bandeau, la vue Liste et la vue Cartes. Validation stricte de la réponse avant affichage. Retry avec désactivation temporaire du nombre ; pas de faux maintien d'un nombre périmé.
- `src/app/app/admin/registries/page.tsx` : déplacement du rendu du bandeau dans l'index client au-dessus des catégories, sans second appel au producteur.
- `src/lib/registry-attention-view.ts` : parseur de charge utile, qui refuse source absente/invalide et les raisons ou statuts non définis.
- `src/server/registries/attention.ts` : en absence de `smn_registry_item`, retourne un état `unavailable` plutôt qu'une liste vide. Le signal risque à criticité élevée n'est produit que pour un risque **ouvert** et non ROAM Resolved ; absence de probabilité ou d'impact ne devient jamais une criticité élevée.
- `src/app/api/admin/registries/attention/route.ts` : état indisponible renvoyé en HTTP 503 ; équipe autorisée déterminée côté serveur via installation singleton, accès collectif RBAC inchangé.
- `src/i18n/fr.json`, `en.json` : nombres, états « chargement/indisponible », ouverture, fermeture et retry.
- `src/app/globals.css` : bandeau peu haut, détails à la demande, responsive, thèmes existants.
- `tests/smn-242-registry-attention-band.test.ts` : 10 scénarios écrits, **non exécutés**.

## Contrats préservés

- Aucun nouveau seuil ni raison d'alerte ; les cinq raisons existantes du producteur SMN-104 sont réutilisées. Le seuil d'échéance reste celui de `readDeadlineSettings`.
- Le **compteur représente le nombre de signaux**, pas le nombre de fiches uniques ; un enregistrement peut déclencher deux signaux distincts (ex. dépendance « à risque » et échéance proche), conformément à la structure actuelle de SMN-104. Aucune déduplication non décidée.
- Les points d'attention collectifs portent par défaut sur **l'équipe entière**, indépendamment de la catégorie/page filtrée dans la liste. Aucun cycle n'est déduit implicitement. La prise en charge spécifique des liens Kanban par le producteur SMN-104 n'est pas ajoutée dans ce lot.
- Le rôle user ne reçoit aucun responsable nominatif supplémentaire ; les liens pointent vers les routes des fiches existantes.
- Aucune écriture SQL, modification de statut, archivage, notification ou mise à jour de snapshot Vn.

## AC de Jira et preuves

| Critère | État du code | Vérification manquante |
|---|---|---|
| AC1 — Bandeau en tête, nombre réel | Compteur fondé sur `alerts.length` **après validation** | Rendu, données PostgreSQL réelles |
| AC2 — Ouverture accessible, motifs et fiches | Bouton natif, `aria-expanded`, `aria-controls`, liens et libellés | Test clavier/lecteur d'écran |
| AC3 — Repli compact, panne ≠ zéro | État initial fermé, erreur/chargement distincts, retry | Panne simulée navigateur |
| AC4 — Équipe serveur, règles SMN-104 | Route `authorizeApi` et filtre SQL `r.team_id=$1`, aucune nouvelle règle | Essais admin/user, Scrum/Kanban |
| AC5 — 0/1/>5, résolu, FR/EN, responsive | Dix scénarios de test écrits ; deux JSON cohérents | Exécution tests, cinq largeurs et thèmes |

## Contrôles réels

- Lecture de la Story SMN-242, du contrat UX et des sources GitHub.
- **20/20 contrôles statiques ciblés positifs** lors de l'inspection GitHub (pas d'exécution TypeScript).
- Dictionnaires FR/EN parsés et parité des clés `registryAttention` confirmée.
- 10 tests `node:test` écrits et **non exécutés**.
- **Non exécutés :** `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` et recette navigateur.
- Aucune migration nécessaire dans ce lot ; aucune migration appliquée. Les scripts BMAD `uv run` n'ont pas été exécutés faute de checkout disponible dans l'environnement ChatGPT.

## Commandes sur l'environnement Windows 11 SMN

Récupérer la branche de l'incrément puis :

```powershell
pnpm exec tsx --test tests/smn-104-attention.test.ts tests/smn-239-registry-transverse.test.ts tests/smn-240-registry-enriched-list.test.ts tests/smn-241-registry-card-view.test.ts tests/smn-242-registry-attention-band.test.ts
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Recette : administrateur et lecteur `user`, zéro/un/sept signaux, risque résolu, risque sans mesure, source 503, retry, filtre registre conservé, thèmes clair/sombre et largeurs 320, 375, 768, 1024, 1440 pixels.

**Definition of Done non atteinte avant exécution et résolution des erreurs éventuelles.**
