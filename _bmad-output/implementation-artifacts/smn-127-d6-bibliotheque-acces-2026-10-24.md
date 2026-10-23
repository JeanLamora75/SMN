# D6 — Bibliothèque PDF et téléchargements sécurisés

Date : 24/10/2026. Concerne SMN-127, SMN-129, SMN-130, SMN-131 et SMN-135.

## Livré sur main
- La liste d'archives dans la préparation du rapport de Sprint propose désormais un téléchargement pour les PDF dont l'intégrité est marquée « verified ».
- La bibliothèque administrateur et sa route de téléchargement privé restent en place, sans recréation du document.
- Bibliothèque en lecture seule `/app/reports/archives` pour les comptes `user` : consultation uniquement des archives dotées d'une attribution nominative active et non masquées, sur le périmètre d'installation.
- Correction de la requête de création des attributions administrateur lorsqu'aucune table de masquage n'existe.
- Endpoint administratif `DELETE /api/admin/reports/archives/[id]/grants` pour révoquer un droit individuel.
- Tests statiques dédiés dans `tests/smn-127-d6-library.test.ts`.

## Réserves
- L'interface administrateur de sélection des bénéficiaires, consultation et révocation visuelle des droits n'est pas encore développée ; API uniquement. Le lien de la bibliothèque des utilisateurs depuis la navigation générale reste à intégrer.
- Bibliothèque utilisateur bornée à 100 archives, sans pagination. Prévoir recherche/pagination sur volumétrie réelle.
- Les tests vérifient les contrats textuels ; aucune exécution réelle ni recette PostgreSQL, navigateur, gestion des comptes et téléchargements n'a été menée.
- La génération Puppeteer et l'archivage dépendent encore de l'installation validée de `puppeteer-core` et de Chrome, ainsi que de tests réels.
- Ne pas clôturer les stories avant recette D7 et finalisation des interfaces de droits.

Vérifier localement : `git pull`, `pnpm typecheck`, `pnpm exec tsx --test tests/smn-127-d6-library.test.ts`, `pnpm build`.
