# Scrum Master Notebook — Contexte de référence du projet

**Dernière consolidation : 19 octobre 2026.** Ce document est le point d'entrée des nouvelles conversations. Les règles détaillées résident dans le PRD, ses décisions et l'architecture ; Jira reste la référence des tickets.

## 1. Lecture de reprise et ordre de référence

| Ordre | Document | Utilisation |
| --- | --- | --- |
| 1 | [État du projet et de BMAD](ETAT-PROJET-BMAD.md) | Avancement, réserves et prochaine étape |
| 2 | [Index BMAD](../_bmad-output/planning-artifacts/README.md) | Accès aux livrables |
| 3 | [PRD final](../_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/prd.md) et ses annexes | Besoins, 81 FR, critères et périmètre |
| 4 | [Arbitrages D-PRD-132 à 136](../_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/arbitrages-metier-valides-2026-10-19.md) | Décisions métier finales, dont deux rôles MVP |
| 5 | [Architecture Spine](../_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ARCHITECTURE-SPINE.md) | Contrat architectural AD-1 à AD-31 |
| 6 | [Epics et Stories](../_bmad-output/planning-artifacts/epics.md) et [Jira](https://lmn24.atlassian.net/jira/software/projects/SMN) | Découpage final et suivi opérationnel |

Les [124 décisions F](DECISIONS-FONCTIONNELLES.md) et le [cadrage initial](CADRAGE-FONCTIONNEL.md) restent conservés. Les décisions D-PRD ultérieures prévalent sur leurs hypothèses et points alors ouverts. Les anciennes revues et journaux décrivent leur état à une date donnée ; une mention historique « ouvert » ne réouvre pas un arbitrage validé.

## 2. Vision et trajectoire

SMN est un carnet de bord professionnel pour préparer, expliquer et produire à la demande des reportings complets et contextualisés, avec le moins de saisie possible. Le Scrum Master renseigne l'outil ; les équipiers ne doivent pas y saisir leurs tickets.

- **MVP : Scrum et Kanban**, usage personnel local sur PC, application web responsive FR/EN.
- **Version 1.0 : SAFe et ART**, sans introduire leurs fonctions dans le MVP.
- Pilote après démonstration des cinq conditions cumulatives du PRD et décision humaine ; diffusion plus large selon les retours d'usage.
- Un produit de référence unique et fixe par installation ; mode fixe. Autre produit : autre installation.

## 3. Règles cardinales validées

- Deux profils MVP : **Administrateur et Utilisateur**. Le Scrum Master est Administrateur de son installation.
- Authentification obligatoire après la première installation vierge. Création des comptes depuis l'administration.
- Administrateur : saisie, gestion, génération et opérations sensibles autorisées. Utilisateur : lecture des données collectives et téléchargement des PDF/TXT autorisés ; pas de mutation, génération ni accès aux données individuelles sensibles. Autorisations côté serveur.
- Membres Agile distincts des comptes. Affectations, rôles et disponibilités historisés ; capacité en JH, aucune conversion SP/JH ni déduction automatique du temps des cérémonies.
- Indicateurs chiffrés facultatifs ; absence de valeur distincte de zéro. Dépassement des SP engagés accepté avec signalement éventuel.
- Génération des cycles à la demande, par lots limités au MVP à six Sprints ou six périodes Kanban ; règles spécifiques SAFe différées.
- Clôture volontaire et instantanés versionnés ; reclôture sans écraser les versions et documents antérieurs.
- Six registres : risques, obstacles, dépendances, décisions, actions et faits marquants. ROAM indépendant de la criticité ; matrice 3×3 fixe selon D-PRD-132.
- Rapports MVP : prévisualisation HTML et export PDF ; PDF réussi archivé automatiquement, pas de purge automatique par ancienneté.
- Briefs IA TXT : données collectives autorisées, échange manuel avec l'IA, texte archivé exact et analyses identifiées. Pas de transmission API automatique.
- Sauvegardes gérées : 30 jours par défaut, paramétrables. Effacement exceptionnel contrôlé ; historique et restauration traités selon D-PRD-135.
- Interface française et anglaise, Bootstrap 5, thèmes clair/sombre, usages ordinateur/tablette/smartphone.

## 4. Architecture et contraintes

**Décidé :** monolithe modulaire TypeScript, PostgreSQL dès le MVP, domaine indépendant des adaptateurs, transactions des opérations atomiques, stockage privé et contrôle serveur des accès.

**À démontrer :** versions et choix finaux des bibliothèques, serveur local/packaging, migrations, PDF, sauvegarde/restauration, concurrence et reprise temporelle. React/Next.js restent candidats sous réserve des vérifications I0. Aucun seuil NFR indicatif ne doit être présenté comme accepté ou mesuré.

Poste Windows 11 sans droits administrateur ; Node.js, npm, pnpm, PowerShell et GitHub Desktop disponibles selon déclaration utilisateur. Pas d'installation d'IDE ni dépendance à Codex CLI. Ne pas imposer Docker. Ne pas publier de secrets ou configuration personnelle.

## 5. Méthode et collaboration

- BMAD Method 6.12.4 ; lire le `SKILL.md` demandé depuis `.agents/skills/` et ses références nécessaires.
- Exploiter les connecteurs ; expliquer les adaptations et ne jamais annoncer un script, test ou Reviewer Gate non exécuté.
- Français pour échanges et livrables ; les instructions utilisateur prévalent sur les valeurs de langue de la configuration.
- Réutiliser les décisions validées, distinguer faits, hypothèses et recommandations.
- Jira : rédiger besoin, critères, dépendances et impacts ; obtenir l'autorisation avant écriture sauf mandat explicite contraire.
- GitHub : consulter l'existant, privilégier branches dédiées et PR, vérifier avant déclaration d'achèvement.
- Toute modification fonctionnelle structurante demande validation ; aucune nouvelle exigence implicite.
- Toute recherche web avancée requiert un accord préalable.

## Contrôle de préparation du 19 octobre 2026

Le [contrôle Sprint Planning](../_bmad-output/planning-artifacts/implementation-readiness.md) aboutit à **CONCERNS** ; le suivi n’est pas généré avant le choix requis par le gate. Les 210 Stories et leurs 1 052 AC correspondent structurellement à Jira, mais cela ne résout pas les lacunes de couverture sémantique identifiées. Premier travail futur : préparation technique I0 puis SMN-11, sous mandat de construction distinct. Aucun ticket Jira ni décision fonctionnelle modifié.

## 6. Maintenance

Actualiser ce contexte et [l'état BMAD](ETAT-PROJET-BMAD.md) après chaque jalon. Conserver les décisions historiques et ajouter des amendements identifiables ; ne pas renuméroter les F, D-PRD ou AD. Une consolidation documentaire ne démontre ni implémentation, ni conformité, ni aptitude au pilote.

