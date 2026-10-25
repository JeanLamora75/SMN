# Consolidation 08 — Migration et robustesse des archives Studio

## Modifications
- Nouvelle migration `prisma/migrations/20261025_smn_reports_archive_snapshots/migration.sql` : création idempotente de la table des PDF existante si absente, colonne/index d'idempotence et table des snapshots Studio avec unicité document/version.
- Trigger PostgreSQL d'immuabilité installé de façon conditionnelle par migration et fonction PL/pgSQL correctement délimitée.
- Le stockage opérationnel `pdf-archive-store.ts` ne crée plus tables, index, fonctions ou triggers à chaque archivage.
- Le stockage privé, la vérification SHA-256, l'allocation Vn sérialisée et les transactions existantes sont conservés.
- Les archives antérieures restent accessibles sans obligation de snapshot Studio.

## Déploiement
Exécuter les migrations via le mécanisme prévu par le projet **avant** d'activer les nouveaux endpoints d'archivage. Si la migration n'est pas appliquée, l'écriture échoue et le PDF temporaire est supprimé dans le traitement d'erreur ordinaire. Une interruption brutale peut laisser un fichier orphelin.

## Recette à faire
1. Base vierge puis migration ; base historique avec archives existantes puis migration.
2. Double exécution contrôlée de la migration, comparaison des contraintes.
3. Deux archives concurrentes du même document -> Vn distincts ; documents différents indépendants.
4. UPDATE/DELETE de snapshot -> rejet PostgreSQL.
5. Échec SQL après écriture PDF -> rollback, fichier supprimé ; redémarrage brutal -> identifier/réconcilier orphelins.
6. Lecture PDF anciens/nouveaux, contrôle des droits admin/user, altération du SHA-256.
7. Typecheck, build, tests et PDF réels.

**Aucun de ces contrôles n'a été exécuté.** Pas de fusion main ni transition Jira. La récupération automatique après crash et le rendu avancé des PDF ne sont pas encore développés.
