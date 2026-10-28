# SMN-316 — Préparation de la migration Entreprises v31

## Périmètre
La migration remplace le rattachement des fermetures à une équipe par un rattachement à une entreprise, ajoute le catalogue `smn_company` et le champ `smn_member.company_id` facultatif.

**Ne pas appliquer la migration sur l'application en cours tant que les parcours de fermeture historiques n'ont pas été remplacés dans SMN-319.** Le service `src/server/closures/service.ts` et certaines projections utilisent encore `team_id` ; ces routes ne fonctionneront plus après passage à v31 sans adaptation. SMN-316 fournit la fondation SQL, pas le déploiement applicatif complet.

## Préconditions impératives
- Sauvegarde PostgreSQL disponible.
- Installation `initialized` en version 30 avec exactement 30 migrations Prisma terminées.
- `smn_company_closure` **et** `smn_company_closure_history` vides.
- Aucune vue dépendante de `smn_company_closure.team_id`.
- Exécution sur une version du code incluant les adaptations applicatives correspondantes.

Le script utilise une transaction et refuse les écarts ; il n'efface aucun historique. La suppression de colonne SQL refuse les autres dépendances non résolues par défaut (sans CASCADE).

## Contrôles locaux sur la branche
```powershell
pnpm exec tsx --test tests/company-schema-migration.test.ts
pnpm exec tsc --noEmit
pnpm db:diagnose
```

**N'exécuter la commande d'application qu'au moment du déploiement coordonné avec les adaptations des services et après sauvegarde :**
```powershell
pnpm exec tsx scripts/apply-company-schema-migration.ts --apply
pnpm db:diagnose
```
Le diagnostic attendu après migration est `initialized`, version 31, migrations enregistrées/terminées 31 et 0 objet inconnu. Un échec ne doit jamais être contourné par suppression manuelle de tables.

## Points de recette avant fusion de l'ensemble du module
- Vérifier absence d'anciennes fermetures et historique.
- Vérifier index/contraintes entreprise et références membres.
- Vérifier diagnostic v31 et somme de contrôle Prisma.
- Vérifier les API de fermeture et la capacité après adaptation SMN-319/SMN-320.
- Vérifier la non-régression des autres équipes.

Aucun test ni commande SQL sur le PC utilisateur n'a été exécuté dans ChatGPT.
