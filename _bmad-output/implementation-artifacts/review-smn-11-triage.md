# SMN-11 — Triage vérifié des trois revues BMAD

**Date :** 20/10/2026. **Snapshot revu :** `cc9a08cc6517cc47029309779a943998743297c5`. 20 Blind Hunter (B), 32 Edge Case Hunter (E), 18 Verification Gap (V), 4 constats annexes (O) = **74 constats**. Tous ont une ligne et un verdict avant regroupement ; les rapports complets restent dans la conversation de revue fournie par l'utilisateur.

**Méthode :** recoupement du code et des tests GitHub aux emplacements cités dans les rapports. Les 18 constats V sont traités comme vérifiés selon la règle BMAD de la couche Verification Gap. Les notes ci-dessous consignent l'issue observée, **pas l'acceptation aveugle de la solution proposée**. Les constats faux ne demandent pas de modification ; les entrées `bad_spec` nécessitent un réexamen de conception et le retour BMAD à l'implémentation avant clôture ; les `patch` sont des corrections directes. Les changements ultérieurs ne doivent pas effacer ces preuves historiques.

**Total initial :** {"medium":50,"high":15,"low":4,"false":5}.

| ID | Verdict | Route | Preuve / vérification |
|---|---|---|---|
| B01 | medium | patch | Le guide emploie pnpm doctor, alors que le script local n'est invoqué que par pnpm run doctor. |
| B02 | medium | bad_spec | Le diagnostic CLI ne teste ni pnpm ni PostgreSQL et émet toujours le même message, même avec URL configurée. |
| B03 | medium | patch | Le lanceur affiche l'adresse avant la disponibilité effective ; aucune assertion sur EADDRINUSE. |
| B04 | medium | bad_spec | USAGE seul ne prouve pas CREATE ; il faut séparer diagnostic runtime et privilèges de migration. |
| B05 | medium | bad_spec | probePostgres ne récupère pas server_version_num : compatibilité inconnue. |
| B06 | high | bad_spec | La requête ignore schémas, séquences, vues et relations étrangères ; risque de fausse base vierge. |
| B07 | medium | bad_spec | La liste blanche à deux tables classifiera les futures tables SMN comme étrangères. |
| B08 | high | bad_spec | initialized ne nécessite aucune preuve de migration achevée ; faux succès atteignable. |
| B09 | medium | bad_spec | La politique de versions est une égalité codée en dur à 1, sans manifeste versionné. |
| B10 | medium | patch | Les erreurs PostgreSQL 42703/42P01 peuvent être prises pour un échec réseau. |
| B11 | high | patch | Les options de query string sont transmises à pg sans validation ; rejeter l'URL non maîtrisée. |
| B12 | high | bad_spec | Le test PostgreSQL reconstruit le snapshot sans appeler le probe applicatif. |
| B13 | medium | bad_spec | La CI HTTP n'exerce que la base vierge pour /setup, pas les autres états. |
| B14 | low | patch | Le skip des intégrations locales existe ; la documentation doit signaler explicitement ce test non exécuté. |
| B15 | medium | bad_spec | ubuntu-latest n'exerce pas de tests automatisés Windows malgré la cible Windows. |
| B16 | medium | patch | prisma.config.ts manque dans les filtres CI ; pnpm-workspace.yaml est déjà surveillé (partiel). |
| B17 | high | bad_spec | Le job d'installation de dépendances conserve contents:write et les identifiants de checkout. |
| B18 | medium | patch | RootLayout conserve html lang=fr malgré les messages en anglais. |
| B19 | medium | patch | startsWith('en') ne respecte pas les q-values d'Accept-Language. |
| B20 | false | reject | Le workflow d'activation affirme seulement le rendu officiel, non l'exécution intégrale ; la preuve est correctement qualifiée. |
| E01 | high | patch | parseConnectionSettings ignore searchParams puis transmet l'URL brute. |
| E02 | medium | bad_spec | USAGE et CREATE sont distincts ; l'étape de préparation doit afficher l'écart sans exiger CREATEDB par défaut. |
| E03 | high | bad_spec | Les relations d'autres schémas applicatifs échappent au scan SQL. |
| E04 | high | bad_spec | Les objets non-table dans public échappent au scan SQL. |
| E05 | medium | bad_spec | Version serveur jamais interrogée. |
| E06 | medium | bad_spec | Des tables futures rendent la liste blanche à deux noms incompatible. |
| E07 | high | bad_spec | La ligne singleton peut suffire pour initialized sans _prisma_migrations. |
| E08 | high | bad_spec | Aucune lecture de l'état d'échec des migrations ; une base partielle peut être acceptée. |
| E09 | medium | bad_spec | Version de schéma figée à 1, sans politique versionnée. |
| E10 | medium | patch | La projection SELECT id/state/schema_version produit 42703 si colonne absente, classé connection-error. |
| E11 | medium | patch | classifyDatabaseError omet les erreurs structurelles usuelles. |
| E12 | medium | bad_spec | Les requêtes PG sont réalisées séparément sans transaction à instantané cohérent. |
| E13 | false | reject | La page /setup ne modifie aucun état ; une concurrence après lecture ne crée pas une installation et la future mutation doit revalider (SMN-12). |
| E14 | medium | patch | La commande native pnpm doctor masque le script local. |
| E15 | medium | bad_spec | doctor n'éprouve que Node et le port ; le diagnostic PostgreSQL réel est distinct. |
| E16 | medium | patch | Le lanceur ne teste pas le conflit d'occupation et imprime l'adresse avant succès. |
| E17 | medium | patch | Aucun relais explicite des signaux parent-enfant, susceptible de laisser Next actif. |
| E18 | medium | patch | L'attribut HTML lang ne suit pas la langue calculée. |
| E19 | medium | patch | startsWith('en') accepte en;q=0 et ignore son exclusion explicite. |
| E20 | medium | patch | startsWith('en') ignore une langue anglaise supportée située après une langue non supportée. |
| E21 | low | patch | Le skip local est réel et non expliqué dans le guide. |
| E22 | false | reject | La suite intégrée actuelle ne fait que des SELECT et une tentative de connexion à une base absente ; aucune mutation de base réelle démontrée. |
| E23 | high | bad_spec | Le test PostgreSQL existant n'importe jamais probePostgres. |
| E24 | medium | bad_spec | La CI HTTP ne couvre que la base vierge. |
| E25 | medium | bad_spec | Seule la CI Linux existe ; un échec de script natif Windows serait invisible. |
| E26 | medium | patch | Le filtre CI omet prisma.config.ts. |
| E27 | medium | patch | La CI autorise une régénération silencieuse du lockfile absent. |
| E28 | high | bad_spec | contents:write est accessible au code tiers à l'installation. |
| E29 | false | reject | Le workflow bmad-build-activation est un point d'activation unique attesté ; aucune récurrence n'est promise. |
| E30 | false | reject | Le job indique officiellement un rendu et une première lecture uniquement ; il ne se présente pas comme une validation complète. |
| E31 | medium | patch | Le guide fixe encore 3003 après avoir autorisé SMN_PORT=3010. |
| E32 | medium | bad_spec | La matrice est surtout couverte par doubles de tests ; les cas PostgreSQL réels ne sont pas tous exercés. |
| V01 | high | bad_spec | Le probe réel n'est appelé dans aucune suite, seule une requête de test parallèle. |
| V02 | medium | bad_spec | initialized n'est vérifié qu'en snapshot simulé. |
| V03 | high | bad_spec | Le scan SQL de base étrangère n'est pas traversé par les tests sur PostgreSQL réel. |
| V04 | medium | bad_spec | parseConnectionSettings est testé isolément, pas par l'API avec URLs invalides. |
| V05 | medium | bad_spec | Le refus HTTP setup pour initialized/incompatible/incomplete n'est pas testé sur une base réelle. |
| V06 | medium | patch | Le test HTTP n'assert que 200, pas le texte ni le lien setup. |
| V07 | medium | patch | Les deux en-têtes no-store et nosniff ne sont pas vérifiés en HTTP. |
| V08 | medium | patch | Les variantes en/fr ne font l'objet d'aucun test HTTP avec Accept-Language. |
| V09 | medium | patch | Le port 3010 est testé par résolveur seulement, jamais sur Next réel. |
| V10 | medium | patch | Le lanceur n'est pas exercé sur les ports interdits dans les tests. |
| V11 | medium | patch | Aucun cas de port occupé dans les tests de démarrage. |
| V12 | medium | patch | pnpm dev n'est pas testé automatiquement, bien qu'observé en recette Windows. |
| V13 | low | patch | doctor est exécuté seulement sous Node 24 en CI ; aucun test du rejet d'une autre majeure. |
| V14 | medium | patch | La régénération automatique du lockfile absent masque sa suppression. |
| V15 | medium | patch | prisma.config.ts n'est pas un chemin déclencheur. |
| V16 | medium | patch | La CI ne surveille ni les PR vers main/docs ni les push sur main. |
| V17 | medium | bad_spec | L'absence de CI Windows ne teste pas le lanceur et les dépendances natives sur Windows. |
| V18 | low | defer | L'activation ponctuelle du rendu ne surveille pas les changements de skill ; hors validation en cours, outil BMAD transversal. |
| O01 | medium | patch | Le guide utilise la commande native pnpm doctor et non pnpm run doctor. |
| O02 | medium | patch | lang=fr est constant malgré des pages en anglais. |
| O03 | high | bad_spec | La requête PG ignore les objets non-table et les schémas autres que public. |
| O04 | medium | patch | Une erreur SQL 42703 est classée connection-error. |

