# SMN-127 — D1 : préparation de Chrome et Puppeteer Core

Décision approuvée : produire les PDF du serveur avec Puppeteer Core et Chrome local disponible ; ne pas rendre le choix du navigateur de consultation dépendant du générateur PDF.

## Publication sur main
- `scripts/report-chrome.mjs` recherche Chrome dans l'installation Windows machine et utilisateur, ou via `SMN_CHROME_PATH` (Linux et macOS pris en compte).
- `scripts/report-pdf-doctor.mjs` vérifie la présence du navigateur ; mode `--smoke` : lance Chrome sans interface, produit un PDF A4 de test en mémoire, vérifie l'en-tête PDF et ferme le navigateur.
- Scripts npm/pnpm `pdf:doctor` et `pdf:smoke` dans `package.json`.
- Tests statiques préparés : `tests/smn-127-chrome-doctor.test.mjs`.

## Installation à effectuer localement sous Windows 11 sans droits administrateur
1. `git pull`
2. `pnpm add puppeteer-core` (modifie localement `package.json` et `pnpm-lock.yaml` ; publier ces deux fichiers via GitHub Desktop après vérification).
3. `pnpm pdf:doctor`
4. Si Chrome n'est pas détecté : `$env:SMN_CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'` (adapter à l'emplacement réellement constaté).
5. `pnpm pdf:smoke`
6. `pnpm exec tsx --test tests/smn-127-chrome-doctor.test.mjs`
7. `pnpm typecheck`, `pnpm build`.

## Limites importantes
- Le paquet `puppeteer-core` et son verrouillage ne sont pas ajoutés côté GitHub tant que `pnpm add` n'a pas été réellement exécuté ; le test `pdf:smoke` échouera en indiquant un échec tant que la dépendance n'est pas disponible.
- Chrome devra exister également sur tout serveur hébergeant le moteur PDF. Sur hébergement sans navigateur, prévoir une installation explicite ou un navigateur géré.
- Cette étape D1 ne produit ni PDF métier, ni archive finale et ne modifie aucune donnée métier.
- Le code n'a pas été exécuté sur Windows, les tests/build ne sont pas validés. Conserver SMN-127 ouverte et continuer par la référence de rendu figée D2.
