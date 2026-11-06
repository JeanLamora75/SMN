# SMN-398 — Catalogue de modèles Office (DOCX/PPTX)

## Installation et fonctionnement

La découverte des modèles Office est **indépendante** des modèles de rapports historiques stockés en PostgreSQL. Aucun modèle Office n'est enregistré ni versionné dans la base.

SMN lit les fichiers du répertoire défini par la variable d'environnement `SMN_OFFICE_TEMPLATES_DIR`. Elle doit contenir un **chemin absolu**. En l'absence de configuration, le dossier par défaut est :

- Windows 11 : `%LOCALAPPDATA%\\ScrumMasterNotebook\\office-templates`
- Autres environnements de développement : `<racine du projet>/.smn-local/ScrumMasterNotebook/office-templates`

Le dossier est créé manuellement si nécessaire par l'utilisateur, sans droits administrateur ; son absence donne une liste vide. Déposer des fichiers `.docx` ou `.pptx` puis ouvrir **Rapports > Modèles** et cliquer sur **Actualiser** pour récupérer la liste à jour.

### Contrats de sécurité

- Lecture serveur seulement ; pas de stockage PostgreSQL ni de chemin absolu transmis au navigateur.
- Formats `docx` et `pptx` uniquement, contrôle de l'extension et de l'archive Open XML ZIP.
- Vérification des fichiers manifestes `[Content_Types].xml` et `_rels/.rels`, des parties document/presentation, et refus des ZIP malformés, chiffrés, trop grands ou incohérents.
- Rejet des fichiers temporaires, cachés, liens symboliques, chemins traversants et fichiers illisibles.
- Répertoire et contenu accessibles uniquement dans le périmètre du serveur ; l'API `GET /api/admin/reports/office-templates` exige une session administrateur valide et contrôle le `teamId` facultatif via `resolveAdminTeam`.
- Les identifiants de modèles sont des empreintes SHA-256 déterministes des noms de fichiers. **Ils ne sont pas des chemins et ne suffisent jamais à autoriser une lecture du fichier** ; les Stories ultérieures doivent toujours revalider contexte et fichier.

### Périmètre livré dans cette Story

La page **Rapports > Modèles** présente la bibliothèque historique et, dans une section distincte, un sélecteur de modèles Office. L'actualisation recharge les modèles présents, sans modification de base. La génération Office et la sauvegarde sont **hors périmètre**, prévues par SMN-399 et SMN-403.

### Tests

- `pnpm exec tsx --test tests/smn-398-office-catalog.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm i18n:check`

Les tests couvrent la découverte, le retrait, les extensions, les fichiers temporaires, liens symboliques, archives invalides et chemin configuré. Les commandes sont à exécuter et leur réussite à confirmer sur Node.js 24 / Windows 11 et CI GitHub avant clôture de la Story.

Référence Jira : https://lmn24.atlassian.net/browse/SMN-398
