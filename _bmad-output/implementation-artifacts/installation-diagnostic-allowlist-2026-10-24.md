# Diagnostic PostgreSQL SMN — Relations créées à l'usage (24/10/2026)

## Incident et constat vérifié

Sur Windows 11, `pnpm db:diagnose` a retourné :

- `Diagnostic: schema-incompatible` ;
- `Objet inconnu: public.smn_automatic_highlight:r` ;
- `Version enregistrée: 27`, `État de l'installation: initialized` ;
- `Migrations enregistrées: 27`, `Migrations terminées: 27`.

**Cause :** `recordConfirmedHighlight` dans `src/server/registries/confirmed-highlights.ts` crée la table `public.smn_automatic_highlight` lorsqu'un fait marquant automatique est réellement enregistré. La table était absente de `INSTALLATION_RELATIONS` dans `src/server/installation/contract.ts`. L'interdiction stricte des objets inconnus dans `src/server/installation/diagnostic.ts` bloque donc le diagnostic avant de lire le marqueur d'installation. Le lancement Next.js sur 3003 peut réussir malgré l'impossibilité d'authentifier l'installation.

## Correctif

- Ajout de `public.smn_automatic_highlight:r` à l'inventaire explicite des relations autorisées.
- Examen du DDL dans les modules applicatifs Registres, Rapports et Sprints : **27 autres tables** créées légitimement sur demande sont ajoutées individuellement à la même liste, soit **28 ajouts**.
- Le contrôle demeure **strict** : ni nouvelle règle `smn_*` ni désactivation de `schema-incompatible`. Les tables tierces restent refusées.
- Nouveau test `tests/installation-relations-inventory.test.ts` : inventaire récursif des `CREATE TABLE public.smn_...` dans `src/server/` et `src/app/api/`, comparaison au contrat, test de la table de faits marquants et du rejet d'une relation étrangère.
- Aucun changement SQL, de migration, de version de schéma ou de données de l'utilisateur.

## Recette Windows — vérifications indispensables

```powershell
git pull
pnpm exec tsx --test tests/installation-relations-inventory.test.ts tests/installation-diagnostic.test.ts
pnpm typecheck
pnpm db:diagnose
pnpm build
```

Attendu : plus aucun objet inconnu ; `Diagnostic: initialized` si les autres contrôles de schéma passent ; écran de connexion accessible après redémarrage `pnpm dev`.

**Ne pas** supprimer/recréer la base et ne pas réinitialiser le cluster PostgreSQL portable. L'avertissement `baseline-browser-mapping` n'est pas la cause du blocage.

## Prévention et dette d'architecture

Le schéma SMN est aujourd'hui hybride : 27 migrations validées et plusieurs tables de sous-modules créées lors du premier usage. Le test d'inventaire réduit le risque d'oubli, mais l'évolution recommandée est une politique centralisée et versionnée des objets SQL créés dynamiquement, sans assouplir le rejet des tables étrangères. Toute nouvelle table doit être intégrée au contrat et au test avant livraison.

## État et limites

Les chemins de DDL, les entrées de liste blanche et les assertions statiques ont été vérifiés à distance via GitHub. `pnpm typecheck`, `pnpm build`, tests TSX et diagnostic sur la base réelle **ne sont pas exécutés** dans l'environnement connecté à GitHub ; GitHub Actions est désactivé.
