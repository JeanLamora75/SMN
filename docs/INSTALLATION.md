# SMN — Lancement et diagnostic I0 / SMN-11

**Portée actuelle :** première interface locale et lecture seule du diagnostic PostgreSQL. Ni création de base, ni assistant Express, ni compte administrateur, ni migration ne sont encore livrés. Ces capacités appartiennent notamment à SMN-12 et SMN-14.

## Préparation du poste Windows 11

Utiliser une session Windows ordinaire. Prérequis déclarés par l'utilisateur : Node.js 24.21.0, pnpm 12.10.0, serveur PostgreSQL 18.6. Aucun IDE, Docker, NestJS ni élévation Windows n'est requis par la conception ; **le démarrage local, l'accueil et les refus visuels /app et /setup ont été validés sur le PC utilisateur** ; les autres diagnostics PostgreSQL restent à qualifier.

Depuis GitHub Desktop, sélectionner la branche `dev/bmad-i0-20261020`, cliquer sur **Fetch origin** puis **Pull origin** si nécessaire. Le binaire Git fourni avec GitHub Desktop n'est pas forcément disponible comme commande `git` dans PowerShell : **aucune installation supplémentaire de Git CLI n'est requise**.

Depuis le répertoire SMN récupéré avec GitHub Desktop, ouvrir PowerShell et contrôler :

```powershell
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm run doctor
pnpm lint
pnpm test
pnpm typecheck
pnpm build
```

Le lockfile doit être présent dans la branche téléchargée avant d'utiliser `--frozen-lockfile`. Sur le PC local, `pnpm test` ignore explicitement les tests d'intégration PostgreSQL réservés à la base `smn_ci` éphémère du runner GitHub Actions ; ces tests ne doivent jamais être exécutés avec une base réelle. Ne pas activer un changement de versions sans l'examiner.

### Port HTTP réservé à SMN

Les ports **3000, 3001 et 3002** sont déjà utilisés par une autre application et doivent lui rester réservés. SMN utilise **3003 par défaut**, pour `pnpm dev` comme pour `pnpm start`. Aucune modification de l'autre projet n'est nécessaire.

L'adresse par défaut est **http://127.0.0.1:3003** (ou `http://localhost:3003`). Si 3003 est lui aussi occupé, SMN doit échouer en signalant que ce port n'est pas disponible, sans essayer les ports 3000 à 3002. Vous pouvez choisir un autre port libre, par exemple 3010, **uniquement pour la session PowerShell courante** :

```powershell
$env:SMN_PORT = "3010"
pnpm dev
```

Pour revenir au port par défaut :

```powershell
Remove-Item Env:SMN_PORT -ErrorAction SilentlyContinue
pnpm dev
```

Le contrôle `pnpm run doctor` (ne pas confondre avec `pnpm doctor`, qui vérifie pnpm lui-même) affiche l'adresse configurée et refuse explicitement `SMN_PORT=3000`, `3001` ou `3002`. On ne peut pas conclure que 3003 est libre sans l'avoir testé sur le poste.

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

Ouvrir **http://127.0.0.1:3003**. Si la base n'existe pas encore, le diagnostic doit l'indiquer et ne doit pas proposer de l'effacer ou de la créer en silence. L'écran `/setup` présente uniquement les prérequis dans le cas d'une base vierge ; l'installation effective sera implémentée dans SMN-12. `/app` reste bloqué.

Pour lancer le build compilé après `pnpm build` :

```powershell
pnpm start
```

## Essais non destructifs sur le PC

1. Démarrer sans `SMN_DATABASE_URL` : diagnostic « configuration manquante », pas de faux succès.
2. Arrêter PostgreSQL / fournir volontairement une URL incorrecte : diagnostic relançable et sans secret.
3. Vérifier qu'une URL contenant `/lmn24` est rejetée **avant connexion**.
4. Vérifier séparément que l'autre projet démarre sur 3000/3001/3002 et que SMN démarre sur 3003. L'utilisateur a confirmé le 20/10/2026 qu'il utilisera les deux projets **alternativement**, sans obligation d'exécution simultanée. Si 3003 est occupé, diagnostiquer le conflit et sélectionner au besoin un autre port libre avec `SMN_PORT`.
5. Tester `/app` : refus/404 en l'absence d'authentification.
6. Tester `/setup` : accès refusé sauf si le diagnostic confirme une base SMN dédiée vierge.
7. Vérifier qu'aucune base ni objet métier n'a été créé par le lancement.

**Ne créez pas de base SMN manuellement par défaut.** La création avec confirmation et contrôle des droits appartient au travail d'installation SMN-12. Aucune commande `prisma db push`, `prisma migrate dev` ou remise à zéro n'est demandée sur une base réelle.

## Preuves et limites

GitHub Actions fournit, lorsqu'il réussit, des preuves d'installation des dépendances, tests unitaires, typecheck et build **sur Linux**. Les tests PostgreSQL de CI ciblent exclusivement une instance éphémère. Le 20/10/2026, l'utilisateur a confirmé par capture d'écran que la page d'accueil SMN s'ouvre sur son PC Windows 11 avec le diagnostic « La connexion à la base SMN n'est pas encore configurée » après démarrage local. Cette preuve est **limitée à l'affichage et au démarrage** : les accès directs `/setup` et `/app` (refus visuel confirmé par deux captures supplémentaires du 20/10/2026), les droits PostgreSQL 18.6 et l'authentification restent à recetter sur le poste. L'utilisateur a confirmé que les deux projets fonctionnent séparément et a choisi de ne pas les exécuter simultanément. Aucune base SMN réelle n'a été touchée par l'agent.


### Preuves après revue BMAD

Le diagnostic serveur inspecte les objets applicatifs (tables, vues, séquences, fonctions, types) et les schémas distincts de `public`, et ne considère pas une installation comme complète sans historique de migration réussi. La politique de schéma I0 est volontairement limitée au marqueur de version 1 ; **SMN-12 devra enregistrer explicitement la liste attendue de ses migrations et tables métier**. Les statuts inconnus bloquent l'accès.

Le diagnostic CLI `pnpm run doctor` contrôle la version Node et le port configuré ; il **ne réalise pas une connexion PostgreSQL** : son message indique si `SMN_DATABASE_URL` est présente, puis invite à consulter le contrôle serveur au démarrage. Aucun mot de passe ni chaîne de connexion n'est affiché.


## Décision de livraison après revue nº 2 (20/10/2026)

Après arbitrage utilisateur pour avancer par itérations, SMN-11 conserve la page de démarrage et le diagnostic **sans création de base**. Le mode « installation initialisée » ne pourra être déclaré qu'après définition des migrations officielles dans SMN-12 ; toute prétendue installation reconnue à partir d'un marqueur isolé est classée **installation incomplète**. Il s'agit d'une mesure de prudence pour éviter les faux succès jusqu'à l'installateur réel.

La [CI de clôture](https://github.com/JeanLamora75/SMN/actions/runs/39411560620) a réussi ses tests Linux/PostgreSQL et Windows. Les détails des vérifications supplémentaires restent tracés dans [le triage BMAD](../_bmad-output/implementation-artifacts/spec-smn-11-demarrage-local-prerequis.md). Les droits PostgreSQL Windows sur la future base utilisateur n'ont **pas** été essayés ; aucun nouveau test manuel destructif n'est demandé.
