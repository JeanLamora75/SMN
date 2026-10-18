# Scrum Master Notebook — Contexte de référence du projet

> Version initiale : 18 octobre 2026  
> Statut : synthèse des échanges de cadrage ; les éléments marqués « à préciser » ne sont pas des décisions arrêtées.  
> Objectif : fournir un point d'entrée durable aux conversations ChatGPT et aux agents BMAD.  
> Ce document ne remplace ni le Product Brief, ni le PRD, ni l'architecture, ni les tickets Jira.

## 1. Vision du produit

**Scrum Master Notebook (SMN)** est une application de travail pour les **Scrum Masters (SM)** et les **Release Train Engineers (RTE)**. Elle doit faciliter la préparation, le suivi et la restitution des activités Agile, de l'équipe Scrum jusqu'à l'Agile Release Train (ART) en SAFe.

La priorité est de **produire un reporting aussi exhaustif et exploitable que possible à destination des parties prenantes**, tout en **réduisant au minimum la saisie manuelle**.

## 2. Principes fonctionnels validés

| Référence | Décision | État |
| --- | --- | --- |
| F-01 | L'application est principalement utilisée et renseignée par le SM ou le RTE, et n'a **pas vocation à être partagée avec les membres des équipes**. | Validé |
| F-02 | L'application proposera **un mode Scrum et un mode SAFe**. | Validé |
| F-03 | Le mode Scrum gère des équipes Scrum ; le mode SAFe doit gérer des **ART composés d'équipes Scrum**. | Validé (détails à préciser) |
| F-04 | Les membres d'une même équipe peuvent travailler dans **des villes ou des pays différents**. | Validé |
| F-05 | Une fonctionnalité de **gestion de l'équipe et de ses membres** est nécessaire. | Validé (attributs et règles à préciser) |
| F-06 | Un **calendrier d'équipe** et les **événements Agile** doivent être pris en charge. | Validé (règles détaillées à préciser) |
| F-07 | Les **Daily Scrums doivent être générés par défaut comme ayant lieu** ; le SM notera les exceptions lorsque le Daily n'a pas lieu. | Validé |
| F-08 | Un suivi des **chiffres et métriques de sprint** est attendu. La saisie doit rester peu contraignante ; certaines données pourront être **reportées depuis Jira en fin de sprint** plutôt que ressaisies au fil de l'eau. | Orientation validée ; liste des métriques à préciser |
| F-09 | La gestion des **risques et dépendances** fait partie du périmètre retenu. | Validé (modèles et processus à préciser) |
| F-10 | Le reporting pour les parties prenantes est un objectif central ; il devra exploiter les informations des équipes, sprints, événements, risques et dépendances. | Validé (formats, indicateurs et destinataires à préciser) |

### Décisions de périmètre

- D'autres idées d'enrichissement du reporting ont été évoquées, mais **elles ne sont pas toutes retenues**. Ne pas les introduire comme exigences validées sans un nouvel arbitrage.
- Préférer l'automatisation, les valeurs par défaut, la détection des exceptions et la réutilisation de données existantes plutôt que des formulaires de saisie systématiques.
- Distinguer clairement le **fonctionnement de l'application SMN** de l'**organisation du projet de développement SMN**.

## 3. Domaines fonctionnels à spécifier

### Gestion des équipes

- Constitution et suivi d'équipes Scrum et de leurs membres.
- Prise en compte de membres répartis dans différentes villes et différents pays.
- **À préciser :** données individuelles nécessaires, fuseaux horaires, rôles, disponibilités, historique des affectations et règles de confidentialité.

### Gestion SAFe

- Mode SAFe avec ART regroupant plusieurs équipes Scrum.
- **À préciser :** périmètre des événements ART, PI Planning, coordination interéquipes et reporting transverse.

### Calendrier et événements

- Calendrier associé à l'équipe et suivi des événements Agile.
- Génération par défaut des Daily Scrums ; enregistrement des exceptions lorsqu'un Daily n'a pas eu lieu.
- **À préciser :** autres cérémonies, récurrence, jours fériés, absences, calendriers locaux et ajustements multisites.

### Sprint et indicateurs

- Suivi chiffré des sprints avec effort de saisie minimal.
- Possibilité de reporter certaines métriques issues de Jira à la fin du sprint.
- **À préciser :** indicateurs, définitions, provenance des valeurs, intégration automatique ou manuelle de Jira, et règles de consolidation.

### Risques et dépendances

- Suivi des risques et des dépendances au niveau adapté à l'équipe et/ou à l'ART.
- **À préciser :** catégories, niveaux de criticité, propriétaires, échéances, liens entre équipes et indicateurs de reporting.

### Reporting

