# Préparation du premier travail I0 — installation locale

**20 octobre 2026. Statut : préparation documentaire, sans développement ni ready-for-dev attesté.**

Références : [ticket](https://lmn24.atlassian.net/browse/SMN-11), [planification](sprint-planning-2026-10-19.md), [ADR migrations/secrets](architecture/architecture-SMN-2026-10-19/ADR-I0-002-MIGRATIONS-SECRETS.md), [stack](architecture/architecture-SMN-2026-10-19/ADR-I0-001-STACK.md).

## Éléments disponibles

- Windows 11, Node 24.21.0 et pnpm 12.10.0 déclarés. PostgreSQL 18.6 confirmé par résultat de SHOW server_version rapporté par Eric ; aucune requête exécutée par l'assistant.
- Aucune base SMN créée : l'utilisateur attend sa création par le script d'installation, clarification acceptée le 20 octobre.
- Premier Sprint prévisionnel du 20 au 26 octobre, disponibilité nominale 40 heures ; périmètre non estimé.
- Stack et principes de sécurité approuvés ; compatibilité exacte, droits, packaging et tests restent à qualifier.

## Parcours d'installation à réaliser

1. Diagnostiquer les prérequis et recueillir localement les paramètres PostgreSQL ; masquer les secrets. Ne pas demander de transmettre des identifiants dans ChatGPT.
2. Vérifier le serveur et les droits effectifs. Proposer une base dédiée SMN et afficher la cible avant toute création.
3. Après accord, créer la base si elle est absente et si le compte dispose des droits nécessaires. Ne pas présumer CREATEDB et ne pas l'accorder automatiquement au compte runtime.
4. Si les droits manquent : diagnostic explicite, possibilité de fournir localement un compte autorisé pour cette opération ou d'utiliser une base dédiée précréée par une personne habilitée. Aucune élévation Windows imposée, aucune création manuelle demandée par défaut.
5. Si une base existe : distinguer installation SMN compatible, état partiel et base étrangère. Aucun effacement, réinitialisation ou adoption silencieuse d'une base d'une autre application.
6. Appliquer les seules migrations nécessaires, dans l'ordre, selon ADR-I0-002 ; protéger les secrets dès la première connexion. La création de base et les migrations ne constituent pas une seule transaction à supposer atomique : prévoir une reprise après interruption.
7. Ne présenter le succès qu'après vérification du schéma et des accès utiles. Rendre alors disponible l'amorçage, sans créer équipe ou cycles par le seul démarrage.

La création de rôles PostgreSQL, leurs noms, l'emplacement des secrets, les versions exactes et le mécanisme de packaging restent à concevoir dans la construction. Cette préparation ne modifie pas les critères validés dans Jira et n'affirme pas leur complétude technique.

## Vérifications attendues pendant la construction, non exécutées

| Cas | Preuve attendue |
| --- | --- |
| Base absente, droits suffisants | Création après accord, migrations ordonnées, cible SMN dédiée |
| Droits insuffisants ou accord refusé | Aucune création ni faux succès ; reprise compréhensible |
| Base existante ou étrangère | Réutilisation contrôlée si compatible ; aucun effacement implicite |
| PostgreSQL arrêté / mauvais accès | Diagnostic sans secret et possibilité de relancer |
| Interruption / lancement concurrent | Reprise définie, absence de double initialisation |
| Démarrage Windows standard | Adresse locale utilisable sans élévation Windows |
| Secrets / droits runtime | Aucun secret publié et aucun droit d'administration présumé |

Les essais de restauration complète et PDF restent prévus aux portes I0 concernées. Ils ne bloquent pas la première préparation de diagnostic.

## Passage à la construction

Le point d'entrée officiel lu sur main est [.agents/skills/bmad-build/SKILL.md](../../.agents/skills/bmad-build/SKILL.md). Il impose de rendre le workflow avec le script render_skill.py puis de suivre le workflow généré ; aucun workflow source n'a été exécuté directement. Cette étape n'est pas encore activée : le mandat initial exclut les développements applicatifs sans nouvel accord.

Après autorisation de construction : vérifier les instructions du dépôt et les configurations nécessaires, utiliser la documentation consolidée de la PR ouverte sans fusion implicite, rendre le workflow officiel et suivre ses contrôles avant toute modification de statut. Aucune Story n'est déclarée prête par ce seul document.

**Exécuté ici :** lectures GitHub/Jira et préparation documentaire. **Non exécuté :** script BMAD build, installation, migration, création de base, développement ou test applicatif. CONCERNS maintenu.
