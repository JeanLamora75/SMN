# SMN-428 — Sécuriser la sauvegarde et la récupération lors d’une mise à jour

**Epic :** SMN-424 · **Agent :** Amelia · **Date :** 10 novembre 2026

## Implémentation sur main (premier durcissement)

- `src/app/api/admin/updates/confirm/route.ts` : confirmation interdite sans sauvegarde complète (manifest v4, `scopeComplete`), vérifiée sur disque par `backupInventory`, comportant PostgreSQL, et âgée d’au plus 24 heures. Un simple marqueur de succès ou un cache de vérification n’est pas accepté.
- `scripts/windows/update-transaction.mjs` : journal du cutover écrit atomiquement **avant le premier déplacement**, avec identifiant de mise à jour, version, présence initiale et présence candidate de chaque composant. Une interruption laisse un état `applying`.
- `scripts/windows/update-apply.mjs` : confirmation associée à un identifiant de sauvegarde ; préparation et contrôle des empreintes avant début du journal ; passage `committed` après activation ; rollback `recovered` en cas d'exception gérée.
- `scripts/windows/launch-portable.mjs` : avant d’ouvrir le navigateur ou le serveur HTTP, récupération de l’ancien jeu de composants si le journal indique un échange interrompu. La récupération est refusée en cas de collision ou d’élément original introuvable ; **ne pas démarrer une installation dont l’état n’est pas sûr**.
- `scripts/windows/package-portable.mjs` : module de récupération inclus dans les distributions Windows.
- `src/app/app/admin/settings/maintenance/updates-admin.tsx`, `src/i18n/fr.json`, `src/i18n/en.json` : prérequis de sauvegarde et erreur explicite dans les deux langues.
- `tests/update-import.test.mjs` : scénarios de récupération et de journal corrompu, ainsi que conservation des données, ajoutés aux contrats CI Windows existants.

## Invariants conservés

- Aucune commande de migration ou d’arrêt PostgreSQL dans l'updater.
- `data/`, `runtime/` et `updates/` ne figurent jamais dans l’inventaire de remplacement.
- Journal et statut de maintenance ne contiennent ni contenu personnel, ni clé, ni mot de passe, ni texte de l'erreur arbitraire.
- Vérification répétée de la signature et des empreintes ZIP avant préparation.

## Restrictions et qualification encore nécessaires

1. **Compatibilité de schéma** : aucune migration automatique n'est introduite. La coordination des évolutions de schéma et la restauration en cas d’incompatibilité restent liées à SMN-429. Ne pas proposer un retour arrière applicatif après migration non réversible.
2. **Recette Windows réelle** : tests d'interruption du processus en chaque phase, panne électrique simulée, saturation disque, restrictions ACL/antivirus, et restauration complète en environnement jetable avec PostgreSQL 18. Ces validations ne doivent pas être prétendues réussies sans preuves.
3. **Chaîne de démarrage historique** : une installation antérieure à l’introduction du journal n'a pas de récupération automatique en cas de panne pendant son **premier** cutover. Une nouvelle distribution de référence intégrant le lanceur renforcé est nécessaire pour bénéficier pleinement du dispositif.
4. **Preuve de restauration** : la vérification cryptographique d’une sauvegarde ne prouve pas encore une restauration réellement exécutée. La reprise cohérente de données après une migration de schéma reste une procédure distincte.
5. **Verrouillage des opérations métier** : confirmer que les opérations longues de sauvegarde/restauration et les requêtes en vol ne sont pas interrompues pendant l'arrêt du serveur web.
6. **État final** : la Story ne doit être clôturée qu'après retour vert de la CI et recette Windows documentée.

## Contrôle

La CI `.github/workflows/update-package.yml` exécute sur Windows :
`node --test tests/distribution-layout.test.mjs tests/update-package.test.mjs tests/update-import.test.mjs`.

La CI `.github/workflows/portable-package.yml` vérifie le packaging. Les résultats doivent être consultés sur GitHub Actions, sans confondre « déclenché » et « réussi ».

## Validation complémentaire du 10/11/2026

- **Contrat Windows confirmé** : [run 42788530953](https://github.com/JeanLamora75/SMN/actions/runs/42788530953), job `update-contract-tests` `success` (**21 tests réussis**), puis job `update-build-smoke` `success`. Cela couvre un import signé, le refus des archives hostiles, une bascule Windows jetable, la conservation d'un fichier témoin PostgreSQL et un scénario d'interruption.
- **Packaging Windows antérieur confirmé** : [run 42788487811](https://github.com/JeanLamora75/SMN/actions/runs/42788487811), job `portable-windows` `success`.
- **Correctif CI** : une régression ESLint `react-hooks/set-state-in-effect` dans `updates-admin.tsx` bloquait les validations générales. Corrigée dans [commit 0399d06](https://github.com/JeanLamora75/SMN/commit/0399d06fdf8b0ceb90f63dfecba35d1957e55cef) ; le job TypeScript/lint correspondant est `success` ([run 42789990186](https://github.com/JeanLamora75/SMN/actions/runs/42789990186)).
- **Nouveaux tests ajoutés après ces runs** : `tests/update-recovery-matrix.test.mjs` couvre 14 points d'interruption au niveau des sept composants, `tests/update-backup-policy.test.mjs` contrôle les archives récentes, complètes et vérifiées. **Les tests supplémentaires doivent être validés sur le nouveau run CI ; ne pas extrapoler les anciens succès.**
- **Points non qualifiés** : restauration PostgreSQL 18 réelle à partir du paquet sauvegardé, injection de panne disque/ACL sur Windows 11, recette sur un PC d'entreprise et gestion d'une migration de schéma incompatible. Le journal applicatif conserve les fichiers, mais n'offre pas une preuve de restauration métier complète.

**Verdict** : qualification des contrats de mise à jour *partiellement réussie* ; AC1/AC4/AC5 nécessitent encore les essais de récupération et restauration réels. Ne pas fermer la Story avant les preuves complémentaires.
