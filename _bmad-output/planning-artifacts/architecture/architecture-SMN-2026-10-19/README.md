# SMN — Architecture BMAD : espace de travail

**Agent :** Winston — System Architect.  
**Workflow :** bmad-architecture, Coaching Path.  
**Date :** 19 octobre 2026.  
**État :** domaine 1 validé ; architecture globale en cours de décision.

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

- Stack, versions, starter, base de données, hébergement et mode concret d'installation : non choisis.
- A5 : objectifs techniques mesurables ; A12 : restitution des temporalités.
- A7/A8/A10/A11 : arbitrages métier réservés, à obtenir avant les fonctions concernées.
- A9 : imports Kanban sur cycles existants au MVP ; création rétrospective complète non engagée.
- Ouverture automatique et gel de capacité lorsque l'application était arrêtée : mécanisme et fidélité temporelle à concevoir ; aucun serveur permanent supposé.
- Vérifier la compatibilité Windows des dépendances et le scénario d'accès depuis tablette/smartphone avant de figer la stack.

## Méthode et vérifications

Skills Architecte et Architecture, personnalisations, configuration, template et sources projet consultés via GitHub. Adaptation explicite : journalisation par connecteur GitHub ; scripts de résolution et `memlog.py` non exécutés. Le choix Coaching et la finalité des livrables sont déjà approuvés.

Contrôle documentaire initial : FR-1 à FR-81 uniques et continues ; 131 identifiants de décisions D-PRD retrouvés dans le journal. Aucun test applicatif, benchmark, validation de compatibilité ou revue finale d'architecture n'est déclaré exécuté.

Toute recherche web nécessite une autorisation préalable. Le workflow demande de vérifier les technologies et leurs versions avant engagement : cette recherche reste à autoriser pour le domaine 2.

Aucun développement applicatif, ticket Jira, modification de main ou fusion de PR autorisé par cette validation.
