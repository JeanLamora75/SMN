# ADR — Compatibilité des schémas centralisée (SMN)

Date : 29 octobre 2026 — statut : décision de conception, développement non engagé.
Références : SMN v31 et branche de préparation v32 `fix/smn-v32-team-agile-mode`.

## Problème
Des contrôles locaux `schema_version >= 28 && <= 31`, etc. sont dupliqués dans les routes API, l'authentification et les services. L'introduction d'une nouvelle version rend certains endpoints inaccessibles (HTTP 503), même lorsque leurs tables n'ont pas changé. En outre, `smn_installation.mode` ne doit plus décider du mode des équipes après passage au modèle multiéquipes.

## Décision
1. Introduire un contrat central explicite `src/server/schema/` : **version courante**, **version minimale d'exécution**, **capabilities**, prérequis SQL et erreurs typées. Une capability ne doit jamais être accordée uniquement sur une comparaison numérique sans contrôle d'intégrité nécessaire.
2. Un point d'accès `requireSchemaCapability(db, capability)` vérifie version, migration et structure attendue; aucune création/migration en lecture. La résolution `resolveAdminTeam` continue de contrôler les droits indépendamment du schéma et retourne le mode de l'équipe.
3. Les API ne codent plus de bornes de version. Les branches historiques sont regroupées dans des adaptateurs de compatibilité identifiés, avec exceptions documentées.
4. Migration v32 : transition v31 → v32 explicite et transactionnelle; conservation de Koala Scrum (3 sprints) et Panda vide (mode modifiable). Aucune initialisation automatique silencieuse.
5. Compatibilité produit cible : v32 à l'exécution, v31 pour migrer; les anciennes versions restent dans l'historique, avec politique de migration à définir après audit avant de supprimer le support d'exécution.
6. La CI bloque l'ajout de nouveaux tests directs de version en dehors du module dédié et vérifie les contrats, les migrations et des scénarios multiéquipes.

## Capacités initiales envisagées
- `accounts`, `multi-team`, `per-team-agile-mode`, `company-catalog`, `country-consolidation`, `team-calendar`, `scrum-cycles`, `kanban-periods`, `links`.
Le registre exact dépendra de l'inventaire de l'existant.

## Contrats non fonctionnels
- Pas de requêtes SQL fondées sur une version supposée; vérification de structure réelle.
- Pas d'accès aux équipes par simple `teamId` client; autorisation serveur requise.
- Aucun secret, aucune migration implicite, échec explicite si schéma inconnu ou incomplet.
- Tests statiques, unitaires, intégration PostgreSQL v31→v32, Scrum/Kanban isolés, auth, calendrier, rapports et paramètres.

## Stratégie incrémentale
A. Inventaire des gardes dispersées et matrice de capabilities.
B. Contrat central, tests de structure et compatibilité.
C. Migration progressive des endpoints par domaine, sans rupture d'API.
D. Règle ESLint/CI empêchant la réintroduction de gardes locaux (exceptions justifiées).
E. Recette multiéquipes et documentation de procédure vN→vN+1.

## Livrables et critères de sortie
- Chaque API critique consomme le contrat central ou une exception tracée.
- Une nouvelle migration n'exige pas l'édition manuelle des bornes dans toutes les API.
- La CI est verte et les tests PostgreSQL réels ont été exécutés; sinon la migration ne doit pas être déclarée validée.
- Documentation architecture et guide de création d'une nouvelle version mis à jour.

## Risques et dépendances
- Dépend de la finalisation de la v32 et de la stabilisation des contrats de tables.
- Les écrans historiques basés sur `smn_installation.mode` nécessitent un audit distinct.
- Ne pas raccourcir la compatibilité historique avant validation du chemin de migration.
