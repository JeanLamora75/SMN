# SMN — Lancement et diagnostic I0 / SMN-11

**Portée actuelle :** première interface locale et lecture seule du diagnostic PostgreSQL. Ni création de base, ni assistant Express, ni compte administrateur, ni migration ne sont encore livrés. Ces capacités appartiennent notamment à SMN-12 et SMN-14.

## Préparation du poste Windows 11

Utiliser une session Windows ordinaire. Prérequis déclarés par l'utilisateur : Node.js 24.21.0, pnpm 12.10.0, serveur PostgreSQL 18.6. Aucun IDE, Docker, NestJS ni élévation Windows n'est requis par la conception ; **son fonctionnement effectif sous Windows reste à tester**.

Depuis le répertoire SMN récupéré avec GitHub Desktop, ouvrir PowerShell et contrôler :

```powershell
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm doctor
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```

Le lockfile doit être présent dans la branche téléchargée avant d'utiliser `--frozen-lockfile`. Ne pas activer un changement de versions sans l'examiner.

### Connexion privée à PostgreSQL

SMN lit uniquement `SMN_DATABASE_URL`. L'hôte doit être `localhost`, `127.0.0.1` ou `::1`, et le nom de la base doit être `smn` ou commencer par `smn_`. **Aucune valeur `DATABASE_URL` n'est réutilisée implicitement.** Ne jamais pointer vers LMN24 ou une autre base.

La saisie ci-dessous masque les caractères tapés ; elle laisse néanmoins temporairement l’URL dans la variable d’environnement du processus. La protection définitive des secrets locaux sera livrée avec l’installateur. Pour un diagnostic temporaire sur le PC, utiliser dans une session PowerShell privée (ne **jamais** copier le secret dans ChatGPT ou un commit) :

```powershell
# Optionnel : saisir localement une URL de connexion déjà autorisée.
# Attention : une variable d'environnement de session ne constitue pas
# un coffre de secrets ; fermer cette session après le test.
$inputSecret = Read-Host "URL PostgreSQL locale SMN" -AsSecureString
$env:SMN_DATABASE_URL = [System.Net.NetworkCredential]::new("", $inputSecret).Password
Remove-Variable inputSecret
pnpm dev
```

Éviter toute capture d'écran/commande contenant des mots de passe ou URL réels. Le formulaire de secret masqué et le dossier privé viendront avec l'installation guidée. En l'absence d'URL configurée, lancer simplement `pnpm dev` pour obtenir un diagnostic non connecté.

Ouvrir **http://127.0.0.1:3000**. Si la base n'existe pas encore, le diagnostic doit l'indiquer et ne doit pas proposer de l'effacer ou de la créer en silence. L'écran `/setup` présente uniquement les prérequis dans le cas d'une base vierge ; l'installation effective sera implémentée dans SMN-12. `/app` reste bloqué.

Pour lancer le build compilé après `pnpm build` :

```powershell
pnpm start
```

## Essais non destructifs sur le PC

1. Démarrer sans `SMN_DATABASE_URL` : diagnostic « configuration manquante », pas de faux succès.
2. Arrêter PostgreSQL / fournir volontairement une URL incorrecte : diagnostic relançable et sans secret.
3. Vérifier qu'une URL contenant `/lmn24` est rejetée **avant connexion**.
4. Tester `/app` : refus/404 en l'absence d'authentification.
5. Tester `/setup` : accès refusé sauf si le diagnostic confirme une base SMN dédiée vierge.
6. Vérifier qu'aucune base ni objet métier n'a été créé par le lancement.

**Ne créez pas de base SMN manuellement par défaut.** La création avec confirmation et contrôle des droits appartient au travail d'installation SMN-12. Aucune commande `prisma db push`, `prisma migrate dev` ou remise à zéro n'est demandée sur une base réelle.

## Preuves et limites

GitHub Actions fournit, lorsqu'il réussit, des preuves d'installation des dépendances, tests unitaires, typecheck et build **sur Linux**. Les tests PostgreSQL de CI ciblent exclusivement une instance éphémère. Les essais Windows 11, permissions effectives PostgreSQL 18.6 et authentification restent à valider sur le poste. Aucune base SMN réelle n'a été touchée par l'agent.
