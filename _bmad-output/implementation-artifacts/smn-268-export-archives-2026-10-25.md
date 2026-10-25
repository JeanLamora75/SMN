# SMN-268 — Export PDF et archives du Studio

## Livraison incrémentale
- Contrôle qualité côté serveur sur la dernière version sauvegardée du rapport.
- Endpoint POST d'export PDF direct sans archivage et PUT d'archivage confirmé, réservés au rôle administrateur.
- Avertissements non bloquants : confirmation demandée, puis nouvel appel avec acquittement.
- Génération PDF via Chrome local existant, avec contenu HTML échappé et requêtes externes interdites.
- Archivage immuable via `storeFinalPdfArchive`, manifest SHA-256 et stockage privé déjà utilisés par l'Epic 6.
- Téléchargement par la route historique avec contrôle des droits. Nouvelles traductions FR/EN.

## Limites majeures / recette obligatoire
- Le rendu PDF utilise une mise en page conservatrice séparée de l'aperçu HTML du Studio ; il n'est **pas encore garanti fidèle** (AC1 partiel).
- Graphiques complexes, images externes et blocs tableau enrichis sont encore représentés de façon simplifiée ; images externes non incorporées. Le PDF ne doit pas être considéré comme final sans recette visuelle.
- Le sommaire ne calcule pas encore de numéros de pages.
- Les corrections locales non encore enregistrées ne figurent pas dans le PDF. L'interface doit être coordonnée avec la sauvegarde automatique avant fusion.
- Le problème de concurrence autosave/refresh de SMN-264 reste ouvert.
- Tests droits admin/user, reproduction PDF, relecture des archives, versionnement de deux archives et validation des autorisations de téléchargement : non exécutés.
- `pnpm typecheck`, `pnpm build`, PostgreSQL, Chrome et tests PDF : non exécutés.
- Aucune fusion sur main ni transition Jira ; PR brouillon dépendante des précédentes.

## Points d'intégration
- Code : `src/server/reports/studio-pdf-render.ts`, `studio-export.ts`, route `.../documents/[documentId]/pdf`.
- UI : `report-pdf-actions.tsx`.
- Réutilisation du stockage et de la route de téléchargement historiques : aucun remplacement des anciennes archives.
