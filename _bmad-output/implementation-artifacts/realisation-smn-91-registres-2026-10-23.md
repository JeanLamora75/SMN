# SMN-91 — Modification historisée des registres (23/10/2026)

Story : https://lmn24.atlassian.net/browse/SMN-91

## Code publié sur main

- Service `updateRegistryItem` existant consolidé : verrouillage `FOR UPDATE`, contrôle d'équipe/type et révision optimiste ; mise à jour + audit avant/après dans une transaction avec rollback sur erreur. `id` et `created_at` ne sont pas réécrits.
- Les anciennes valeurs sont maintenant normalisées au même modèle que les nouvelles (champ `occurredOn`, `owner`, `dueOn`, etc.).
- API `GET /api/admin/registries/[id]/history` réservée à l'administrateur, lecture SELECT-only, historique complet trié par révision.
- Fiche `/app/admin/registries/[id]` : détails de l'historique sous forme de révisions extensibles, date/auteur, comparaison champ par champ. Édition admin ; rôle user lecture collective uniquement.
- Avertissement de brouillon visible et garde `beforeunload` pour le rechargement, la fermeture et la sortie complète de page, mais pas encore garantie de capture de toutes navigations internes Next.js.
- I18n FR/EN centralisée.
- Tests ciblés ajoutés dans `tests/smn-91-registry-history.test.ts` : validation atomique, conflit 409, échec audit et absence d'écriture par lecteur.

## Limites

- AC4 : les snapshots de clôture Vn sont indépendants du registre courant ; le code de modification des registres ne les modifie pas. L'intégration effective des six registres aux snapshots dépend toujours de SMN-111/112 ; conservation de PDF antérieurs à confirmer en recette.
- AC2 : protection `beforeunload` présente ; interception des navigations internes SPA non établie : ne pas déclarer critère complètement satisfait.
- Aucun test d'intégration PostgreSQL, vérification typecheck/build, test navigateur ou pipeline GitHub Actions exécuté dans le projet.
- Les tests sont publiés mais non exécutés. Jira reste À faire et aucune recette complète n'est revendiquée.

## Recette locale Windows

```powershell
git pull
pnpm typecheck
pnpm exec tsx --test tests/smn-89-registry-creation.test.ts tests/smn-90-registry-list.test.ts tests/smn-91-registry-history.test.ts
pnpm i18n:check
pnpm build
pnpm dev
```

Vérifier les six registres, les révisions successives, les accès admin/user, la conservation de `created_at` et la protection des snapshots.
