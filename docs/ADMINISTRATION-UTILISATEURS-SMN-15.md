# Administration des utilisateurs — SMN-15 (pilote)

L'Administrateur de Scrum Master Notebook peut créer des comptes sans manipulation PostgreSQL. Aucun compte n'est créé lorsqu'un membre rejoint une équipe Agile.

## Utilisation sur Windows 11

Dans GitHub Desktop, sélectionner **main**, puis **Fetch origin → Pull origin**. Redémarrer SMN avec `pnpm dev` si l'application tourne déjà. Se connecter avec le compte Administrateur défini lors de l'installation.

Depuis `http://localhost:3003/app`, ouvrir **Administrer les comptes utilisateurs**, ou `http://localhost:3003/app/admin/users`.

Le formulaire de création demande le nom d'utilisateur, l'adresse e-mail, un mot de passe initial et le profil **Utilisateur** ou **Administrateur**. Le minimum de 4 caractères reste celui du pilote local ; un mot de passe difficile à deviner est vivement conseillé. La création ne génère aucun e-mail : communiquer le secret au titulaire de manière privée, **jamais dans Jira, ChatGPT ou une capture**. Au premier accès, celui-ci doit modifier son mot de passe.

Le tableau liste les comptes, leur profil et leur état **Actif / Désactivé**. Toute modification nécessite un clic sur **Enregistrer**. Un compte désactivé ne peut plus se connecter ; ses sessions antérieures deviennent invalides. Un changement de rôle invalide également les anciennes sessions. La désactivation ou la rétrogradation du **dernier administrateur actif** est interdite ; chacun ne peut pas désactiver son propre compte administrateur.

Un Utilisateur ne voit pas le lien d'administration, ne peut pas ouvrir sa page et ne peut pas utiliser directement les API de gestion. Les erreurs de collision d'identifiant ou d'e-mail sont signalées sans divulguer les mots de passe.

## Migration transparente du schéma

Les installations SMN-12 existantes sont conservées. À la première opération authentifiée après mise à jour, la migration **`20261020_smn15_accounts`** ajoute un état actif, des index d'unicité insensibles à la casse et marque le schéma version 2. Elle conserve les comptes, leurs rôles et les hachages des mots de passe existants. Elle est transactionnelle et n'est jamais appliquée à un schéma initial non reconnu.

Le diagnostic PostgreSQL accepte ensuite aussi bien une installation valide v1 en attente de migration qu'une installation valide v2. **Ne pas supprimer `%LOCALAPPDATA%\\ScrumMasterNotebook`** et ne pas relancer l'installation Express : utiliser simplement l'administration après connexion.

## À vérifier en recette

Créer un compte Utilisateur, se connecter avec lui dans une navigation privée, changer son mot de passe initial ; vérifier qu'il ne peut pas administrer d'autres comptes. Depuis le compte Administrateur, changer le rôle de ce compte, constater l'expiration de son ancienne session, puis le désactiver et vérifier le refus d'une nouvelle connexion. Ne pas modifier le compte Administrateur initial pendant ce test.

Les contrôles automatiques CI et la recette utilisateur réelle sont des preuves distinctes : attendre la CI réussie avant de considérer ce développement livré.
