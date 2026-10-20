# Installer Scrum Master Notebook — pilote Windows

**Objectif :** ouvrir SMN puis cliquer sur « Installer SMN ». Aucune ligne de commande ni configuration manuelle n'est requise. Pour utiliser un PostgreSQL local déjà installé, renseigner simplement son utilisateur et son mot de passe dans l'assistant. Pour utiliser la version portable, les identifiants techniques sont générés automatiquement.

## Utilisateur pilote — paquet autonome

Dès qu'un paquet a **réussi ses contrôles Windows**, le télécharger depuis le panneau **Artifacts** de la dernière exécution réussie du workflow [SMN — Paquet Windows pilote](https://github.com/JeanLamora75/SMN/actions/workflows/portable-package.yml). Le paquet porte le nom `SMN-Pilote-Windows-x64`.

1. Extraire complètement l'archive ZIP dans un dossier personnel standard. **Ne pas lancer le programme depuis l'archive compressée.**
2. Double-cliquer sur `Demarrer SMN.cmd` dans le dossier `SMN-Windows`. Une fenêtre ouvre le serveur local, puis le navigateur sur `http://127.0.0.1:3003`.
3. Cliquer **Installer SMN**. Choisir « Utiliser PostgreSQL déjà installé » (valeur par défaut, utilisateur PostgreSQL, mot de passe et port, normalement 5432), ou « Installer un PostgreSQL dédié à SMN ». Saisir Scrum/Kanban, le produit et l'équipe, puis vérifier le compte admin modifiable : **e-mail `admin@localhot.com`, utilisateur `admin`, mot de passe `admin`** pour le pilote. Le mot de passe Admin peut comporter 4 caractères minimum ; changer le mot de passe par défaut est fortement conseillé.
4. Confirmer la création et cliquer **Installer SMN**. Une barre de progression décrit les étapes franchies ; avec PostgreSQL existant, vérifier d'abord qu'il fonctionne et que le compte peut créer une base. Avec l'option portable, la préparation des composants peut prendre plusieurs minutes.
5. Vérifier le message de réussite. L'accès au tableau de bord reste désactivé jusqu'à la Story [SMN-14](https://lmn24.atlassian.net/browse/SMN-14).

L'archive doit contenir **Node.js 24 et les binaires PostgreSQL 18.6 vérifiés**, sans ajout de service Windows. Les paramètres de connexion SMN sont enregistrés dans `%LOCALAPPDATA%\ScrumMasterNotebook\postgres-connection.json` avec un mot de passe chiffré pour le mode PostgreSQL existant ; la clé locale est aussi conservée dans le profil Windows. Les fichiers de la base portable sont conservés sous `%LOCALAPPDATA%\ScrumMasterNotebook`, hors du dossier de l'application. Ne pas supprimer ce répertoire pour « réinstaller » : il contient les données et la configuration.

**Sécurité et limites :** aucune opération n'est appliquée au PostgreSQL d'un autre projet, en particulier LMN24. Les ports 3000–3002 restent réservés, SMN utilise 3003 et son propre PostgreSQL utilise 55432. Une politique de sécurité Windows peut empêcher l'exécution de binaires portables ; SMN doit alors signaler la restriction, sans réclamer de droits administrateur. L'archive elle-même et la procédure complète **restent en cours de qualification** tant que le workflow Windows de packaging et l'installation sur un poste utilisateur standard n'ont pas réussi.

## PostgreSQL portable ne démarre pas (échec pg_ctl à 60 %)

L'initialisation du dossier PostgreSQL peut avoir réussi alors que le démarrage du serveur a échoué. **Ne jamais effacer `data`, `runtime.json`, `recovery` ou `pgsql` en réponse à cette erreur.** Le message `managed-process-failed:pg_ctl.exe` ne permet pas de connaître la cause.

Depuis le correctif SMN-12, l'application lit uniquement les nouvelles lignes de son propre `postgres.log` et distingue, quand les messages sont explicites : port 55432 déjà utilisé, répertoire verrouillé, accès refusé, bibliothèque Windows absente, mémoire partagée ou configuration incompatible. Le serveur fournit un **code diagnostique**, jamais le journal brut.

Pour investiguer un poste pilote, ouvrir dans l'Explorateur de fichiers Windows le chemin `%LOCALAPPDATA%\\ScrumMasterNotebook\\postgres.log`, puis examiner les **15 à 20 dernières lignes** avec le Bloc-notes. Les copier pour support seulement après avoir masqué les chemins d'utilisateur, noms personnels et toute donnée sensible. Si ce fichier n'existe pas, le signaler : il peut indiquer un blocage Windows avant le démarrage de PostgreSQL.

L'existence d'un `runtime.json` peut permettre une reprise du démarrage avec la nouvelle version du code ; **ne pas demander une seconde récupération ni déplacer les données**. Le test complet sur Windows utilisateur reste distinct de la CI.

## Reprendre une installation PostgreSQL portable interrompue

Si l'assistant affiche « Une ancienne installation partielle existe », SMN a trouvé un dossier `%LOCALAPPDATA%\\ScrumMasterNotebook\\data` sans configuration portable valide. C'est possible après l'échec d'une préparation précédente. **Ne supprimez pas ce dossier, ne réinitialisez pas votre PostgreSQL personnel.**

Depuis la version corrigée disponible sur `main` :

1. Garder `Installer un PostgreSQL dédié à SMN` sélectionné. Après le premier diagnostic d'échec, une confirmation de récupération est affichée dans le formulaire.
2. Lire la proposition, puis cocher **« J'autorise SMN à mettre de côté son ancienne tentative d'installation et à recommencer. »**
3. Cliquer **« Conserver l'ancienne tentative et reprendre »**, puis suivre la progression. SMN déplace uniquement son propre dossier `data` vers `%LOCALAPPDATA%\\ScrumMasterNotebook\\recovery\\data-partial-...` avant de recommencer : **aucun fichier n'est effacé**.
4. En cas de refus lié à un cluster encore actif, à un `postmaster.pid` ou à un dossier symbolique, **ne pas forcer la reprise**. Le dossier est préservé pour diagnostic.

La récupération ne s'active que **si l'utilisateur a d'abord reçu l'erreur**, avec un accord distinct. L'instance de LMN24 n'est jamais ciblée. Une nouvelle installation fonctionnelle ne supprime pas les archives précédentes ; les conserver tant que la situation n'est pas clarifiée.

## Développeur du pilote — projet déjà récupéré depuis GitHub Desktop

Sur le PC où SMN fonctionnait déjà via `pnpm dev`, récupérer les nouveautés depuis la branche **`main`** dans GitHub Desktop (**Fetch origin**, puis **Pull origin**). Conserver ensuite le mode de démarrage déjà opérationnel :

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Ouvrir `http://localhost:3003` : l'absence de configuration SMN doit maintenant afficher le bouton **Installer SMN**, et non un formulaire d'URL PostgreSQL. **Aucune variable `SMN_DATABASE_URL` ni jeton `SMN_SETUP_TOKEN` ne sont requis : les champs PostgreSQL existant sont saisis dans le navigateur.** Les utilisateurs de l'archive autonome n'auront pas à exécuter ces commandes.

Ne jamais communiquer le mot de passe administrateur dans ChatGPT ou Jira. Une installation ne doit être considérée comme validée localement qu'après résultat du formulaire et vérification de la réouverture sans réinitialisation.


## Configuration enregistrée et sécurité du pilote

Pour l'option **PostgreSQL existant**, SMN enregistre l'utilisateur et le port dans `%LOCALAPPDATA%\\ScrumMasterNotebook\\postgres-connection.json`. Le mot de passe PostgreSQL est **chiffré** avec AES-256-GCM et une clé aléatoire distincte conservée dans le même répertoire privé, protégé par les droits du compte Windows. Ce mécanisme évite le mot de passe en clair dans le fichier de configuration mais **n'est pas un coffre-fort DPAPI ou un gestionnaire de secrets d'entreprise** : le compte Windows propriétaire du dossier peut retrouver le secret. Ne pas copier ni diffuser ce dossier.

Pour ce pilote purement local, le compte administrateur peut commencer avec **admin / admin** ; le flag `must_change_password` reste activé. Avant une éventuelle exposition réseau, une connexion et un changement obligatoire du mot de passe seront nécessaires (SMN-14). Les routes métier restent fermées anonymement.

Si une ancienne tentative portable a créé un dossier PostgreSQL sans configuration valide, **SMN ne le supprimera pas automatiquement**. Choisissez l'option PostgreSQL existant lorsque vous disposez déjà d'une installation PostgreSQL 18 accessible.
