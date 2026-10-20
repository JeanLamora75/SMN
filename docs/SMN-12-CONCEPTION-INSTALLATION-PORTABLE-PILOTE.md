# SMN-12 — Conception révisée de l'installation sans administration Windows

**Date :** 20/10/2026  
**État :** proposition d'implémentation du pilote à valider, **aucun code d'installation portable encore développé ni testé**.  
**Décision métier approuvée :** installation complète depuis un lancement simple, avec prise en charge de PostgreSQL portable s'il n'existe pas d'instance SMN gérée ; aucun paramétrage PostgreSQL, Node, pnpm ou jeton manuel pour l'utilisateur. **Option A inchangée :** écran de succès sans session ni tableau de bord avant SMN-14.

## 1. Constat sur l'existant

La version de `main` exige `SMN_DATABASE_URL` et `SMN_SETUP_TOKEN` configurés dans PowerShell avant d'ouvrir l'assistant. `scripts/serve.mjs` invoque un Next.js installé par pnpm, et `src/server/installation/install.ts` sait créer une base après confirmation, mais ne fournit ni PostgreSQL ni runtime applicatif. Cette version est vérifiée en CI sur base PostgreSQL éphémère, **pas** en installation portable sous Windows utilisateur standard. Ne pas présenter ce dispositif comme une installation grand public achevée.

## 2. Expérience utilisateur cible pour le pilote

1. Télécharger **SMN-Pilote-Windows-x64.zip** (ou un paquet équivalent validé), l'extraire dans un répertoire personnel, puis **double-cliquer sur « Démarrer SMN »**. Aucun GitHub Desktop, IDE, Node.js, npm, pnpm, SQL ou PowerShell n'est demandé à l'utilisateur final.
2. Le lanceur intégré démarre le serveur Node/Next local sur `127.0.0.1:3003`, ouvre le navigateur et affiche un écran de bienvenue et l'état des composants ; aucun secret ni URL PostgreSQL à saisir.
3. Une instance PostgreSQL **déjà gérée par SMN** est réutilisée. Sinon, proposer « Préparer les composants de SMN » : extraire une distribution PostgreSQL 18 Windows x64 validée **dans un répertoire privé à l'utilisateur**, initialiser le cluster local dédié, réserver un port propre (p. ex. 55432 si libre) et démarrer par `pg_ctl`, **sans service Windows et sans élévation**.
4. Ne **jamais** s'approprier, mettre à jour ou réinitialiser une instance PostgreSQL existante d'un autre logiciel, notamment LMN24. La présence d'un PostgreSQL système ne constitue pas une autorisation de l'utiliser. Si aucune instance SMN n'est reconnue, privilégier sa propre instance portable isolée, même si un autre PostgreSQL fonctionne déjà.
5. L'assistant explique ce qui sera installé et où les données seront conservées. L'utilisateur confirme explicitement avant l'initialisation du cluster et de la base `smn`; il renseigne ensuite uniquement **Scrum/Kanban, produit, équipe, mot de passe Administrateur avec confirmation**.
6. Le backend applique la **migration officielle versionnée** existante et initialise atomiquement les données et l'administrateur ; un indicateur de progression vérifiable et une page de réussite sont affichés. Les routes privées demeurent bloquées jusqu'à SMN-14.
7. Aux lancements ultérieurs, le lanceur relance seulement **l'instance SMN reconnue**, vérifie le schéma et ouvre le navigateur ; aucune réinstallation, aucune demande de mot de passe PostgreSQL, aucun effacement automatique.

Le format ZIP/double-clic est la **recommandation minimale pour le pilote**, pas la preuve qu'un binaire portable compatible existe. Un installateur graphique signé pourra venir plus tard si les essais le justifient.

## 3. Architecture minimale à mettre en œuvre

| Composant | Responsabilité | Emplacement/proposition |
| --- | --- | --- |
| Paquet Windows x64 | Distribuer le build Next en mode standalone et **Node.js 24 embarqué**, plus un lanceur utilisable au double-clic | Archive de release produite en CI à partir de `main`, pas d'exigence d'installation de Node |
| Runtime PostgreSQL portable | Fournir `postgres.exe`, `initdb.exe`, `pg_ctl.exe`, `pg_isready.exe`, et les dépendances natives nécessaires | Binaire 18.x de provenance, intégrité SHA-256, architecture et licences vérifiées ; inclus dans l'archive pilote pour usage hors ligne |
| Bootstrap Node | Détection et préparation réentrante, état/progression, démarrage et arrêt des processus qu'il possède | `src/server/bootstrap/**` + lanceur `scripts/windows/**` (noms proposés) |
| Stockage privé | Garder cluster, identifiants, logs, état, sauvegardes et fichiers applicatifs **hors du dépôt et des répertoires servis par Next** | `%LOCALAPPDATA%\\ScrumMasterNotebook\\...`, permissions du compte Windows contrôlées |
| Base métier | Créer `smn` uniquement dans **le cluster SMN reconnu**, appliquer le schéma officiel, vérifier l'état après commit | Réutiliser `src/server/installation/**`, `src/server/db/probe.ts` et `prisma/migrations/**` |
| Configuration sensible | Générer des mots de passe forts côté logiciel, sans affichage ni jeton à recopier ; aucun secret en clair durable | Protection liée au compte Windows (p. ex. DPAPI ou Credential Manager) à implémenter et **tester** ; pas d'affirmation d'intégration existante |
| API/assistant | Remplacer la dépendance aux variables `SMN_DATABASE_URL` et `SMN_SETUP_TOKEN` saisies manuellement par une autorisation d'amorçage **locale, éphémère, non exposée dans URL/logs** ; protéger les mutations de la page web et les accès concurrents | `src/app/setup/**`, `src/app/api/setup/**` et contrôle côté serveur |

