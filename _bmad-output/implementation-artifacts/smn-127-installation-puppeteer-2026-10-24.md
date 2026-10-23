# SMN-127 — Installation automatique de Puppeteer Core

Demande approuvée : la bibliothèque Puppeteer doit être installée automatiquement avec les dépendances de l'application SMN, sans action `pnpm add` propre à l'utilisateur final.

## Publication
- `puppeteer-core` **24.0.0** est ajouté à `dependencies` (pas `devDependencies`) de `package.json`.
- `pnpm install` installe maintenant le paquet en même temps que les autres modules d'exécution, sous réserve d'une connexion au registre et d'un verrouillage cohérent.
- `pnpm pdf:doctor` signale séparément si le module est installé et si Chrome est trouvé.
- `puppeteer-core` ne télécharge **aucun navigateur**. Chrome installé sur le poste est utilisé. Éventuelle prise en charge d'Edge en secours à traiter séparément.

## Action indispensable pour le verrouillage

Le connecteur GitHub ne permet pas d'exécuter `pnpm install` et le réseau npm n'est pas disponible dans l'environnement de création. Le fichier `pnpm-lock.yaml` **n'a pas été régénéré** et peut refuser une installation `--frozen-lockfile` en l'état.

Sur une copie locale à jour :
```powershell
git pull
pnpm install --no-frozen-lockfile
pnpm pdf:doctor
pnpm pdf:smoke
pnpm typecheck
pnpm exec tsx --test tests/smn-127-puppeteer-install.test.ts
pnpm build
```
Publier ensuite **`pnpm-lock.yaml`** avec GitHub Desktop. Après cette étape, les installations ultérieures `pnpm install --frozen-lockfile` seront reproductibles.

Aucun test ni navigateur n'a été exécuté dans ce contexte. L'installation doit être confirmée localement avant clôture de SMN-127.
