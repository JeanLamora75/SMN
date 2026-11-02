# SMN — Rapprochement I0 Windows / Linux (2 novembre 2026)

## Référence comparable

Même commit `12dfe074`, même workflow Vérification I0 `41420961591` :
- Linux job `125196113355` : 2555 tests, 2465 réussis, **88 échecs**, 2 ignorés.
- Windows job `125196113950` : 2544 tests, 2437 réussis, **99 échecs**, 8 ignorés.
- Les **105 échecs Windows** constatés au commit précédent ne doivent pas être utilisés comme écart courant. Windows a gagné 6 tests depuis cette mesure.

## Classification / causes

1. **Échecs transverses Linux + Windows** : anciens contrats v32 ou composants métier modifiés (Dashboard et Sprint, Registres, absences et capacités, rapports et liens, accès). Ces échecs ne sont pas des particularités Windows. Les fichiers sources et les assertions doivent être comparés au contrat v33 avant toute modification.
2. **Écart Windows (11 échecs supplémentaires sur le même commit)** : principalement tests d'intégration PostgreSQL lancés par `pnpm test` sans base de service Windows. Ces mêmes tests peuvent aussi échouer sur Linux I0 car la CI fournit `/smn_ci` tandis que certains gardes d'intégration exigent `/smn`. Cela traduit un **contrat d'environnement non satisfait**, pas une preuve d'échec métier. Ne pas supprimer ces tests ni leurs protections de base de données.
3. **Chargement CSS directement dans le runner Node** : `tests/smn-361-dashboard-consultation.test.ts` importait un composant Next/React important `dashboard-dimensions.module.css`. Correction : extraction `visibleSlots` et `gridColumns` dans `src/lib/dashboard-builder/consultation-layout.ts`, réexportation dans le composant, et import des fonctions pures par le test. Pas de modification fonctionnelle attendue.
4. **Absences** : le simulateur SQL historique ne gérait pas la consultation de version v33, et un correctif de mock a été publié ; ce défaut était également commun aux deux OS.

## Politique de résolution et validation

- Garder le **même inventaire de tests fonctionnels** sur les deux OS.
- Créer à terme des recettes PG explicites sur environnement disposant d'une base jetable autorisée, avec garde d'URI, création/effacement isolé et tests de restauration ; la CI Windows sans serveur PostgreSQL ne doit pas être présentée comme une recette PG.
- Conserver les échecs non expliqués au lieu de transformer des assertions en succès artificiels.
- Rejouer I0 sous Linux et Windows après chaque changement, vérifier `pnpm typecheck` et `pnpm lint`. Une exécution non terminée ne prouve pas la correction.

## État

**Diagnostic et première correction publiés ; pas encore de validation I0 verte.** La réconciliation exhaustive de chaque échec et la preuve de correction ne sont pas achevées.
