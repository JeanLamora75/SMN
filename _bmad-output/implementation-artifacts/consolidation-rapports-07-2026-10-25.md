# Consolidation 07 — Sécurité et intégrité des archives

## Modifications enregistrées
- Pour les nouveaux snapshots du Studio, ajout d'un trigger PostgreSQL qui refuse UPDATE et DELETE au niveau de la table `smn_report_studio_archive_snapshot`.
- Installation conditionnelle du trigger, sans suppression/recréation à chaque archivage.
- Lors du téléchargement, si le manifeste porte `studioArchiveVersion`, vérification de l'existence du snapshot JSON lié, de la concordance de l'identifiant document, de la révision, du numéro Vn et de son SHA-256 recalculé.
- Le téléchargement conserve la vérification existante du SHA-256 et de la longueur du PDF.
- Les anciennes archives sans numéro Vn continuent à relever du mécanisme historique et ne requièrent pas de snapshot Studio.
- Les routes d'export restent réservées à un compte ayant l'autorisation d'écriture ; la route de téléchargement continue de respecter les droits existants et les autorisations d'archives.

## Validation non exécutée
- Aucun test sur PostgreSQL réel du trigger, des transactions, du cas de concurrence, de l'intégrité ou de la migration depuis des archives historiques.
- Aucun test de droits admin/lecture seule, build, typecheck, génération PDF ni recette navigateur exécutés.
- La fonction et le trigger installés dans l'opération métier devraient être convertis en migration PostgreSQL versionnée avant fusion.
- Un administrateur de base ou un propriétaire SQL disposant des privilèges nécessaires peut modifier/supprimer le trigger ; ce n'est pas une immutabilité cryptographique ni externe.
- La récupération après crash système entre écriture disque et validation SQL reste à concevoir.
- Le moteur PDF avancé reste incomplet et bloque les blocs visuels non rendus fidèlement.

## Statut
Correctifs proposés en PR brouillon ; aucune fusion sur main ni changement de statut Jira.