## Regroupement par cause commune (après classement individuel)

- **Conception du diagnostic PG (bad_spec)** : B04–B09, B12–B13 ; E02–E09, E12, E23–E24, E32 ; V01–V05 ; O03. Ne pas confondre base vide et base non-table, ni prétendre `initialized` sans migrations ; politique de version de schéma explicite et tests réels.
- **Détection PostgreSQL et secrets (patch)** : B10–B11, E01/E10/E11, O04, plus les tests associés.
- **Qualité du lanceur et diagnostics locaux** : B01–B03, E14–E17, V09–V13, O01. Garder le port 3003 et ne jamais toucher aux autres ports.
- **Langue/accessibilité** : B18–B19, E18–E20, V08, O02.
- **CI et fidélité des preuves** : B14–B17, E21/E25–E28/E31, V06–V07/V14–V18. Réduire permissions, installer sur lockfile figé, exécuter smoke tests représentatifs.
- **Non retenus** : B20, E13, E22, E29, E30 ; V18 conservé pour suivi transversal.

## Passage à la correction

La spécification d'intention `<frozen-after-approval>` est conservée intacte. Le défaut de plan `bad_spec` appelle une **révision des sections de conception non gelées**, puis une dérivation/réexécution des tests, pas une modification des objectifs métier. La branche possède déjà des preuves Windows et une CI ; ces éléments seront conservés comme KEEP, avec un suivi explicite de l'adaptation technique aux outils connecteurs (absence de clone VCS/sous-agents directs). Une **nouvelle revue indépendante des modifications substantielles** pourra être requise avant de déclarer la revue achevée.
