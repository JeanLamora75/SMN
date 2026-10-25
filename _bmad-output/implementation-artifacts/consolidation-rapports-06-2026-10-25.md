# Consolidation 06 — Snapshots persistants et versions d'archives

## Implémentation
- Pour chaque nouvel archivage PDF issu du Studio, conservation du JSON complet `ReportDocument` dans `public.smn_report_studio_archive_snapshot` lié à l'identifiant d'archive PDF.
- Numérotation V1, V2... par document, calculée dans la transaction PostgreSQL d'enregistrement du manifeste PDF.
- Sérialisation par verrou advisory transactionnel calculé sur l'identifiant du document ; contrainte `UNIQUE(document_id,version)`.
- Empreinte SHA-256 source, révision, numéro Vn dans la copie de manifeste PDF ; réponse d'API comprenant le numéro de version.
- Un export direct n'ajoute aucune archive ni snapshot. Aucune migration/destruction des anciennes archives.
- Échec transactionnel : la copie PDF de la nouvelle opération est supprimée ; le manifeste et le JSON du snapshot sont annulés ensemble.

## Réserves de sûreté
- Le contenu JSON source du PDF est préservé, même si un autre onglet modifie ensuite le brouillon. Le contrôle de révision du rendu est maintenu, mais une écriture tardive entre cette vérification et l'archivage demeure possible.
- Le fichier PDF est écrit avant la transaction DB (avec nettoyage des échecs) ; la création n'est pas atomique au sens système de fichiers + base, notamment en cas de crash brutal.
- Immutabilité assurée par absence de route de modification et clés/contraintes ; un déclencheur DB empêchant UPDATE/DELETE reste à envisager.
- Le numéro Vn doit être testé sous des appels concurrents sur PostgreSQL réel.
- Il faut vérifier le volume JSON, l'intégrité et la restauration via des tests d'intégration.
- Les tableaux, graphiques et images non fidèles continuent de bloquer la génération.
- Aucun typecheck, build, test PostgreSQL/PDF n'a été exécuté. Aucune fusion ni changement Jira.