- Restitutions destinées aux parties prenantes, recherchées comme exhaustives sur le périmètre retenu.
- **À préciser :** tableaux de bord, historique, exports, périodicité, vues Scrum / SAFe et indicateurs clés.

## 4. Questions encore ouvertes

1. Définition du MVP et séquencement des fonctionnalités.
2. Modèle exact des équipes, membres, rôles et ART.
3. Règles du calendrier pour des équipes multisites et des fuseaux horaires différents.
4. Liste et calcul des métriques de sprint.
5. Modalités d'import ou de synchronisation des données Jira.
6. Modèle et cycle de vie des risques et dépendances.
7. Contenu, filtres et formats des reportings.
8. Architecture applicative, technologies et schéma de données : **aucun choix technique applicatif n'est acté dans ce document**.
9. Gestion des accès, persistance et déploiement : à concevoir.

## 5. Référentiels et outillage du projet

| Domaine | Référence |
| --- | --- |
| Dépôt de code, architecture et BMAD | [GitHub — JeanLamora75/SMN](https://github.com/JeanLamora75/SMN) |
| Backlog, Epics, Stories, bugs et tâches | [Jira — SMN](https://lmn24.atlassian.net/jira/software/projects/SMN) |
| Méthodologie | BMAD Method **v6.12.4** |
| Skills BMAD | `.agents/skills/` |
| Configuration et scripts BMAD | `_bmad/` |
| Livrables de planification | `_bmad-output/planning-artifacts/` |
| Livrables d'implémentation | `_bmad-output/implementation-artifacts/` |
| Connaissance du projet | `docs/` |
| Langue de conversation et des livrables | **Français** |

L'installation BMAD a été effectuée en générant les skills sous `.agents/skills/` via la cible Codex ; **cela n'implique pas que Codex CLI soit installé**.

## 6. Contraintes de développement

- Poste Windows 11 d'entreprise, **sans droits administrateur**.
- Pas de VS Code, d'autre IDE ou de Codex CLI à installer.
- Outils disponibles : Node.js, npm, pnpm, PowerShell et **GitHub Desktop**.
- Le binaire Git intégré à GitHub Desktop peut être rendu accessible temporairement dans PowerShell.
- Les agents BMAD sont employés **depuis ChatGPT**, en consultant leurs `SKILL.md` et leurs références sur GitHub. Ce mode est une **adaptation des workflows**, pas une intégration native de BMAD à ChatGPT Web.
- Les fonctionnalités nécessitant `uv` ou un moteur local ne doivent pas être déclarées exécutées sans exécution et vérification réelles.

## 7. Conventions de collaboration et de traçabilité

1. Au démarrage d'une mission, consulter ce document puis le `SKILL.md` de l'agent et les livrables pertinents.
2. Traiter les **faits vérifiés**, les **décisions validées**, les **hypothèses** et les **questions ouvertes** séparément.
3. Formaliser et faire valider les décisions structurantes ; les reporter ensuite dans GitHub et/ou Jira.
4. Avant toute création ou modification de User Story Jira, rédiger besoin, critères d'acceptation, dépendances et impacts, puis demander l'accord de l'utilisateur sauf autorisation explicite.
5. Avant tout développement, examiner le code existant, privilégier une branche dédiée et une Pull Request ; effectuer les vérifications possibles et ne pas déclarer de résultat non testé.
6. Ne jamais publier de secrets ni de configurations personnelles (notamment `config.user.toml`).
7. Pour le passage entre conversations et agents, s'appuyer sur les livrables versionnés plutôt que sur la mémoire présumée des conversations.
8. Aucun agent ne doit créer de nouvelles exigences fonctionnelles implicites en transformant une simple idée en décision acquise.

## 8. État du projet au 18 octobre 2026

- Dépôt GitHub SMN et projet Jira SMN créés.
- BMAD Method v6.12.4 installé ; **29 fichiers `SKILL.md`** détectés localement et synchronisés sur GitHub.
- Instructions du projet ChatGPT configurées pour utiliser BMAD, GitHub et Jira.
- Cadrage fonctionnel initial amorcé ; **Product Brief, PRD, architecture et backlog détaillé restent à élaborer**.
- Étape recommandée : lancer le travail de l'agent **Analyst** pour formaliser le Product Brief à partir des décisions ci-dessus, puis faire valider le périmètre avant le PRD.

## 9. Maintenance de ce document

Mettre à jour ce fichier lorsqu'une décision transversale est validée ou remplacée, avec une référence à la discussion, au livrable BMAD ou au ticket Jira correspondant lorsque disponible. Préférer les documents de spécification détaillés pour les règles précises et garder ce fichier comme **index synthétique et durable**.
