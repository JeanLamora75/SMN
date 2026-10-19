# SMN — Architecture BMAD : espace de travail

**Agent :** Winston — System Architect.  
**Workflow :** bmad-architecture, Coaching Path.  
**Date :** 19 octobre 2026.  
**État :** domaine 1 validé ; accès/rôles/protection précisés et validés ; domaine 2 et architecture globale en cours de décision.

## Référence et portée

Branche documentaire : `docs/bmad-architecture-smn-20261019`, créée depuis le commit PRD `93f2eb87e45487b1d8044436728940ba3358841d` de `docs/bmad-prd-smn-20261018`.

- [PRD final et 81 FR](../../prds/prd-SMN-2026-10-18/prd.md)
- [Passation Winston et réserves](../../prds/prd-SMN-2026-10-18/handoff-architecture-winston.md)
- [Arbitrages D-PRD-130](../../prds/prd-SMN-2026-10-18/clarifications-d-prd-130.md)
- [Incréments I0–I6](../../prds/prd-SMN-2026-10-18/sequencement-mvp-d-prd-131.md)
- [Journal des décisions architecturales](.memlog.md)

Le PRD et les décisions fonctionnelles validées sont des contraintes. MVP Scrum/Kanban, SAFe/ART en v1.0 ; produit et mode fixes par installation. Bootstrap 5, interface responsive FR/EN et environnement Windows 11 sans administration ni IDE supplémentaire sont conservés.

## Organisation approuvée

| Ordre | Domaine | Résultat attendu |
|---|---|---|
| 1 | Structure générale | Paradigme, frontières métier, responsabilités et dépendances — validé |
| 2 | Exécution et stack | Local/hébergé, frontend/backend, persistance et démarrage |
| 3 | Données, temps et calculs | Modèle, calendriers/fuseaux, capacités, métriques, transitions après arrêt |
| 4 | Historique et échanges | Corrections, instantanés, imports, moteur HTML/PDF/TXT, A10/A12 |
| 5 | Sécurité et exploitation | Accès, confidentialité, sauvegarde/restauration, migrations, conservation, A11 |
| 6 | Vérification et transmission | Seuils A5, tests, couverture FR/incréments, revue finale BMAD |

Sécurité, intégrité et testabilité sont examinées transversalement dès les premiers domaines. Une validation globale est recueillie par domaine ; une hypothèse ne devient pas une décision métier.

## Livrables approuvés et destinataires

La documentation sert au porteur du projet et aux futurs agents de conception/développement pour préparer les Epics/Stories puis construire progressivement SMN.

- `.memlog.md` : mémoire append-only des décisions, justifications, contraintes et points ouverts ; aucun statut de cycle de vie dans ce journal.
- `ARCHITECTURE-SPINE.md` : contrat concis à distiller à la finalisation depuis les décisions validées, avec identifiants AD stables et champs Binds/Prevents/Rule. Ce fichier n'est pas encore produit.
- Annexes ciblées : modèle de données, temps/calculs, exploitation et stratégie de tests, au fil des arbitrages utiles.
- Matrice de traçabilité : FR, décisions architecturales, incréments et réserves.

## Domaine 1 — périmètre validé

Application déployée comme un ensemble : **monolithe modulaire**, avec séparation interface, orchestration applicative, règles métier et accès aux données.

| Module initial | Responsabilité |
|---|---|
| Installation et organisation | Produit, équipes, paramètres, vision, Product Goal, DoD/DoR |
| Membres et disponibilités | Fiches centrales, affectations, rôles, calendriers et absences |
| Cycles et événements | Sprints/périodes, génération, cérémonies, transitions et replanification |
| Objectifs et mesures | Objectifs, capacités, métriques sources, calculs et tendances |
| Registres qualitatifs | Six registres, relations et états historiques associés |
| Restitution et analyses | Sélection commune des données, rapports, briefs et analyses |

Accès protégé, audit et persistance : services transverses. Ces frontières internes ne prescrivent ni serveur par module ni schéma de tables définitif. Les décisions normatives et leur justification sont dans le journal (AD-1 à AD-6).

## Points restant ouverts

- Node.js et PostgreSQL installés et premiers essais déclarés par l'utilisateur : base de travail. Usage initial local sur PC personnel confirmé ; plateforme web ultérieure possible. Frameworks, versions, starter, accès aux données et procédure de lancement restent à choisir.
- A5 : objectifs techniques mesurables ; A12 : restitution des temporalités.
- A7/A8/A10/A11 : arbitrages métier réservés, à obtenir avant les fonctions concernées.
- A9 : imports Kanban sur cycles existants au MVP ; création rétrospective complète non engagée.
- Ouverture automatique et gel de capacité lorsque l'application était arrêtée : mécanisme et fidélité temporelle à concevoir ; aucun serveur permanent supposé.
- Vérifier la compatibilité Windows des dépendances et le scénario d'accès depuis tablette/smartphone avant de figer la stack.

## Méthode et vérifications

Skills Architecte et Architecture, personnalisations, configuration, template et sources projet consultés via GitHub. Adaptation explicite : journalisation par connecteur GitHub ; scripts de résolution et `memlog.py` non exécutés. Le choix Coaching et la finalité des livrables sont déjà approuvés.

Contrôle documentaire initial : FR-1 à FR-81 uniques et continues ; 131 identifiants de décisions D-PRD retrouvés dans le journal. Aucun test applicatif, benchmark, validation de compatibilité ou revue finale d'architecture n'est déclaré exécuté.

