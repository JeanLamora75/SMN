# SMN-478 — Collecte automatique des douze preuves (19 novembre 2026)

**Responsables :** Amelia (développement et CI) et Winston (architecture/contrat de preuve).  
**Dépôt :** [SMN GitHub](https://github.com/JeanLamora75/SMN) ; [Jira SMN-478](https://lmn24.atlassian.net/browse/SMN-478).  
**État :** collecteur et dix scénarios raccordés ; reçu final **non constitué** ; distribution **non autorisée**. Aucun script uv exécuté.

## Fonctionnement

- `scripts/windows/collect-smn478-evidence.mjs run <check> -- <executable> [arguments]` lance réellement une commande sur le runner jetable et écrit son journal et un état distinct.
- Le journal enregistre l'identifiant du run GitHub, le SHA du commit, la commande et le code de sortie réel. Son empreinte SHA-256 est recalculée à la fin.
- La réussite d'un contrôle signifie **code de sortie 0 d'une recette explicite**, jamais un statut CI reconstruit a posteriori. Une commande en échec reste marquée `failed`, sans nouvelle tentative silencieuse.
- `finalize` exige exactement les douze enregistrements du **même run et du même commit**. Les fichiers modifiés, manquants ou en échec bloquent le reçu.
- Le reçu utilise des chemins de journal relatifs, contrôlés par `smn-478-qualification-gate.mjs`, afin qu'il puisse être vérifié avec ses journaux après téléchargement.
- Un artefact GitHub distinct de la distribution conservera le reçu, ses états et ses journaux pendant 30 jours **uniquement si la qualification réussit**.
- `create-delivery-evidence.mjs` continue d'exiger `SMN478_QUALIFICATION_RECEIPT` avant de signer les métadonnées du ZIP. La sécurité n'est pas désactivée.
- La qualification complète ne s'exécute que lors d'un déclenchement manuel du workflow ou d'un commit de release explicite `[smn-release]`. Les pushs ordinaires conservent leurs tests Windows existants.

## Matrice des douze contrôles

| Nom du contrat | Recette reliée au collecteur | État |
| --- | --- | --- |
| unit | Suite unitaire commune via `run-ci-unit-tests.mjs --run` | Reliée, à qualifier en release |
| typecheck | `npm run typecheck` | Reliée |
| lint | `npm run lint` | Reliée |
| build | `npm run build`, mode standalone | Reliée |
| browser | `smn-478-brief-browser.e2e.ts`, Chrome/Edge et cookie CI éphémère, sprint réel synthétique | Reliée, exécution release à confirmer |
| postgresEmpty | `smn-478-native-fresh-install-pg.test.ts` sur cluster portable jetable | Reliée, exécution release à confirmer |
| postgresHistory | `smn-478-brief-migrations-pg.test.ts` sur base jetable | Reliée, exécution release à confirmer |
| postgresRollback | Seconde exécution autonome des assertions de migration historique et rollback PostgreSQL | Reliée, exécution release à confirmer |
| windowsFresh | `verify-package.mjs` sur distribution neuve | Reliée |
| windowsUpgrade | Mise à jour effective d'une ancienne distribution Windows avec historique | **Bloquante : ancienne distribution qualifiée nécessaire** |
| zipFreshRestore | `smn-442-acceptance.mjs` : destination vierge, ZIP réel et réauthentification | Reliée |
| zipUpgradeRestore | Export/import ZIP d'une installation Windows effectivement mise à jour | **Bloquante : ancien paquet qualifié nécessaire** |

**Important :** les dix scénarios « reliés » ne sont **pas déclarés réussis** tant qu'un run de qualification complète n'en a pas produit les journaux. Les deux scénarios d'upgrade restent obligatoires, ne sont pas émulés à partir d'une installation neuve, et empêchent `finalize` de délivrer un faux reçu.

## Prérequis pour fermer les deux derniers scénarios

1. Mettre à disposition d'un runner isolé une **distribution Windows antérieure vérifiée**, avec une empreinte SHA-256 attestée et un schéma/jeu d'archives historiques de test (aucune donnée utilisateur).
2. L'installer sur une destination jetable, la mettre à jour vers le paquet cible, contrôler modèle, révisions, prompt et archives avant/après : journal `windowsUpgrade`.
3. Exporter cette installation mise à jour en ZIP, restaurer dans une autre destination jetable, comparer les mêmes données et contrôler la réauthentification/rollback : journal `zipUpgradeRestore`.
4. Exécuter ces deux scénarios par `captureCheck`, jamais par une commande factice, puis finaliser le reçu et lancer la distribution sur **le même commit**.

## Règles de confidentialité et provenance

Les mots de passe, cookies de connexion et clés de signature ne doivent pas être passés comme arguments de commande ni consignés dans le reçu. Les fixtures PostgreSQL et les comptes navigateur sont synthétiques, isolés et supprimés à la fin. Les logs peuvent contenir des chemins temporaires et le nom des scénarios : leur publication nécessite de vérifier qu'ils ne contiennent aucun secret.

Le SHA-256 prouve l'intégrité du fichier de journal tel que capturé. Il ne prouve pas, à lui seul, l'authenticité du scénario : le workflow et les tests d'acceptation restent la source de confiance. Ne jamais confondre exécution d'un test du collecteur et preuve d'une migration réelle.

## Vérification

- Tests du collecteur : `node --test tests/smn-478-evidence-collector.test.mjs tests/smn-478-delivery-gate.test.mjs`.
- Workflow : [Paquet Windows pilote](https://github.com/JeanLamora75/SMN/actions/workflows/portable-package.yml).
- Source du verrou : [smn-478-qualification-gate.mjs](https://github.com/JeanLamora75/SMN/blob/main/scripts/windows/smn-478-qualification-gate.mjs).

La règle de livraison reste **fail-closed** : aucun reçu complet signifie aucun ZIP SMN-478 qualifié.
