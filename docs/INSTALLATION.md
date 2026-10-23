# SMN — Installation locale Windows et diagnostic du pilote

**État au 20 octobre 2026 :** SMN-11 et SMN-12 sont disponibles sur **`main`**. SMN-12 fournit l'assistant Express et la migration initiale après confirmation ; SMN-14 fournira la connexion et le changement de secret. Les tests Linux/PostgreSQL 18 et Windows en CI ont réussi, mais l'installation sur le PostgreSQL 18.6 personnel attend la recette utilisateur.

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


## SMN-12 — Première installation Express (branche de développement)

**Aucune création de base utilisateur n'est effectuée par la CI ou ChatGPT.** SMN-12 a passé ses contrôles automatisés ; l'utilisateur choisit le moment de la recette PostgreSQL sur son PC et confirme explicitement les écritures dans le formulaire. Les ports 3000 à 3002 restent réservés à l'autre projet ; SMN écoute seulement sur 3003.

1. Dans **GitHub Desktop**, sélectionner **`main`** dans **Current branch**, utiliser **Fetch origin** puis **Pull origin**. Ouvrir PowerShell dans le répertoire SMN et lancer `pnpm install --frozen-lockfile`. La commande Git CLI n'est pas nécessaire.
2. Préparer PostgreSQL 18 et un compte **déjà autorisé** à créer une base. Ne pas utiliser les identifiants d'une autre application : l'installateur refuse toute cible autre qu'une base commençant par `smn`. Le rôle courant doit disposer de `CREATEDB` si la base n'existe pas, et de `CREATE` sur le schéma `public` de la base neuve.
3. Configurer `SMN_DATABASE_URL` pour pointer vers **une base SMN dédiée** (exemple de structure uniquement : `postgresql://UTILISATEUR:MOT_DE_PASSE@127.0.0.1:5432/smn`). Les caractères spéciaux du mot de passe doivent être encodés dans l'URL. **Ne jamais partager la valeur réelle** ni la publier dans Git ou ChatGPT.
4. Dans la même session PowerShell, générer un jeton local aléatoire : `$env:SMN_SETUP_TOKEN = node -e "process.stdout.write(require('node:crypto').randomBytes(24).toString('hex'))"`. Il n'est pas enregistré sur GitHub et doit rester secret ; le formulaire le demandera à l'écran, sans le renvoyer dans une URL.
5. Démarrer `pnpm dev` puis ouvrir `http://127.0.0.1:3003` ; accéder à **Installer SMN**. Choisir Scrum/Kanban, produit, équipe, un mot de passe Administrateur robuste, puis saisir le jeton et confirmer la création de la base dédiée et des tables. La mutation n'a lieu qu'après cette confirmation.
6. En cas de succès, l'assistant n'est plus ouvert à une nouvelle installation et les données privées restent fermées **jusqu'à SMN-14** (connexion et changement de secret initial). Aucune session ou tableau de bord ne sont simulés.
7. Si PostgreSQL refuse la création, corriger les permissions avec un compte autorisé ; **ne pas créer un rôle automatiquement**. Si la création de la base a réussi mais l'initialisation a échoué, consulter le diagnostic et reprendre sans suppression silencieuse. Ne jamais tester la réinitialisation sur une base contenant déjà des données.

Le mot de passe PostgreSQL et le jeton sont des secrets **uniquement locaux** ; préférer une session PowerShell privée et ne pas les inscrire dans l'historique sous forme littérale. Cette phase ne fournit pas encore le coffre de configuration privée qui relève de SMN-19.
 

### Saisie locale des identifiants PostgreSQL sans les inscrire dans l'historique PowerShell

Dans une **nouvelle session PowerShell privée**, ouverte dans le répertoire SMN, exécuter (les valeurs sont saisies au clavier dans les invites, jamais écrites dans les commandes) :

