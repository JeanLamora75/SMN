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
- `pnpm build` réussi : compilation et génération production, y compris `/api/dashboard`. CI main Linux/Windows/PostgreSQL : résultats à consigner avant passage BMAD en review. Paquet autonome Windows à régénérer après source.
- Recette globale Windows 11 utilisateur différée, sans réinstallation. Jira demeure En cours ; aucune clôture.

## Vérification après revue
76 tests ciblés de politique et 132 tests locaux réussis sur 133, un ignoré, zéro échec. Lint et TypeScript réussis après les ajouts de tests ; build applicatif déjà réussi sur les mêmes sources. Les scénarios HTTP de session hors périmètre, contexte absent, révocation et Origin absente sont ajoutés ; leur exécution réelle PostgreSQL/HTTP est à confirmer en CI.
