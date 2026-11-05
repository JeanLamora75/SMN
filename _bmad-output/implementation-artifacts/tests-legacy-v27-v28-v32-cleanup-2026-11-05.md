# Nettoyage contrôlé des tests de migration v27/v28/v32 — 5 novembre 2026

## Contexte
SMN utilise une baseline native v33 autonome. L'unique installation de développement existante doit rester lisible ; les migrations anciennes ne doivent pas supprimer les preuves d'intégrité, de restauration et de rollback. Aucun accès ni écriture sur la base locale n'a été effectué.

## Tests remplacés
- `tests/auth-schema-v27.test.ts` supprimé : anciens parcours d'authentification 1–30, contrôle des 7 colonnes de v27 et condition spécifique de v28. Remplacé par `tests/auth-schema-v33-security.test.ts` qui teste les refus de schémas futurs/invalides, les capacités actuelles et les colonnes de sécurité de la baseline v33.
- `tests/smn-282-schema-v28.test.ts` supprimé : ancien checksum de migration v28, ordre d'application manuelle, vérification de la version 28. Remplacé par `tests/team-schema-v33-isolation.test.ts` qui vérifie les contraintes de cohérence des équipes/produits, les identifiants d'installation, les index et Prisma.
- `tests/schema-v32-audit-baseline.test.ts` supprimé : ancien audit du passage 31→32 et d'un script de schéma différé. Remplacé par `tests/schema-v33-no-runtime-ddl.test.ts`, qui exige la présence des tables de rapports et registres dans la baseline v33 et interdit leur création implicite dans les services métier.
- `tests/db-upgrade-v32-compatibility.test.ts` ajusté : retrait des boucles purement historiques v27–v30 et de l'analyse du SQL DDL 31→32. Conservation des protections de migration, version, historique, checksum, doublons, statuts dangereux et idempotence v33 et du chemin de récupération v32 encore reconnu.

## CI / Documentation
- `.github/workflows/verify-i0.yml` : le job de validation indépendant remplace le fichier de tests v27 par les deux nouveaux tests v33.
- `tests/coverage/historical-contracts.json` : retrait des deux fichiers supprimés, sans modifier la liste des protections historiques à conserver.
- Les tests `smn-338-real-v32-restore.test.ts`, `smn-351-v32-history-upgrade-pg.test.ts`, `native-v32-history.test.ts` et les tests d'isolation multiéquipes n'ont pas été supprimés.

## Critères de validation
- Tous les tests Windows et Linux/PostgreSQL doivent réussir dans I0 sur le même SHA.
- Vérifier notamment les nouveaux tests d'authentification, de contraintes multiéquipes, de garde DDL et l'intégrité de l'historique.
- Les validations de migration PostgreSQL se déroulent exclusivement sur des bases de test isolées.

Une CI verte valide les tests présents, et non l'absence de toute régression en dehors des parcours couverts.

[GitHub Actions](https://github.com/JeanLamora75/SMN/actions?query=branch%3Amain)
