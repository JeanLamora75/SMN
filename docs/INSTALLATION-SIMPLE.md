# Installer Scrum Master Notebook — pilote Windows

**Objectif :** ouvrir SMN puis cliquer sur « Installer SMN ». Il n'est pas nécessaire de préparer une base PostgreSQL, de créer un utilisateur SQL ou de recopier un jeton d'installation.

## Utilisateur pilote — paquet autonome

Dès qu'un paquet a **réussi ses contrôles Windows**, le télécharger depuis le panneau **Artifacts** de la dernière exécution réussie du workflow [SMN — Paquet Windows pilote](https://github.com/JeanLamora75/SMN/actions/workflows/portable-package.yml). Le paquet porte le nom `SMN-Pilote-Windows-x64`.

1. Extraire complètement l'archive ZIP dans un dossier personnel standard. **Ne pas lancer le programme depuis l'archive compressée.**
2. Double-cliquer sur `Demarrer SMN.cmd` dans le dossier `SMN-Windows`. Une fenêtre ouvre le serveur local, puis le navigateur sur `http://127.0.0.1:3003`.
3. Cliquer **Installer SMN**. Saisir le mode Scrum ou Kanban, le nom du produit, le nom de l'équipe et un mot de passe administrateur (avec confirmation). L'adresse initiale documentée reste `admin@locahost.com`.
4. Lire l'avertissement de création puis cocher la confirmation et cliquer **Installer SMN**. Attendre la fin de la préparation de PostgreSQL : elle peut durer plusieurs minutes au premier lancement.
5. Vérifier le message de réussite. L'accès au tableau de bord reste désactivé jusqu'à la Story [SMN-14](https://lmn24.atlassian.net/browse/SMN-14).

L'archive doit contenir **Node.js 24 et les binaires PostgreSQL 18.6 vérifiés**, sans ajout de service Windows. Les fichiers de données SMN sont conservés sous `%LOCALAPPDATA%\ScrumMasterNotebook`, hors du dossier de l'application. Ne pas supprimer ce répertoire pour « réinstaller » : il contient les données et la configuration.

**Sécurité et limites :** aucune opération n'est appliquée au PostgreSQL d'un autre projet, en particulier LMN24. Les ports 3000–3002 restent réservés, SMN utilise 3003 et son propre PostgreSQL utilise 55432. Une politique de sécurité Windows peut empêcher l'exécution de binaires portables ; SMN doit alors signaler la restriction, sans réclamer de droits administrateur. L'archive elle-même et la procédure complète **restent en cours de qualification** tant que le workflow Windows de packaging et l'installation sur un poste utilisateur standard n'ont pas réussi.

## Développeur du pilote — projet déjà récupéré depuis GitHub Desktop

Sur le PC où SMN fonctionnait déjà via `pnpm dev`, récupérer les nouveautés depuis la branche **`main`** dans GitHub Desktop (**Fetch origin**, puis **Pull origin**). Conserver ensuite le mode de démarrage déjà opérationnel :

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Ouvrir `http://localhost:3003` : l'absence de configuration SMN doit maintenant afficher le bouton **Installer SMN**, et non un formulaire d'URL PostgreSQL. **Aucune manipulation de PostgreSQL, de variable `SMN_DATABASE_URL` ni de jeton `SMN_SETUP_TOKEN` n'est requise.** Les utilisateurs de l'archive autonome n'auront pas à exécuter ces commandes.

Ne jamais communiquer le mot de passe administrateur dans ChatGPT ou Jira. Une installation ne doit être considérée comme validée localement qu'après résultat du formulaire et vérification de la réouverture sans réinitialisation.
