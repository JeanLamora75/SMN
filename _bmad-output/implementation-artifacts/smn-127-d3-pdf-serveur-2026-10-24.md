# SMN-127 — D3 : générateur PDF A4 côté serveur

Jira : https://lmn24.atlassian.net/browse/SMN-127.

## Incrément publié
- `src/server/reports/frozen-pdf.ts` : Puppeteer Core ouvre avec Chrome headless la prévisualisation **figée** (D2), en mode impression, puis génère et vérifie un PDF A4 en mémoire.
- L'URL interne doit être locale et pointer exclusivement vers la route de prévisualisation avec UUID de référence ; blocage des ressources réseau externes lors de la génération.
- `POST /api/admin/reports/sprints/[id]/pdf` : contrôle serveur du droit **generate** (administrateur seulement), vérification de la référence figée et réponse PDF téléchargée avec en-têtes privés et `no-store`.
- Prévisualisation figée : bouton « Générer le PDF serveur ». Prévisualisation dynamique : impression navigateur historique maintenue.
- Le PDF n'est pas encore archivé automatiquement : aucun faux succès d'archivage.

## Dépendance technique à installer
Le `package.json` distant ne référence pas encore `puppeteer-core`. Installer réellement sous Windows via `pnpm add puppeteer-core` puis publier **ensemble** `package.json` et `pnpm-lock.yaml` produits par pnpm. Le moteur renvoie une erreur tant que la dépendance et Chrome ne sont pas opérationnels. Configurer `SMN_CHROME_PATH` si Chrome n'est pas détecté. Par défaut, l'URL locale interne est `http://127.0.0.1:3003`; la variable `SMN_PDF_INTERNAL_ORIGIN` permet de la modifier dans l'environnement de confiance.

## Limites et conformité
- Cette implémentation **n'a pas été exécutée** avec Chrome/Puppeteer, ni validée par TypeScript, navigateur ou PostgreSQL. L'export ne peut donc pas être déclaré opérationnel avant recette.
- D4 raccordera le stockage privé, le manifeste et l'empreinte du fichier PDF final ; D5 apportera la reprise idempotente.
- Les graphiques qui n'existent pas dans l'HTML ne sont pas générés artificiellement en PDF.
- Le navigateur effectue une requête interne authentifiée avec un cookie de session temporairement injecté ; sa sécurité, sa politique de lancement et les restrictions d'accès réseau doivent faire l'objet d'une recette.
- Le serveur exige une instance applicative HTTP locale accessible, ce qui dépend du déploiement ; aucun appel à un fournisseur PDF externe n'est introduit.

## Vérification locale
`git pull`
`pnpm add puppeteer-core`
`pnpm pdf:doctor`
`pnpm pdf:smoke`
`pnpm typecheck`
`pnpm exec tsx --test tests/smn-127-d3-pdf.test.ts`
`pnpm i18n:check`
`pnpm build`

Puis ouvrir un Sprint, cliquer « Figer et prévisualiser » et « Générer le PDF serveur » ; vérifier la langue, les sections et les tableaux. Ne pas clôturer la Story avant comparaison HTML/PDF et test réel des erreurs.