```powershell
$pgUser = Read-Host "Utilisateur PostgreSQL autorisé"
$pgSecret = Read-Host "Mot de passe PostgreSQL" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgSecret)
try {
    $pgEncoded = [uri]::EscapeDataString([Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr))
    $userEncoded = [uri]::EscapeDataString($pgUser)
    $env:SMN_DATABASE_URL = "postgresql://{0}:{1}@127.0.0.1:5432/smn" -f $userEncoded, $pgEncoded
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    Remove-Variable pgEncoded -ErrorAction SilentlyContinue
}
$env:SMN_SETUP_TOKEN = node -e "process.stdout.write(require('node:crypto').randomBytes(24).toString('hex'))"
pnpm run doctor
# Avant pnpm dev, recopier le jeton dans le presse-papiers uniquement sur ce PC :
$env:SMN_SETUP_TOKEN | Set-Clipboard
pnpm dev
```

Le jeton est défini **uniquement dans cette session PowerShell** ; le script le copie dans le presse-papiers avant le démarrage du serveur pour permettre de le coller dans le formulaire. Effacer le presse-papiers après utilisation. Ne jamais coller ces secrets dans Jira, ChatGPT ou une capture d'écran.

**Important :** garder le mot de passe choisi pour l'Administrateur dans un gestionnaire de mots de passe. Le compte est créé avec un indicateur de renouvellement obligatoire ; le formulaire de changement et l'ouverture d'une session privée arriveront avec SMN-14. Ne pas considérer un écran de confirmation comme une session authentifiée.


### Workflow pilote simplifié

Les prochains changements seront publiés directement sur **`main`**, sans branche ou PR obligatoire. Pour récupérer les nouveautés, utiliser **GitHub Desktop → Current branch : main → Fetch origin → Pull origin**. Garder PowerShell pour `pnpm` seulement ; l'historique Git et la CI sont conservés pour pouvoir diagnostiquer ou revenir à une version stable.


## Build de production sur un poste Windows sans privilèges de création de symlinks (23/10/2026)

Le build de développement/pilote lancé par `pnpm build` sous Windows **ne demande plus** l'option Next.js `output: "standalone"`. Cette option essaie de créer des liens symboliques dans `.next/standalone` et échoue avec `EPERM: operation not permitted, symlink` sur certains postes professionnels sans autorisation spécifique. Cette erreur survient **après** une compilation et une vérification TypeScript parfois toutes deux réussies.

La configuration `next.config.ts` utilise désormais :
- Windows / `pnpm build` ordinaire : sortie Next standard, sans production de `.next/standalone`.
- Linux/macOS : comportement `standalone` inchangé.
- Fabrication du paquet Windows autonome : `SMN_BUILD_STANDALONE=1` explicitement défini uniquement à l'étape de compilation de `.github/workflows/portable-package.yml`. Le packaging nécessite `.next/standalone/server.js` et utilise déjà `npm install` dans cet environnement distinct pour éviter les liens pnpm. Cela **ne réactive pas** les tests GitHub Actions, indisponibles par décision projet.

Après récupération des commits sur `main`, arrêter tout serveur SMN et exécuter dans PowerShell :

```powershell
pnpm exec tsx --test tests/build-output-mode.test.ts
pnpm typecheck
pnpm build
pnpm start
```

Si une tentative antérieure a laissé des artefacts corrompus sous `.next`, arrêter le serveur puis effacer **uniquement les fichiers générés** dans `.next` et refaire le build :

```powershell
Remove-Item -LiteralPath .next -Recurse -Force -ErrorAction SilentlyContinue
pnpm build
```

**Ne pas supprimer** `node_modules`, `pnpm-lock.yaml`, les fichiers de configuration privés ou les répertoires PostgreSQL ; aucune élévation Windows ni activation du mode Développeur n'est nécessaire pour ce correctif. `pnpm start` continue de démarrer Next sur `127.0.0.1:3003`.

Le message `[baseline-browser-mapping] ... over two months old` est **un avertissement sans rapport avec EPERM**. Il concerne les données de compatibilité navigateur, pas la compilation ou la base. Les versions des dépendances étant verrouillées dans `pnpm-lock.yaml`, leur mise à jour doit faire l'objet d'une modification séparée, vérifiée ; ne pas lancer aveuglément `npm i ...` dans ce projet pnpm.

Statut du correctif : code et test publiés sur `main` ; exécution du build sur le poste Windows et qualification du paquet autonome **à confirmer par la recette locale**.
