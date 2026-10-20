# SMN — Sprint Planning : suivi initial et proposition de premier Sprint

**Date :** 19 octobre 2026. **Workflow :** bmad-sprint-planning 6.12.4.
**Gate : CONCERNS. Poursuite explicitement autorisée par Eric le 19/10/2026 à 22:41 (Europe/Paris).**
La réponse « Oui » confirme la poursuite sous réserves demandée par le readiness gate. Elle ne change pas le verdict en PASS et n'autorise ni développement, ni fusion, ni mutation des Sprints Jira.

## 1. Suivi généré

[Suivi BMAD](../implementation-artifacts/sprint-status.yaml), généré par le script officiel depuis le seul fichier canonique [epics.md](epics.md).

| Type | Nombre | État initial |
| --- | --- | --- |
| Epics | 10 | backlog |
| Stories | 212 | backlog |
| Rétrospectives | 10 | optional |
| Stories prêtes ou en cours | 0 | Aucun fichier de Story préparé ou implémentation attestée |

Le total backlog de 222 dans le JSON regroupe 10 Epics + 212 Stories. Les dix rétrospectives portent le total des entrées de suivi à 232. Aucun statut n'a été avancé depuis le disque, aucun statut existant n'a été perdu. Jira reste la référence des tickets ; tracking_system=jira ne crée aucune synchronisation automatique.

Les clés sont dérivées par le script, avec accents et troncature éventuelle du libellé ; elles ne sont pas réécrites manuellement. La [correspondance vers Jira](../implementation-artifacts/sprint-jira-map.json) permet de retrouver les 212 tickets indépendamment de ces libellés.

## 2. Commandes réellement exécutées

```text
uv run .agents/skills/bmad-sprint-planning/scripts/sprint_plan.py generate --epic-file _bmad-output/planning-artifacts/epics.md --status-file _bmad-output/implementation-artifacts/sprint-status.yaml --stories-dir _bmad-output/implementation-artifacts --project SMN --date "10-19-2026 22:41" --project-key SMN --tracking-system jira
uv run .agents/skills/bmad-sprint-planning/scripts/sprint_plan.py validate --status-file _bmad-output/implementation-artifacts/sprint-status.yaml
```

