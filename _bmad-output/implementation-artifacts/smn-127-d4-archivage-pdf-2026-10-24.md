# SMN-127 / SMN-128 — D4 : archivage obligatoire du PDF réellement généré

## Implémentation publiée sur main
- `POST /api/admin/reports/sprints/[id]/pdf` conserve sa vérification d'administrateur et de référence de rendu figée.
- Les octets PDF rendus par Puppeteer sont transmis sans modification à `storeFinalPdfArchive` avant réponse 200 : nom de fichier unique, écriture privée exclusive, SHA-256, contrôle de relecture, transaction de métadonnées.
- Référence D2 (UUID, empreinte) ajoutée au manifeste et options de rendu sélectionnées pour traçabilité ; équipe revalidée en base avant archivage.
- La réponse PDF n'est transmise qu'après retour du service d'archive ; l'ID de l'archive est fourni dans `X-SMN-Archive-Id`. Tout échec de génération OU de stockage produit 503 et aucun PDF de succès.
- Tests de contrat ajoutés dans `tests/smn-127-d4-pdf-archive.test.ts`.

## Réserves bloquantes
- Aucun navigateur Puppeteer, test TypeScript, test PostgreSQL ou build n'a été exécuté. `puppeteer-core` doit encore être ajouté via `pnpm add puppeteer-core` et le lockfile publié.
- Les données d'options enregistrées dans le manifeste sont une sélection limitée des options effectivement rendues ; il faut enrichir la traçabilité du modèle sélectionné et de toutes les options du brouillon.
- Un processus tué entre écriture du fichier et COMMIT peut laisser un orphelin physique ; D5 doit prévoir une récupération et une clé d'idempotence transactionnelle.
- Le mécanisme de stockage actuellement utilisé écrit un PDF avant le COMMIT SQL : la garantie de récupération après panne brutale doit être testée, et ne doit pas être considérée acquise.
- Sur un stockage partagé/plusieurs instances ou Windows verrouillant les fichiers, la recette doit couvrir les échecs de disque, concurrence et restauration.
- Les limitations existantes de fidélité de l'aperçu restent applicables : tableaux et graphiques doivent faire l'objet d'une recette HTML/PDF réelle.
- Tant que D5 et la recette ne sont pas terminées, ne clôturer ni SMN-127 ni SMN-128.

## Vérifications sur Windows
`git pull`
`pnpm add puppeteer-core`
`pnpm pdf:doctor`
`pnpm pdf:smoke`
`pnpm typecheck`
`pnpm exec tsx --test tests/smn-127-d4-pdf-archive.test.ts`
`pnpm i18n:check`
`pnpm build`

Test fonctionnel : figer un rapport, générer PDF et vérifier la présence du PDF dans la bibliothèque des archives, son intégrité et son téléchargement. Tester explicitement l'arrêt du stockage et contrôler l'absence de réponse PDF 200.
