# SMN — Préparation technique I0

**19 octobre 2026 — préparation documentaire engagée à la demande de l'utilisateur.**
**État :** protocole préparé, qualification documentaire effectuée, validation sur poste non exécutée, aucun essai ni développement exécuté.
**Références :** [contrôle CONCERNS](implementation-readiness.md), [architecture](architecture/architecture-SMN-2026-10-19/ARCHITECTURE-SPINE.md), [sécurité/exploitation](architecture/architecture-SMN-2026-10-19/SECURITE-EXPLOITATION.md).

L'utilisateur accepte la recommandation de traiter d'abord stack, Windows, PostgreSQL/migrations et sécurité des accès. Cet accord autorise leur préparation ; il ne vaut ni approbation de versions non vérifiées, ni autorisation de fusion ou de construction applicative. L'utilisateur a ensuite autorisé la consultation ciblée des documentations officielles le 19/10/2026 à 21:51.

## 1. Base acquise

TypeScript, PostgreSQL et Bootstrap 5 ; monolithe modulaire avec domaine indépendant des adaptateurs ; serveur dans la session Windows et loopback initial ; absence de Docker/IDE/service Windows/droits administrateur imposés. Deux rôles Administrateur/Utilisateur et D-PRD-137 (une équipe Scrum/Kanban, contexte rattaché à l'équipe ; SAFe ultérieur) inchangés.

## 2. Ordre de qualification proposé

| Lot | Travail préparatoire | Sortie attendue |
| --- | --- | --- |
| A — Environnement réel | Relever Windows, architecture du poste, Node, pnpm, PostgreSQL et outils clients, disponibilité des chemins et droits | Inventaire factuel du poste, distinct des versions présentes dans l'environnement ChatGPT |
| B — Stack | Examiner en premier React/Next.js, déjà candidats de la spine, puis accès PostgreSQL/ORM et migrations | Matrice versions/compatibilité/contraintes Windows, décision argumentée et versions épinglables |
| C — Persistance | Définir base de test dédiée, compte runtime, droits de migration, contrôles de version de schéma et gestion d'échec | Protocole installation vierge, migration/reprise et vérification d'intégrité |
| D — Identité | Définir amorçage unique, secret initial, session serveur révocable, expiration, protection des mutations et récupération administrateur | Contrat d'accès précis et scénarios de preuve, sans secret publié |
| E — Démonstration I0 | Préparer l'ordre des travaux, le POC PDF et les preuves de sauvegardabilité/restauration | Plan d'exécution révisable sans prétendre que les essais sont faits |

## 3. Matrice de choix à compléter

| Élément | État actuel | Condition avant décision technique finale |
| --- | --- | --- |
| Node.js / pnpm / TypeScript | Retenus ou disponibles déclarativement ; versions non relevées sur le poste SMN | Versions installées, maintenance/support et compatibilité des dépendances vérifiés |
| React / Next.js | Candidats existants examinés en premier, pas encore choix final | Documentation officielle et installation/démarrage Windows sous compte standard |
| Accès PostgreSQL / ORM | Prisma/Drizzle cités comme candidats, aucun choisi | Transactions partagées entre modules, précision numérique, migrations, versions et contraintes natives évaluées |
| Migrations | Versionnement obligatoire ; outil non choisi | Droits minimaux, base vierge, échec/interruption détecté, procédure de reprise documentée |
| Sessions / mots de passe | Garanties de la spine acquises ; bibliothèque/paramètres non choisis | Révocation serveur, cookies, CSRF, amorçage concurrent et récupération maîtrisée ; aucun mécanisme maison supposé sûr |
| PDF | Moteur local non choisi | Compatibilité du moteur et de ses binaires sous Windows sans élévation, pas de transfert SaaS ; POC I0 puis validation fonctionnelle I2 |

Aucun numéro de version n'est recommandé sans vérification. La comparaison de bibliothèques et de leur état de sécurité exige l'autorisation de recherche web avant consultation des sources publiques hors référentiels SMN. L'analyse documentaire interne reste permise.

## 4. Inventaire Windows en lecture seule — à réaliser, non exécuté

Ces commandes sont à lancer ultérieurement dans PowerShell sur le poste cible ; elles ne sont pas une preuve déjà obtenue. Elles ne lisent pas les variables de connexion et n'affichent pas de mot de passe.

```powershell
[System.Environment]::OSVersion.VersionString
[System.Environment]::Is64BitOperatingSystem
node --version
pnpm --version
Get-Command psql, pg_dump, pg_restore -ErrorAction SilentlyContinue |
    Select-Object Name, Source
```

Si un outil PostgreSQL n'est pas dans PATH, cela ne démontre pas son absence : rechercher son emplacement déclaré avant de conclure. La version de psql ou pg_dump est celle du client ; la version serveur devra être relevée séparément via une connexion autorisée, sans publier de chaîne de connexion. Aucune connexion, migration ou écriture de base n'est déclenchée ici.

## 5. Scénarios à préparer avant exécution

- Windows : démarrage, arrêt et reprise sous compte standard ; écoute locale ; erreur PostgreSQL compréhensible, sans secret exposé.
- PostgreSQL : base dédiée vierge, droits runtime/migrateur contrôlés, migrations versionnées, interruption détectée, absence de faux succès.
- Initialisation : un seul produit fixe et une équipe ; un seul amorçage réussi en concurrence ; fermeture durable de l'assistant anonyme.
- Accès : deux profils, refus côté serveur, expiration/révocation et changement du secret initial ; récupération locale contrôlée à spécifier avant mise en service.
- Restitution : POC PDF local, puis fidélité métier et finalisation des archives quand le reporting est livré.
- Continuité : sauvegarde/restauration de test isolée ; cohérence DB/fichiers/clés complétée à l'arrivée des archives.

Les valeurs d'expiration de session, les paramètres cryptographiques, RPO/RTO et seuils NFR ne sont pas arbitrairement fixés ici. Tout nouveau compromis ayant un impact utilisateur sera présenté pour décision.

## 6. Suivi et prochaine action

**C3 reste ouvert** : un protocole préparé ne démontre aucune compatibilité réelle.
**C4 reste ouvert** : l'ordre par capacités sera précisé avec les résultats techniques ; la numérotation Jira ne vaut pas calendrier.

Premier travail futur : [SMN-11](https://lmn24.atlassian.net/browse/SMN-11). Aucun détail d'US n'est reproduit dans les réponses à l'utilisateur, conformément à sa préférence.

La consultation ciblée a été autorisée puis réalisée : [qualification documentaire et recommandations](qualification-documentaire-stack-i0.md). Prochaine action : recueillir l'inventaire réel du poste, préciser les choix exacts et préparer les essais sur le poste cible. Le workflow de construction reste soumis à un mandat distinct. CONCERNS maintenu, suivi non généré, PR non fusionnée.


## Résultat de la qualification documentaire du 19/10/2026

Node 24 LTS et Next 16/React 19 sont proposés pour le premier POC, avec Bootstrap 5.3 et PostgreSQL supporté déjà disponible si adapté. Prisma 7 reste candidat sous contrôle des prérequis Windows et des migrations ; Better Auth et Playwright sont des candidats à éprouver. Versions exactes non verrouillées, aucun test réel exécuté. Les principaux nouveaux contrôles sont Visual C++ pour la configuration Prisma retenue, séparation de la shadow database de développement et cohérence des versions pg_dump/serveur. Le rapport lié détaille les sources et limites ; ses propositions ne changent pas le statut des candidats dans la spine.

## Inventaire déclaré par l'utilisateur — 19/10/2026 à 22:14 (Europe/Paris)

| Élément | Information reçue | Niveau de preuve |
| --- | --- | --- |
| Node.js | 24.21.0 | Version déclarée ; sortie de commande non fournie |
| pnpm | 12.10.0 | Version déclarée ; sortie de commande non fournie |
| PostgreSQL | « dernière distribution stable » | Numéro serveur, distribution et outils clients non relevés |

Node 24 et pnpm 12 appartiennent aux lignes compatibles selon la qualification documentaire liée. Cela ne prouve pas l'installation ni le fonctionnement de SMN. Aucun changement de version n'est effectué ou imposé par cet inventaire.

Prochaine donnée utile : version du serveur PostgreSQL obtenue depuis la connexion utilisée, par `SHOW server_version;` dans l'outil SQL déjà disponible. `psql --version` ne renseigne que le client ; les versions `pg_dump`/`pg_restore` devront également être relevées avant les essais de continuité. Ne pas déduire un numéro installé de la date de publication d'une distribution.

La présence du runtime Visual C++ et les droits de migration restent non vérifiés. Les POC Windows, sessions, PDF et restauration restent non exécutés. CONCERNS maintenu.