Une seconde génération en mode --dry-run a vérifié in_sync=true ; validation : valid=true, problems=[], legacy_mapped=[]. Contrôle complémentaire de correspondance : 212 identifiants de Stories, clés de suivi et tickets Jira uniques. Les résultats JSON utiles figurent dans le [rapport d'exécution](../implementation-artifacts/sprint-planning-validation.json).

Adaptation : fichiers récupérés depuis le connecteur GitHub puis scripts officiels exécutés dans l'environnement ChatGPT, pas sur le PC Windows. uv a installé la dépendance Python du générateur dans cet environnement. Cela n'impose aucun nouvel outil sur le poste utilisateur. Une tentative de --help a renvoyé une erreur d'arguments ; les options ont été lues dans le script, puis la commande complète a réussi.

## 3. Avertissements examinés

Quatre titres sont signalés comme ressemblant à Epic/Story : le titre général Epic Breakdown, la rubrique Epic List et deux sous-titres User Story dans les nouvelles Stories. Ce sont des titres éditoriaux, pas quatre éléments de backlog omis. Les 10 en-têtes d'Epic et les 212 en-têtes canoniques de Story sont tous représentés ; aucune omission n'est acceptée. Aucun changement de numérotation ou de clé n'a été effectué pour masquer les avertissements.

Aucune entrée illégale, orpheline ou normalisation de statut ancien signalée. Ces contrôles sont structurels ; ils ne prouvent pas la faisabilité applicative.

## 4. Proposition de premier Sprint dans I0 — non engagé

**Objectif proposé :** démontrer le lancement local et une première installation privée cohérente, persistée dans PostgreSQL.

Le périmètre est une proposition à affiner, pas un engagement de délai. I0 peut couvrir plusieurs Sprints. Eric déclare une disponibilité de **40 heures par semaine**. Cette disponibilité inclut préparation, développement, essais, revue et documentation ; elle ne constitue ni une estimation du backlog ni une vélocité mesurée.

**Cadence validée :** premier Sprint d'une semaine, sur la base de 40 heures nominales avant indisponibilités éventuelles. Eric confirme le 19 octobre 2026 à 22:48 (Europe/Paris) et demande le démarrage le plus tôt possible.

**Calendrier prévisionnel retenu :** du mardi 20 au lundi 26 octobre 2026 inclus (Europe/Paris), avec revue et rétrospective en fin de cycle. Le 20 octobre est retenu compte tenu du retour annoncé sur le PC ce jour-là ; aucune heure de début n'est inventée. Les 40 heures couvrent l'ensemble du travail et ne supposent pas de travailler le week-end.

Le premier travail porte sur la préparation I0 et la vérification de l'environnement Windows/PostgreSQL. La préparation documentaire peut continuer dès maintenant. PostgreSQL 18.6 est déclaré par Eric le 20 octobre ; le numéro serveur effectif, les droits et les dépendances compatibles restent à vérifier avant les essais concernés. Le périmètre livrable reste à affiner : aucune vélocité ni charge de Story n'est déduite des 40 heures. Cette inscription au calendrier ne crée ni ne démarre un Sprint Jira et ne vaut pas mandat de développement applicatif.

Ordre proposé des premières capacités :

1. Préparation technique et [premier travail](https://lmn24.atlassian.net/browse/SMN-11).
2. Si les prérequis et la capacité le permettent : [initialisation](https://lmn24.atlassian.net/browse/SMN-12).
3. Puis [accès privé](https://lmn24.atlassian.net/browse/SMN-14), selon préparation technique et capacité restantes.

Les noms et critères détaillés des US restent consultables par liens. Aucun ticket n'est déplacé dans un Sprint Jira, aucun Sprint n'est créé ou démarré.

### Travaux techniques inclus dans la préparation

- Fixer les correctifs/adaptateurs compatibles de la stack approuvée ADR-I0-001, avec installation reproductible et séparation du domaine.
- PostgreSQL 18.6 déclaré le 20 octobre : confirmer le serveur via `SHOW server_version;`, puis vérifier la connexion et les droits disponibles avant les essais DB.
- Définir et éprouver les migrations selon ADR-I0-002 ; secrets protégés dès la première connexion.
- Concevoir l'amorçage atomique et les contrôles de session, puis les tester lors des capacités concernées.
- Introduire les protections nécessaires à chaque écriture dès sa livraison ; ne pas attendre une interface administrative ultérieure pour protéger secrets, transactions et audit.
- Programmer les preuves PDF local et restauration de test au sein d'I0 ; ne pas charger le tout premier travail de la réalisation de tout le reporting ou de toute l'exploitation.

La complétude des Stories transverses n'est pas déclarée à partir de leur seule utilisation partielle : les capacités ultérieures restent backlog jusqu'à réalisation de leurs critères.

### Démonstration attendue, non observée

Démarrage sous compte Windows standard, diagnostic PostgreSQL sans secret exposé, persistance après redémarrage, produit fixe et équipe unique, un seul amorçage en concurrence, refus des accès privés anonymes et absence de faux succès. Les essais sur Linux ne remplacent pas les preuves Windows.

## 5. Réserves conservées et portes de sortie

| Réserve | Situation | Porte |
| --- | --- | --- |
| C1/C2 | Clarifications métier et producteurs documentés, Jira aligné | Ne pas rouvrir les décisions validées |
| C3 | Stack/principes validés, correctifs exacts et mécanismes encore à qualifier | Préparation et essais par capacité I0, pas de ready-for-dev automatique |
| C4 | Premier ordre proposé ; disponibilité déclarée de 40 h/semaine, charge non estimée | Affiner avant engagement du Sprint |
| PostgreSQL poste | 18.6 déclaré le 20 octobre ; serveur effectif, connexion et droits non vérifiés | Avant POC DB et verrouillage des outils |
| Récupération/cryptographie | Principes D-PRD-139 et ADR-I0-003 validés ; mécanismes non prouvés | Avant mise en service des capacités concernées |
| NFR et pilote | Protocoles/seuils et preuves à compléter | Avant acceptation technique et décision de pilote |

**Prochaine étape :** finaliser l'affinement du premier Sprint selon la capacité disponible, puis préparer le premier travail avec le workflow bmad-build sous mandat de construction distinct. Aucun développement n'est commencé par cette génération.
