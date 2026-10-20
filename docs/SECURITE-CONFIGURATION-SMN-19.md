# SMN-19 — Protection de la configuration privée et des secrets

**Livraison I0** — configuration locale sécurisée et diagnostics sans fuite. La recette utilisateur Windows 11 demeure différée ; ne pas confondre tests CI et validation du poste personnel.

## Stockage et secrets

- Le serveur utilise `SMN_DATABASE_URL` uniquement si une URL PostgreSQL locale validée, portant un **utilisateur et un mot de passe non vide**, lui est fournie depuis l'environnement privé du processus. Elle n'est ni générée dans le code ni écrite dans le dépôt. Une URL sans secret est refusée ; aucun mot de passe de secours n'est codé en dur.
- Si la configuration est obtenue depuis l'installation guidée Windows, les fichiers sont créés sous `%LOCALAPPDATA%\ScrumMasterNotebook\`, répertoire de profil Windows et non dans le dépôt ou le paquet de distribution. Les fichiers `postgres-connection.json` et `runtime.json` contiennent des secrets **chiffrés par AES-256-GCM**. La clé locale `.settings-key` de 32 octets est conservée séparément dans ce même profil ; les permissions de profil Windows doivent rester restreintes à leur propriétaire et aux comptes système nécessaires. Les flags POSIX de création ne constituent pas à eux seuls une preuve des ACL Windows : les vérifier explicitement en recette poste.
- La clé n'est générée qu'à la première opération de chiffrement et seulement si aucun fichier de configuration chiffré ne préexiste. **Lors d'un déchiffrement, une clé absente ou corrompue entraîne un refus**, sans recréation silencieuse ni destruction du chiffrement précédent. Une clé initiale perdue ne peut pas être retrouvée par une récupération de mot de passe Administrateur.
- Les fichiers privés lus par l'application doivent être ordinaires, de taille limitée et non des liens symboliques ; l'écriture de la configuration existante utilise un fichier temporaire imprévisible, des permissions de création restreintes et un renommage atomique. L'outil de récupération Administrateur applique lui aussi une lecture contrôlée aux fichiers du profil.
- Les sessions sont émises avec des jetons aléatoires conservés en mémoire côté serveur ; elles ne dépendent pas d'un secret de session codé en dur ou commité. Le jeton d'installation locale est aléatoire et transmis en cookie HTTP-only. Le chemin manuel `/api/setup` refuse l'opération si `SMN_SETUP_TOKEN` n'est pas explicitement défini avec la longueur attendue.

## Sorties contrôlées et erreurs

Une clé locale absente donne le diagnostic explicite `configuration-key-missing` et un message FR/EN invitant à restaurer la clé d'origine sans réinstallation. Une lecture d'un fichier privé absent ne crée pas le répertoire de configuration. Le diagnostic public `/api/diagnostic` ne renvoie qu'un état normalisé ; `/api/bootstrap` expose uniquement étape, pourcentage et codes d'erreur appartenant à une **liste exhaustive contrôlée**. Toute erreur technique imprévue, exception `pg`, chemin privé ou message système se traduit par `installation-failed`. Aucune exception brute ne doit être retournée par HTTP ou reprise telle quelle dans l'interface.

L'Administrateur peut consulter `/api/admin/settings`, qui expose **seulement** langue, thème, pays, révision, date, mode et produit. L'Utilisateur ne peut pas y accéder. Il n'existe pas d'export de secrets ; ne jamais placer un mot de passe ou une clé dans une capture d'écran, une demande d'assistance, un log, une URL, un argument de commande ou un rapport.

Le script `pnpm doctor` ne révèle que la **présence** de la variable de connexion, jamais sa valeur. Les journaux bruts de PostgreSQL local restent dans le profil privé ; leur partage et leur caviardage sont à la charge de la procédure de diagnostic, à traiter par les fonctions de support ultérieures.

## CI et distribution

Le dépôt ignore les fichiers `.env`, les clés et manifestes locaux, les mots de passe temporaires et le journal PostgreSQL. `.env.example` ne fournit que des placeholders manifestement fictifs.

Le paquet autonome Windows doit exclure tout `.env`, `.settings-key`, `runtime.json`, `postgres-connection.json`, `postgres.log` à la racine. Les tests automatisés contrôlent les erreurs masquées, les URLs invalides, le chiffrement, l'absence de recréation de clé perdue, la lecture des fichiers privés et les refus d'accès existants. Aucun secret réellement utilisé sur le PC utilisateur ne doit être accessible à la CI.

## Limites et suites

SMN-19 ne livre **ni sauvegarde complète ni restauration inter-PC**. Les ADR-I0-002/003 prévoient pour l'Epic 2 une **copie de récupération protégée par une phrase distincte** du mot de passe Administrateur. Ce format cryptographique et sa recette de restauration réelle seront qualifiés avec les Stories de sauvegarde et restauration. Cette livraison ne prétend ni sauvegarder ni pouvoir régénérer une clé perdue.

Les contrôles d'ACL Windows effectives, de récupération interactive réelle et de comportement sur le poste utilisateur restent à la recette générale. Une clé AES locale protégée dans le même profil que le secret chiffré n'est **pas** une protection contre la compromission du compte Windows ou un processus ayant les mêmes droits.

## Références

- [Jira SMN-19](https://lmn24.atlassian.net/browse/SMN-19)
- [Spécification BMAD SMN-19](../_bmad-output/implementation-artifacts/spec-smn-19-secrets-configuration.md)
- [ADR-I0-002](../_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ADR-I0-002-MIGRATIONS-SECRETS.md)
- [ADR-I0-003](../_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ADR-I0-003-RECUPERATION-CLES.md)

## État de recette automatisée au 20 octobre 2026

La [PR #14](https://github.com/JeanLamora75/SMN/pull/14) demeure **en brouillon** : [CI Linux/Windows](https://github.com/JeanLamora75/SMN/actions/runs/39479862588) et [paquet Windows](https://github.com/JeanLamora75/SMN/actions/runs/39479862524) sont bloqués avant l'affectation d'un runner, sans étapes exécutées. Les contrôles de code sont relus, mais **pas exécutés** dans ces jobs. L'installation de l'utilisateur n'a pas été touchée. Voir la spécification BMAD pour la traçabilité et les réserves.
