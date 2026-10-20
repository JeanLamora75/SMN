# Autorisations serveur — SMN-16

Deux profils existent : Administrateur (`admin`) et Utilisateur (`user`). Le serveur relit le compte et son rôle pour chaque requête, vérifie son activité, la fin du changement initial et l'empreinte du secret. Les sessions révoquées ou expirées ne donnent aucun accès.

| Ressource | Administrateur actif | Utilisateur actif |
| --- | --- | --- |
| Collectif | Lecture, écriture, génération, téléchargement selon le producteur | Lecture de la projection collective explicite uniquement |
| Individuel (membres, coordonnées, absences, capacités nominatives) | Opérations du producteur sous ses protections propres | Tout refusé |
| Comptes | Administration, protections dernier administrateur et compte propre conservées | Tout refusé |
| Paramètres | Administration selon le producteur | Tout refusé |
| Documents PDF/TXT existants | Lecture/téléchargement ; écriture ; génération sur collection existante | Lecture/téléchargement si explicitement autorisé par le serveur |
| Sauvegardes | Opérations du producteur sous ses protections propres | Tout refusé |

Tout rôle, action ou type de ressource inconnu est refusé. `exists` et `inScope` doivent être strictement vrais. Pour lire/télécharger un document, son format doit être exactement `PDF` ou `TXT` et il doit s'agir d'un document, pas d'une collection. La génération de document Administrateur exige `collection: true` sur une collection existante dans l'installation. Ces droits n'implémentent aucune génération.

## Contrat serveur réutilisable

`canAccess` dans `src/server/access-policy.ts` est la politique pure. `protectedOperation` vérifie cette politique avant d'appeler le producteur et retourne uniquement `{ allowed: false }` lors d'un refus. Les futurs producteurs doivent résoudre l'existence, l'installation, le format et l'autorisation documentaire depuis leurs données serveur ; aucune métadonnée d'autorisation ne vient du JSON client. Ils conservent leurs protections spécifiques et leur projection publique.

`authorizeApi` relit l'acteur avec `sessionAccount`, exige un Host local et une Origin identique pour toute mutation. Les routes comptes l'utilisent avant de lire le JSON ou d'appeler le gestionnaire. Elles visent la collection des comptes de l'installation ; le gestionnaire conserve la résolution des comptes cibles, les codes d'erreur SMN-15, la protection du dernier administrateur et la révocation des sessions.

Les pages privées et leur navigation utilisent la même politique sans sérialiser d'objet `Account` dans les composants clients. Connexion, changement de son secret initial, activité et déconnexion conservent leur contrat SMN-14 pour les deux profils. L'installation anonyme reste limitée à l'amorçage contrôlé. Les requêtes d'authentification et de gestion des comptes sont bornées à `installation_id = singleton`, y compris le comptage du dernier administrateur et le changement initial. Des lignes étrangères dans une base incohérente ne donnent aucun accès ni droit de modification ; aucune capacité multi-installation n'est créée.

## Livré et vérifié

`GET /api/dashboard` est une lecture collective réelle. Elle renvoie exclusivement le contrat `readCollectiveDashboard` : contexte produit/équipe/mode et collections métier actuellement vides. La requête SQL limite le contexte à l'installation singleton initialisée ; un contexte absent, multiple ou invalide ne renvoie aucun contenu. Tous les refus ont une réponse générique 403, sans détail d'existence ; les réponses portent `Cache-Control: no-store, private`.

Les tests `tests/authorization.test.ts` parcourent les 72 combinaisons rôle/ressource/action, les acteurs invalides, l'absence et le périmètre, les formats et permissions documentaires. Un espion vérifie qu'un refus n'appelle jamais le producteur et ne restitue aucun contenu. Les ressources individuelles, documents et sauvegardes restent des tests du contrat futur : aucun endpoint individuel, faux document ou téléchargement d'archive n'est livré.

Le script `scripts/verify-http-ci.mjs` complète les preuves HTTP existantes sur serveur de production et PostgreSQL 18 éphémère : dashboard admin/user, refus anonyme et changement initial, projection exacte sans champs individuels, comptes inchangés après POST/PATCH utilisateur refusés, refus des lignes d'une installation étrangère (AC6). Il conserve les scénarios SMN-14/15 et la révocation. Il interdit l'exécution contre une base personnelle.

## État de validation