**Séparation des droits** : pendant l'amorçage, l'installateur dispose des privilèges nécessaires à son cluster ; après installation, l'application doit exploiter un rôle PostgreSQL restreint, distinct des tâches de migration. Ne pas supposer que le simple accès à `127.0.0.1` prouve l'autorisation de créer une base. Aucun mot de passe en argument CLI ou journal. Le moyen précis d'échanger une capacité locale depuis le lanceur vers le navigateur reste à concevoir et à tester avant diffusion.

**Lifecycle** : l'app ne doit arrêter que son processus PostgreSQL identifié, jamais tuer un `postgres.exe` quelconque ; journaliser les erreurs sans secrets ; refuser l'installation si le répertoire cible est non accessible, synchronisé de manière risquée, ou si le port est indisponible sans permettre de reprise sûre. Une mise à jour du code ne supprime ni ne recrée le cluster.

## 4. Travaux par incrément (publication directe sur main)

**Étape P0 — faisabilité Windows non élevée (bloquante avant promesse de portabilité).** Identifier une distribution portable PostgreSQL 18.x Windows x64 redistribuable, en vérifier les licences, l'origine et la SHA-256 ; valider sur un runner **Windows non administrateur** l'extraction locale, `initdb`, le démarrage loopback, l'authentification sécurisée et l'arrêt. Tester le démarrage sans redistributable/outil installé au préalable. Si le binaire ne fonctionne pas sans privilèges/dépendances, arrêter la promesse et choisir une distribution validée avant de poursuivre. **Aucune recherche web avancée ni téléchargement effectué dans cette conception.**

**Étape P1 — distribution portable et lanceur.** Produire une archive qui comprend Node et le build Next standalone ; double-clic pour lancer SMN, vérifier les prérequis, préparer l'instance PG dédiée après confirmation, ouvrir le navigateur et afficher les erreurs. Aucun IDE, service Windows, commande PowerShell ou `pnpm` pour l'utilisateur final.

**Étape P2 — assistant Express simplifié.** Réutiliser les transactions/migrations SMN-12 et les tests CI existants ; générer et protéger les secrets automatiquement, sécuriser l'autorisation d'amorçage à usage unique, présenter confirmation et progression, garantir installation unique et reprise non destructive après interruption.

**Étape P3 — vérification sur poste pilote.** Essayer sur Windows 11 **sans droits admin**, avec et sans PostgreSQL installé, LMN24 présent, port déjà occupé, antivirus/permissions restrictifs, seconde exécution, redémarrage, arrêt inattendu et mode hors ligne. Vérifier que le cluster SMN seul est manipulé, qu'aucun jeton n'est visible, que l'installation ne produit jamais un succès partiel, et que l'authentification métier reste bloquée avant SMN-14.

## 5. Critères d'acceptation supplémentaires de SMN-12

- **Given** Windows 11 x64 ordinaire et aucun environnement Node/PostgreSQL SMN, **When** l'utilisateur extrait le paquet et lance SMN, **Then** le navigateur affiche le parcours d'installation sans ligne de commande ni élévation.
- **Given** aucun cluster SMN reconnu, **When** l'utilisateur confirme l'installation, **Then** la distribution portable validée est mise en place et la base dédiée est créée sans toucher aux bases existantes ni aux services Windows.
- **Given** PostgreSQL est déjà utilisé par LMN24 ou une autre application, **When** SMN démarre, **Then** il ne lit, n'arrête, ne migre ni ne réutilise ce serveur sans configuration et autorisation explicites ; il privilégie son propre cluster.
- **Given** le cluster SMN existe et le schéma est valide, **When** SMN redémarre, **Then** les données sont retrouvées et les opérations d'initialisation ne sont pas répétées.
- **Given** échec de téléchargement/package, droits, port, initialisation ou migration, **When** la tentative échoue, **Then** le diagnostic signale une reprise sûre, sans suppression automatique et sans accès privé.
- **Given** l'installation se termine, **When** l'utilisateur reçoit la confirmation, **Then** il ne lui reste aucune configuration PostgreSQL, Node ni jeton manuel à gérer ; le login et le tableau de bord restent prévus à SMN-14.

## 6. Limites et décision avant développement

**Validé par l'utilisateur** : PostgreSQL portable pris en charge si absent, installation sans droits administrateur, parcours utilisateur non technique, option A de SMN-12, `main` directe pour le pilote. **Proposé, à confirmer sur preuve** : packaging ZIP Windows x64 avec Node + PostgreSQL inclus, instance privée SMN systématiquement isolée des PostgreSQL non-SMN, choix de protection des secrets et mécanisme d'amorçage. Le pilote doit rester portable, mais la compatibilité sur tous les postes d'entreprise verrouillés **n'est pas garantie** : si une politique bloque les exécutables, l'assistant doit le dire, et non demander silencieusement l'élévation.

**Définition de fait accompli :** document conceptuel déposé sur `main` uniquement. La branche principale contient encore l'implémentation SMN-12 nécessitant des paramètres techniques ; **aucun portable PostgreSQL, ZIP final ou lanceur sans PowerShell n'est disponible à ce stade**.
