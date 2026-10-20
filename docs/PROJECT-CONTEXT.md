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
- Un produit de référence unique et fixe par installation ; mode fixe. **Une seule équipe Scrum/Kanban par installation au MVP** ; plusieurs équipes dans le train SAFe v1.0. Autre produit : autre installation.

## 3. Règles cardinales validées

- Deux profils MVP : **Administrateur et Utilisateur**. Le Scrum Master est Administrateur de son installation.
- Authentification obligatoire après la première installation vierge. Création des comptes depuis l'administration.
- Administrateur : saisie, gestion, génération et opérations sensibles autorisées. Utilisateur : lecture des données collectives et téléchargement des PDF/TXT autorisés ; pas de mutation, génération ni accès aux données individuelles sensibles. Autorisations côté serveur.
- **Vision, Product Goal, DoD et DoR rattachés à l'équipe en Scrum/Kanban, au train en SAFe** (D-PRD-137), contenus facultatifs et versions conservées. Stories productrices : 3.24/SMN-221 et 3.25/SMN-222, consommées par 6.9/SMN-120.
- Membres Agile distincts des comptes. Affectations, rôles et disponibilités historisés ; capacité en JH, aucune conversion SP/JH ni déduction automatique du temps des cérémonies.
- Indicateurs chiffrés facultatifs ; absence de valeur distincte de zéro. Dépassement des SP engagés accepté avec signalement éventuel.
- Génération des cycles à la demande, par lots limités au MVP à six Sprints ou six périodes Kanban ; règles spécifiques SAFe différées.
- Clôture volontaire et instantanés versionnés ; reclôture sans écraser les versions et documents antérieurs.
- Six registres : risques, obstacles, dépendances, décisions, actions et faits marquants. ROAM indépendant de la criticité ; matrice 3×3 fixe selon D-PRD-132.
- Rapports MVP : prévisualisation HTML et export PDF ; PDF réussi archivé automatiquement, pas de purge automatique par ancienneté.
- Briefs IA TXT : données collectives autorisées, échange manuel avec l'IA, texte archivé exact et analyses identifiées. Pas de transmission API automatique.
- Sauvegardes gérées : 30 jours par défaut, paramétrables. Effacement exceptionnel contrôlé ; historique et restauration traités selon D-PRD-135.
- Interface française et anglaise, Bootstrap 5, thèmes clair/sombre, usages ordinateur/tablette/smartphone.
- **Décision transversale obligatoire du 20/10/2026 : tous les textes standards visibles et exportables doivent provenir d'un fichier JSON par langue** (`src/i18n/fr.json`, `src/i18n/en.json` comme architecture cible ; pas encore implémentée). Aucun texte d'interface codé en dur dans TSX/JSX, aucun `lang === "en" ? "texte" : "texte"` ; toute Story doit enrichir les deux catalogues, utiliser des clés stables et respecter le repli français. Les contenus libres des utilisateurs ne sont pas traduits. [ADR-I0-004](../_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ADR-I0-004-I18N-JSON.md), [Story 1.14/SMN-27](https://lmn24.atlassian.net/browse/SMN-27).

## 4. Architecture et contraintes

**Décidé :** monolithe modulaire TypeScript, PostgreSQL dès le MVP, domaine indépendant des adaptateurs, transactions des opérations atomiques, stockage privé et contrôle serveur des accès.

**À démontrer :** versions et choix finaux des bibliothèques, serveur local/packaging, migrations, PDF, sauvegarde/restauration, concurrence et reprise temporelle. Next.js 16/React 19, Prisma 7, Better Auth et Playwright/Chromium local sont désormais retenus sous réserve des essais I0, selon ADR-I0-001 (19/10 à 22:29) ; aucun numéro de correctif n'est verrouillé. Aucun seuil NFR indicatif ne doit être présenté comme accepté ou mesuré.

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

Le [contrôle Sprint Planning](../_bmad-output/planning-artifacts/implementation-readiness.md) aboutit à **CONCERNS** ; la poursuite sous réserves a été explicitement autorisée le 19/10 à 22:41. Le [suivi BMAD](../_bmad-output/implementation-artifacts/sprint-status.yaml) est généré et validé ; les 212 Stories restent backlog. Le contrôle initial rapprochait 210 Stories et 1 052 AC. Après D-PRD-137, le backlog comprend 212 Stories ; les politiques D-PRD-138/139 portent les critères GWT documentés à 1 071 : C1/C2 traités par clarification, correction des Stories et ajout des deux producteurs. C3/C4 restent ouverts ; le verdict ne devient pas PASS automatiquement. Premier travail futur : préparation technique I0 puis SMN-11, sous mandat de construction distinct. La clarification D-PRD-137 est publiée dans les tickets concernés sur demande explicite ; aucune implémentation n'est engagée.

## 6. Maintenance

Actualiser ce contexte et [l'état BMAD](ETAT-PROJET-BMAD.md) après chaque jalon. Conserver les décisions historiques et ajouter des amendements identifiables ; ne pas renuméroter les F, D-PRD ou AD. Une consolidation documentaire ne démontre ni implémentation, ni conformité, ni aptitude au pilote.



**Stack actualisée le 19/10/2026 à 22:29 :** [ADR-I0-001](../_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ADR-I0-001-STACK.md). Les choix sont validés sous réserve I0, les essais et l'épinglage exact restent à faire ; aucune fusion ni construction lancée.


**Migrations et secrets, accord du 19/10/2026 à 22:32 :** [ADR-I0-002](../_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ADR-I0-002-MIGRATIONS-SECRETS.md). Base dédiée, migrations versionnées contrôlées et secrets privés validés ; copie protégée des clés à prévoir, mécanisme à préciser. Les vérifications et essais restent ouverts.


**Sprint Planning — jalon du 19/10 à 22:41 :** [compte rendu et premier Sprint proposé](../_bmad-output/planning-artifacts/sprint-planning-2026-10-19.md). CONCERNS maintenu avec poursuite autorisée ; aucun travail marqué prêt ou réalisé. Durée, capacité et dates restent à renseigner avant engagement.

## Décision technique complémentaire — ports HTTP locaux (20 octobre 2026)

- Un **autre projet existant** utilise déjà `http://localhost:3000`, `http://localhost:3001` et `http://localhost:3002` : **SMN ne doit ni démarrer ni reprendre ces ports**, et ne doit pas modifier la configuration de l'autre projet.
- Les commandes `pnpm dev` et `pnpm start` démarrent **SMN sur 127.0.0.1:3003 par défaut**. Le port est paramétrable localement par `SMN_PORT` (par exemple 3010), mais les valeurs 3000 à 3002 sont refusées explicitement.
- Si le port 3003 est occupé, aucune bascule automatique sur les ports de l'autre projet : diagnostiquer le conflit et laisser l'utilisateur choisir un port libre.
- [Procédure Windows et contrôle de coexistence](../docs/INSTALLATION.md). La CI a testé simultanément un serveur sur 3000 et SMN sur 3003 ; les preuves Windows restent à obtenir.


## Convention de développement pendant le pilote (décision utilisateur du 20/10/2026)

- **Branche de livraison : `main` uniquement** pour les prochains incréments pilotes : modification et publication directes, sans exiger de branches temporaires ni de Pull Requests. Les anciennes PR ont été traitées : [PR nº 11](https://github.com/JeanLamora75/SMN/pull/11) fusionnée, [PR nº 7](https://github.com/JeanLamora75/SMN/pull/7) clôturée car le Product Brief était déjà intégralement sur `main` avec complément postérieur.
- Cette simplification **ne désactive pas l'historique Git** : conserver les commits pour revenir à un état stable si besoin, maintenir Jira/BMAD et les tests CI, ne jamais déclarer un changement terminé sans preuve.
- Après chaque livraison, l'utilisateur récupère **`main` via GitHub Desktop** avec `Fetch origin`, puis `Pull origin` ; aucune commande `git` en PowerShell n'est requise.
- **Précaution inchangée** : création de base et migrations destructives uniquement après confirmation explicite et contrôle des droits, jamais d'accès ou de changement dans LMN24. Le mode direct sur `main` ne vaut pas autorisation de manipuler les données locales.
- **État à date** : SMN-11 terminé ; SMN-12 intégré à `main`, Jira/BMAD encore en revue avant retour de recette réelle Windows/PostgreSQL 18.6 ; SMN-14 pour l'authentification, SMN-19 pour les secrets persistants.


## Préparation technique de SMN-27 — 20 octobre 2026

La mise en place du socle internationalisé est spécifiée dans [le dossier BMAD de SMN-27](../_bmad-output/implementation-artifacts/spec-smn-27-socle-i18n-json.md) et [le plan opérationnel de migration](I18N-IMPLEMENTATION-PLAN.md). La décision [ADR-I0-004](../_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ADR-I0-004-I18N-JSON.md) demeure obligatoire. **Les catalogues `fr.json` et `en.json` ne sont pas encore créés et aucun composant n'a été migré.** Jira SMN-27 reste À faire tant que le développement n'est pas commencé et les dépendances/CI restent à vérifier. L'application utilise aujourd'hui une locale navigateur pour le layout, malgré la présence d'une préférence `locale` conservée en base ; cette divergence sera corrigée dans SMN-27.


## Suivi du lot SMN-27 — 20 octobre 2026

Le socle i18n JSON FR/EN et la migration des écrans existants (public, installation, tableau de bord, administration, sécurité) ont été **codés sur la branche de travail** [PR nº 15](https://github.com/JeanLamora75/SMN/pull/15), et **non fusionnés dans `main`**. La règle ADR-I0-004 reste obligatoire pour toutes les futures Stories. La CI GitHub Actions bloque avant l'affectation des jobs et **ne permet pas d'attester les tests** ; Jira SMN-27 est en cours, pas terminé. Les affirmations plus haut décrivant des fichiers encore « non créés » correspondent à l'état de `main` avant fusion.