- TDD : rouge constaté avant les exports de politique, puis 75 tests ciblés verts via `node --import tsx --test tests/authorization.test.ts`.
- `pnpm lint` et `pnpm typecheck` réussis ; suite locale via `node --import tsx --test tests/*.test.ts tests/*.test.mjs` : 131 réussis, 1 ignoré, aucun échec. Sans URL DB, les intégrations PostgreSQL restent explicitement ignorées.
- Les commandes `pnpm exec tsx --test …` et `pnpm test` rencontrent la restriction locale de pipe IPC `EPERM`. Le lancement direct de Node avec le même chargeur tsx couvre les mêmes tests.
- `pnpm build` réussi : compilation et génération production, y compris `/api/dashboard`. CI main Linux/Windows/PostgreSQL et paquet autonome ensuite réussis ; preuves ci-dessous.
- Recette globale Windows 11 utilisateur différée, sans réinstallation. Jira demeure En cours ; aucune clôture.

## Vérification après revue
76 tests ciblés de politique et 132 tests locaux réussis sur 133, un ignoré, zéro échec. Lint et TypeScript réussis après les ajouts de tests ; build applicatif déjà réussi sur les mêmes sources. Les scénarios HTTP de session hors périmètre, contexte absent, révocation et Origin absente sont ajoutés ; leur exécution réelle PostgreSQL/HTTP a réussi dans la CI finale référencée ci-dessous.

## Preuves CI finales — 20 octobre 2026

- Application : `f1eea1fe261ef14cb5f34cd0eea7cc8277015975` ; correction de la sonde HTTP seulement : `7c4bc07c9aa2cdd005f1422bbc4c8e931398adc8`.
- [CI complète 39465051577](https://github.com/JeanLamora75/SMN/actions/runs/39465051577) **réussie** : Linux/PostgreSQL 18.6, **144 tests dont 143 réussis, 0 échec, 1 ignoré** ; Windows, **133 tests dont 132 réussis, 0 échec, 1 ignoré**. Lint, Prisma, TypeScript, builds et scénarios HTTP de production réussis. Journaux consultés, dont le message de réussite SMN-16.
- [Paquet Windows 39464637127](https://github.com/JeanLamora75/SMN/actions/runs/39464637127) **réussi** : installation Express complète sur base isolée, reprise préservant les données de l'essai interrompu, port PostgreSQL de remplacement persisté et connexion disponible. [ZIP produit](https://github.com/JeanLamora75/SMN/actions/runs/39464637127/artifacts/12284651790).
- Le premier run [39464637174](https://github.com/JeanLamora75/SMN/actions/runs/39464637174) avait échoué sur la sonde Host, pas sur un refus de rôle : une capture locale a prouvé que fetch remplaçait le Host fourni. La sonde utilise désormais node:http pour envoyer effectivement cet en-tête falsifié, puis vérifie le refus 403. Les scénarios qui suivent ont été réellement exécutés dans le run final.
- Aucune migration, aucune modification des décisions métier ou de la base personnelle. Les tests DB sont exclusivement ceux des runners temporaires.
- **Recette globale Windows 11 utilisateur non exécutée**. Le runner Windows est Windows Server ; ne pas les confondre. Jira reste **En cours**, suivi BMAD **review**, sans clôture.

## Traçabilité de la recette globale

| Critère Jira | Preuve livrée |
| --- | --- |
| AC1 | Administrateur : lecture collective et création/modification de comptes en HTTP réel ; autres ressources selon contrat de politique. |
| AC2 | Utilisateur : projection collective exacte en HTTP, sans données nominatives sensibles. |
| AC3 | Refus POST/PATCH réel et comparaison des comptes avant/après ; génération documentaire refusée dans le contrat, sans producteur exécuté. |
| AC4 | Lecture individuelle refusée par la politique, avec callback non appelé ; producteurs individuels à raccorder lors de leurs Stories. |
| AC5 | PDF/TXT existant explicitement autorisé : lecture/téléchargement permis par contrat ; génération/écriture user refusées. Aucun téléchargement d'archive réel revendiqué avant livraison de ce module. |
| AC6 | Compte étranger invisible et non modifiable ; ancienne session d'un compte déplacé hors singleton refusée ; ressource absente et hors scope refusées. |

Aucune nouvelle action n'est demandée sur le PC pendant le développement. Lors de la recette globale : récupérer main, redémarrer normalement, comparer accès Administrateur/Utilisateur au tableau de bord et aux comptes, puis vérifier le refus après désactivation. Ne pas réinstaller.
