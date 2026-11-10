# ADR — SMN-425 — Préserver les données pendant les mises à jour Windows

**Date :** 10 novembre 2026. **Epic :** SMN-424. **Story :** SMN-425.
**Statut :** contrat de protection initial implémenté, migration physique de l'arborescence applicative non engagée.

## Constat GitHub `main`

Le paquet Windows actuel contient un serveur Next standalone à sa racine, `node.exe`, le runtime de distribution PostgreSQL sous `runtime/postgres/` et les données PostgreSQL créées sous `data/postgres/` pour les nouvelles installations (manifest v2). Les installations héritées (manifest v1) restent sous `%LOCALAPPDATA%/ScrumMasterNotebook`. Les secrets et configurations privées restent dans le profil Windows. Les documents Office sont conservés sous `data/office/` par défaut, ou dans les répertoires absolus configurés.

Cela signifie que le dossier SMN contient aujourd'hui **des fichiers applicatifs et des données persistantes** ; remplacer intégralement le dossier est dangereux. Une mise à jour ne doit jamais utiliser un `rm -rf`, `Copy-Item -Force -Recurse` global ou une extraction ZIP en écrasement à la racine.

## Décisions et invariants

1. **Aucun déplacement automatique** d'un cluster existant. Les versions de manifeste v1 et v2 continuent d'être reconnues. Une future migration v3 exige inventaire, arrêt propre, sauvegarde cohérente vérifiée et accord explicite, sous peine de refus sécurisé.
2. **Données persistantes non remplaçables** : `data/` (PostgreSQL, archives, modèles Office, rapports), `runtime/` (moteurs installés), `updates/` (staging, historiques), et les secrets `.settings-key`, `.env.local`, `runtime.json`, `postgres-connection.json`. Le profil `%LOCALAPPDATA%/ScrumMasterNotebook` ne peut pas être ciblé par une mise à jour.
3. **Contrat de contenu des futurs ZIP applicatifs** : chemins relatifs propres, sans traversée `../`, sans chemins Windows absolus, sans antislash, sans écriture vers ces emplacements. Le code `scripts/windows/distribution-layout.mjs` fournit une validation indépendante du prochain installateur.
4. **Les paquets initiaux complets sont distincts des mises à jour** : ils contiennent intentionnellement une archive de runtime PostgreSQL signée par empreinte ; cette exception ne doit jamais servir à écraser un runtime en place. L'interdiction de remplacement est appliquée aux paquets de mise à jour (US-02/03).
5. **Tests et preuve** : `tests/distribution-layout.test.mjs` est exécuté dans le workflow Windows avant l'assemblage. La récupération administrateur reconnaît v1 et v2 sans réécriture de cluster.
6. **Arborescence cible** (US-01, étape suivante si nécessaire) : `SMN/app/` versionné/remplaçable, `SMN/runtime/` stable, `SMN/data/` persistant, `SMN/updates/` staging ; activation atomique par le lanceur externe (US-03). La migration du dossier du serveur ne doit être autorisée qu'après tests de tous les chemins de données et ressources (notamment Next standalone, imports et schémas SQL).

## Impacts et contrôles de compatibilité

- `src/server/bootstrap/managed-paths.ts` : chemin v2 relatif au répertoire courant stable du launcher ; ne pas changer le `cwd` sans en adapter et tester tous les consommateurs.
- `src/server/bootstrap/portable.ts` : manifest v1/v2, archive vérifiée, récupération des tentatives interrompues, aucun déplacement automatique.
- `scripts/recover-admin.mjs` : accepter strictement v1 et v2 ; aucun chemin arbitraire fourni par le manifest.
- `scripts/office-dirs.mjs` : `data/office/` préservé, sauf override configuré.
- `scripts/windows/package-portable.mjs` : distribution initiale ; ne pas utiliser comme mécanisme de mise à jour incrémentale.
- `scripts/windows/verify-package.mjs` : tests d'installation initiale et nettoyage du cluster jetable de CI.
- Sauvegardes, rapports Word/PPT, archives et indicateurs v33 : aucun fichier modifié par cette Story sans preuve de compatibilité.

## Critères ouverts

- La **séparation physique complète de `app/`** n'est pas encore mise en œuvre. Ne pas déclarer AC1, AC2, AC4 et AC6 intégralement satisfaits tant qu'un remplacement applicatif a été testé sur une installation persistante.
- Une procédure de migration v2 → arborescence cible doit être isolée des opérations d'initialisation et nécessiter une recette sur Windows et une récupération vérifiée.
- La signature des mises à jour et leur application sont du ressort des US-02/03 ; aucun ZIP externe n'est exécuté au titre de cette Story.