Toute recherche web nécessite une autorisation préalable. Le workflow demande de vérifier les technologies et leurs versions avant engagement : l'utilisateur a décliné cette recherche. Aucun choix de version ou compatibilité non vérifié ne sera présenté comme acquis.

Aucun développement applicatif, ticket Jira, modification de main ou fusion de PR autorisé par cette validation.

## Accès et comptes — précisions MVP validées le 19 octobre 2026

Références : FR-66/67/72, complétées explicitement par l'utilisateur ; AD-7 à AD-10 dans le journal.

| Fonction | Administrateur | Utilisateur identifié |
|---|---|---|
| Consultation des données collectives | Oui | Oui |
| Consultation et téléchargement des rapports/briefs autorisés | Oui | Oui |
| Création/modification/suppression métier | Oui, selon protections existantes | Non |
| Coordonnées, absences nominatives, capacités individuelles | Oui | Non |
| Administration, sauvegarde/restauration | Oui | Non |
| Formulaire de création de comptes et attribution du rôle | Oui, au MVP | Non |

L'authentification est obligatoire pour l'application, y compris l'accès direct aux fichiers. Exception : parcours d'installation initiale d'une instance vierge, limité localement et fermé après initialisation. Cette exception ne permet pas de consulter les données métier sans identification.

Le compte administrateur d'amorçage utilise l'identifiant exact demandé `admin@locahost.com`. Son secret temporaire convenu doit être changé avant l'accès métier ; il n'est jamais rétabli par redémarrage ou mise à jour. L'assistant Express/Guidé conserve les règles fonctionnelles validées.

La correction utilisateur autorise l'export des documents consultables. Interprétation annoncée : téléchargement de documents existants ; génération de nouveaux rapports/briefs réservée à l'administrateur, à préciser seulement si une extension est souhaitée. Cela ne tranche pas l'archivage systématique des PDF (A10).

Protection validée au niveau des principes : mots de passe hachés avec sel individuel, secrets hors dépôt/base, chiffrement authentifié ciblé des coordonnées et motifs d'absence. Choix cryptographiques précis, clés, copies historiques, documents et sauvegardes restent à concevoir.

Responsive également vérifié à terme sur fenêtre de PC redimensionnée, conformément à l'usage de juxtaposition indiqué par l'utilisateur. Aucun test applicatif n'est exécuté à cette étape.

## État de la publication architecturale — 19 octobre 2026

**Publication documentaire autorisée par l'utilisateur.** Les discussions de Winston ont validé les domaines données/calculs, calendrier/temps, historisation, reporting et sécurité/exploitation, avec **PostgreSQL obligatoire dès le MVP**. La branche existante a été reprise et les fichiers suivants sont désormais la documentation architecturale principale :

| Livrable | Objet | État |
| --- | --- | --- |
| [ARCHITECTURE-SPINE.md](ARCHITECTURE-SPINE.md) | Contrat BMAD des 30 AD stables et frontières des modules | Rédigé, `draft` en attente du Reviewer Gate complet |
| [DESIGN-TECHNIQUE.md](DESIGN-TECHNIQUE.md) | Modèle PostgreSQL, contrats, calculs, temps, instantanés, CSV, restituables | Rédigé, à éprouver |
| [SECURITE-EXPLOITATION.md](SECURITE-EXPLOITATION.md) | Accès, installation locale, sauvegardes, migrations, continuité et NFR | Rédigé, à éprouver |
| [REVUE-COHERENCE-TRACABILITE.md](REVUE-COHERENCE-TRACABILITE.md) | Verdict documentaire, 5 points prioritaires, couverture FR/AD/I0–I6, réserves et preuves attendues | Rédigé, tests non exécutés |
| [.memlog.md](.memlog.md) | Journal BMAD append-only des contraintes, validations et AD-1 à AD-30 | Complété sans effacer l'historique |

**Rectification de l'ancien statut en tête :** la mention « domaine 1 validé, architecture en cours » décrit l'état **avant** cette publication ; se reporter à la section présente et à la spine pour l'état actuel. Les choix d'architectures discutés sont traduits, mais il n'y a pas encore de code développé ni de validation d'exécution.

### Attention aux arbitrages non résolus

- **D-ROLES :** le journal initial définit deux rôles Administrateur/Utilisateur et autorise l'utilisateur à consulter/télécharger les documents. La proposition ultérieure mentionne trois rôles. Ne pas modifier implicitement ce modèle sans décision de rapprochement avant les Stories de comptes.
- **A7 / A8 / A10 / A11 :** matrice de risques, faits marquants auto, archivage PDF et suppression/anonymisation nécessitent une décision métier spécifique avant les développements concernés.
- **A5 / A9 / A12 :** NFR, reprise Kanban rétroactive complète et restitution multitemporelle restent dans le registre des réserves.
- **POC I0 :** confirmer Windows + PostgreSQL, migrations, authentification, rendu PDF local, sauvegarde/restauration et versions des bibliothèques.

**Méthode et limites :** lecture des référentiels et écriture via connecteur GitHub. Aucun changement sur `main`, Jira, code ou secrets. Les scripts `uv run`, `memlog.py`, `lint_spine.py`, les sous-agents BMAD Reviewer Gate et les tests locaux n'ont pas été exécutés ; la spine reste `draft` jusqu'à ces validations. Aucune recherche web avancée non autorisée n'a été lancée.
