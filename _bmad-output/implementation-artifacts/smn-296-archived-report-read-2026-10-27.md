# SMN-296 — Archives PDF des équipes archivées (27 octobre 2026)

Le garde `assertAdminArchivedReportRead` autorise uniquement la consultation d'archives PDF d'une équipe Scrum archivée en schéma v29, pour un administrateur actif de la même installation. La route de téléchargement tente d'abord le résolveur normal des équipes actives puis, seulement en cas d'échec, le garde de lecture historique. La requête existante vérifie toujours la correspondance archive/Sprint/équipe, la visibilité et l'intégrité du PDF.

Cette autorisation est strictement limitée à la route GET de téléchargement. Elle ne rend pas les équipes archivées modifiables et ne réactive aucun autre service d'écriture. Les autres parcours d'archives, registres et exports restent à auditer.

Tests préparés, non exécutés. Aucune migration ni build. PR brouillon #204.
