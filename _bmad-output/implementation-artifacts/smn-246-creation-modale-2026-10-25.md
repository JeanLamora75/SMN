# SMN-246 — Création complète en modale et retour contextuel

**Date :** 25 octobre 2026. **Jira :** https://lmn24.atlassian.net/browse/SMN-246  
**Branche :** `feat/smn-246-registres-creation-modale`. Issue de `feat/smn-245-registres-edition-sections` (PR #132), dépendante des PR #131 → #126.  
**Statut : code sur branche, contrôles statiques positifs, tests et recette non exécutés, PR non fusionnée.**
**Référence UX :** `_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/{DESIGN,EXPERIENCE,CONTRAT-DEVELOPPEMENT,RECETTE-UX}.md`.

## Modification technique

1. **Modale complète** `src/app/app/admin/registries/registry-create-modal.tsx` : formulaire natif `dialog.showModal()`, titre, date civile `Europe/Paris`, type parmi six, statut autorisé, description intégrale, propriétaire optionnel, échéance et ancien commentaire, puis champs métier conditionnels. Champs courts côte à côte, champs longs largeur totale, un seul POST et un seul Enregistrer.
2. **Champs métier du POST initial** :
   - Risque : probabilité/impact optionnels (1–3), ROAM optionnel selon le vocabulaire existant ; pas de score ou d'urgence inférés si non évalué.
   - Dépendance : demandeur/contributeur **facultatifs ensemble**, parties locales/externes validées, vigilance booléenne.
   - Décision : justification optionnelle, décision remplacée optionnelle sélectionnée par recherche de titre et date, **jamais saisie directe d'UUID** ; cible existante bornée à l'équipe.
   - Obstacle, Action et Fait marquant : champs généraux/statut correspondants, sans inventer de champs métier requis ; les associations avancées d'actions et le journal seront traités par les Stories spécialisées SMN-249/250.
3. **Extension rétrocompatible du POST** `src/server/registries/items.ts` et nouveau `src/server/registries/initial-details.ts` : les anciennes créations sans `details` restent acceptées ; validation des champs selon le type **avant toute mutation** ; une unique transaction englobe base, audit initial, données métier, audits spécialisés, éventuellement lien au cycle, lien explicite vers une fiche source et audit de ce lien. **Une panne du détail entraîne ROLLBACK de toute la création**. Les mécanismes d'alertes automatiques suivent les sources métier existantes.
4. **Source/contextes** : `sourceId` facultatif, accepté seulement si la fiche source appartient à la même équipe installée ; association enregistrée atomiquement et lisible dans le registre. Les cycles connus ne sont liés à la création que pour les types risk/obstacle, selon le producteur déjà existant, et jamais à un cycle clos. `returnTo` autorisé uniquement pour un chemin local sous `/app/` validé par `src/lib/registry-return-context.ts`, pour éviter une redirection externe.
5. **Entrées UX** : `registry-list.tsx` ouvre directement la modale depuis « Nouvelle fiche » et maintient recherche, catégorie, cycle, pagination et choix Liste/Cartes. `create/page.tsx` redirige les liens historiques vers `?create=1`, en conservant le type, la source et le cycle. `page.tsx` fournit le `teamId` obtenu côté serveur : la **première fiche** peut être créée même quand `smn_registry_item` n'existe pas et que la liste est momentanément indisponible.
6. **Après COMMIT uniquement** : la modale se ferme, le registre et les signaux SMN-104 se rechargent ; un bandeau de confirmation présente « Voir la fiche », « Créer une autre » et, si connu, « Retour à la fiche source » ou « Retour au contexte d'origine ». Si la fiche nouvelle apparaît sur la page filtrée, une mise en évidence temporaire CSS lui est appliquée. Cette mise en évidence n'est **pas** un statut métier ; si les filtres excluent la fiche, l'action « Voir la fiche » reste disponible.
7. **Erreurs et abandon** : 400/409/503 ou réponse non confirmée n'effacent aucun champ. Annuler/Escape déclenche une confirmation lorsque le brouillon a été modifié ; le bouton est bloqué pendant l'enregistrement ; verrouillage de focus natif et retour au déclencheur. Le composant React est démonté puis recréé pour « Créer une autre ».
8. **Style & i18n** : `src/app/globals.css` modale centrée 800px maximale, body à défilement interne et actions fixes au bas de la modale, mobile et zoom à vérifier ; catalogues `fr.json` / `en.json` 42 clés identiques dans `registryCreateModal`.

## Critères Jira

| AC | État du code | Recette indispensable |
|---|---|---|
| AC1 — Six types, formulaire complet et métier | Formulaire unique + données spécialisées conditionnelles ; aucune obligation inventée | Six créations sur base réelle, règles d'états et absence de détails |
| AC2 — Compacité, défilement, actions accessibles | Grille responsive, corps scrollable, pied restant en place | Mobile 320/375, zoom 200 %, clavier et focus |
| AC3 — Préremplissage, auth, liens/audits atomiques | Date Europe/Paris ; type et source/cycle de contexte ; API serveur inchangée sur RBAC, transaction étendue | Contrôle direct user interdit, source autre équipe, cycle fermé, rollback simulé et données persistées |
| AC4 — Brouillon conservé, confirmation fermeture | Garde Escape/Annuler, conservations 400/409/503 et exception réseau | Test réel d'annulation, accès mobile, réseau interrompu |
| AC5 — Retour et mise en évidence | Chargement de liste non réinitialisé, bandeau Voir/Autre/Retour, highlight basé sur ID réelle | Vérifier différents filtres/pages, lien réunion/Sprint `returnTo` fourni et navigation arrière |

## Compatibilité / frontières

- Le composant historique `RegistryCreate` demeure dans le dépôt pour les autres points d'entrée qui l'utilisent explicitement ; seule l'URL globale `/app/admin/registries/create` est redirigée vers la nouvelle modale. Aucun code de fiche Sprint n'est modifié.
- `returnTo` ne reconstruit pas les contextes manquants. Il doit être fourni par les prochains liens provenant de la fiche Sprint/réunion ; l'historique du navigateur reste fonctionnel autrement. La Story SMN-252 enrichira la navigation.
- Les associations d'action/objectif et les créations depuis journal relèvent de SMN-249 et SMN-250 ; aucune opération partielle n'est annoncée comme atomique.
- Les détails de création sont audités individuellement dans les tables existantes via `ensure...`, toujours **dans la même transaction PostgreSQL**. Pas de nouvelle migration ou de relecture des snapshots de cycles clos.
- Les filtres peuvent masquer la nouvelle fiche ; la confirmation permet toujours d'ouvrir son URL sans fausse affirmation sur sa visibilité.

## Vérifications réellement effectuées

- Jira SMN-246, contrat UX, composants et API GitHub consultés.
- **26/26 contrôles statiques ciblés positifs** sur la structure des sources et parité FR/EN ; une erreur d'import du type ROAM a été corrigée pendant cette revue. Ce ne sont **pas** des tests d'exécution.
- **19 tests `node:test` écrits, non exécutés** : `tests/smn-246-registry-modal.test.ts`. Cas zéro détail, six types, entrées métier invalides, source/retour, cycle, rollback et audit atomiques, première fiche sans table préalable, décisions remplacées.
- **NON exécutés** : `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` ; PostgreSQL/test runtime, navigateur, accessibilité, zoom 200 %, thèmes et rôles admin/user.
- L'activation officielle BMAD `bmad-build` par `uv run .../render_skill.py` nécessite un checkout local et `uv` non disponibles dans cet environnement ; workflow adapté manuellement aux connecteurs GitHub/Jira, aucune commande BMAD n'est déclarée exécutée.

### Tests à lancer sur le PC Windows 11

```powershell
pnpm exec tsx --test tests/smn-89-registry-creation.test.ts tests/smn-90-registry-list.test.ts tests/smn-243-registry-detail.test.ts tests/smn-244-registry-summary.test.ts tests/smn-245-registry-section-editors.test.ts tests/smn-246-registry-modal.test.ts
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Recette complémentaire : nouvelle installation, chaque type, dates Europe/Paris, erreurs 400/409/503, validation du lien source / autre équipe, cycle clôturé, sélection décision par titre, fermeture avec brouillon, relance de création, succès et URL directe depuis réunion/Sprint, focus retour, thème clair/sombre et largeurs 320/375/768/1024/1440.

**DoD non atteinte avant tests et corrections ; ne pas fusionner dans main sur seuls contrôles statiques.**
