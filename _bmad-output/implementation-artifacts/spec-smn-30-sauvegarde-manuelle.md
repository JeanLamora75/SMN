# SMN-30 — BMAD Story 2.2 : Sauvegarde manuelle complète

**Normatif :** [SMN-30](https://lmn24.atlassian.net/browse/SMN-30), FR-68/71/73, AD-25/26/27/31, SEC-03/06, [ADR-I0-003](../planning-artifacts/architecture/architecture-SMN-2026-10-19/ADR-I0-003-RECUPERATION-CLES.md).

## Arbitrages conservés

- Le MVP utilise PostgreSQL 18, sans Docker, sur ordinateur Windows personnel.
- Deux rôles seulement ; **Administrateur** peut lancer et consulter l'état des sauvegardes.
- Pas de simulation de PDF/brief ou d'instantané Vn non encore stocké.
- Une sauvegarde est un paquet **chiffré** avec dump complet et pièces présentes, pas une attestation de restauration testée.
- Au premier usage, phrase de récupération distincte du mot de passe admin ; copie chiffrée de la clé dans chaque index exportable ; usage ultérieur de la clé locale sans phrase.
- Pas de téléchargement anonyme ni de chemin arbitraire fourni par le navigateur.

## Implémentation des critères

- **AC1** : outil `pg_dump` 18, option custom, flux chiffré ; base complète à un snapshot PostgreSQL sans retrait arbitraire des comptes, historiques ni données.
- **AC2** : `scanDocuments` inventorie manifests et PDF/TXT existants ; absent => vide, inconnu, cassé ou incohérent => échec.
- **AC3** : `pg_try_advisory_lock(20261021,30)` pour une capture à la fois ; inventaire avant/après, empreintes SHA256, répertoire de staging et renommage atomique à la fin. Les futurs producteurs de fichiers doivent honorer ce verrou.
- **AC4** : AES-256-GCM pour DB, documents, manifeste ; clé de récupération enveloppée via scrypt, aucun mot de passe/secret en clair dans index ou arguments du sous-processus.
- **AC5** : erreur retournée avec `status=failed`, état minimal conservé, suppression du staging ; une sauvegarde réussie ne peut pas être annoncée avant publication complète.

## Contrôles et réserves

Le schéma PostgreSQL v7 créé par SMN-29 est conservé ; aucune migration complémentaire requise. Journal de statut local `last-attempt.json` ; pas de création artificielle d'un événement `smn_account_audit` pour les backups.

Tests sources et chiffrement dans `tests/manual-backup.test.ts` ; refus HTTP et capture positive si binaire `pg_dump` 18 disponible dans `scripts/verify-http-ci.mjs`. Les tests réels ne sont **pas exécutés ici** et la restauration sur une autre machine reste à tester dans la Story dédiée. Ne pas clôturer Jira avant cette qualification.

[Documentation et plan de recette](../../docs/SAUVEGARDE-MANUELLE-SMN-30.md).

## Publication du code

La [PR #25](https://github.com/JeanLamora75/SMN/pull/25) est fusionnée sur `main` depuis le 21/10/2026 (`b189ebe75ba60d40c291bd56876bc77026bd2a70`). Les jobs GitHub Actions échouent avant leur démarrage : **aucune exécution de tests ni de restauration n'est confirmée**. Le comportement de sauvegarde réelle, de protection locale de la clé Windows et de récupération sur PC distinct reste soumis à recette. Jira En cours.
