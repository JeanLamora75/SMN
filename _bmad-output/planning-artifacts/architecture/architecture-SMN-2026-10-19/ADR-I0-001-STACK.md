# ADR-I0-001 — Stack MVP validée sous réserve des essais I0

**Date :** 19 octobre 2026, 22:29 (Europe/Paris).
**Statut :** choix technologiques validés explicitement par l'utilisateur ; qualification pratique et versions exactes non achevées.
**Source :** validation de la proposition de stack en conversation ; [qualification documentaire](../../qualification-documentaire-stack-i0.md).

| Composant | Choix retenu | Qualification restante |
| --- | --- | --- |
| Langage | TypeScript | Version exacte compatible à épingler |
| Runtime | Node.js 24 LTS ; 24.21.0 déclaré sur le poste comme point de départ | Présence effective et démarrage Windows |
| Dépendances | pnpm ; 12.10.0 déclaré sur le poste | Installation reproductible et verrouillage du projet |
| Application | Next.js 16 App Router + React 19 | Correctifs compatibles à figer ensemble ; build et lancement local |
| Présentation | Bootstrap 5.3 | Correctif exact ; pas de Tailwind ajouté |
| Base | PostgreSQL local supporté | Numéro serveur et clients à confirmer |
| Accès aux données | Prisma ORM 7 | Correctif, adaptateur PostgreSQL, précision numérique, transactions et contraintes SQL |
| Authentification | Better Auth avec sessions en PostgreSQL | Version/adaptateur, politiques D-PRD-138/139 et autorisations serveur |
| PDF | Playwright avec Chromium local | Versions et binaires, téléchargement/lancement sans droits supplémentaires, fidélité HTML/PDF |

Le MVP conserve un seul ensemble applicatif ; aucun serveur NestJS supplémentaire n'est ajouté. Les modules métier TypeScript demeurent indépendants de Next.js, React, Prisma et Better Auth. L'authentification technique ne remplace pas l'autorisation métier ni le contrôle de confidentialité des projections.

## Portée de l'accord

La validation porte sur les choix technologiques du tableau, **sous réserve des essais I0**. Elle ne prouve ni la compatibilité exacte des versions ni le fonctionnement sur le poste. Aucun lockfile ou code applicatif n'est créé par cette décision documentaire.

La bibliothèque temporelle et l'outillage de tests unitaires restent à sélectionner ; Playwright n'est pas présenté comme remplaçant tous les niveaux de tests.

## Conditions et conséquences

- Relever la version serveur PostgreSQL et les versions des outils de sauvegarde ; cette information peut attendre le retour au poste.
- Éprouver les prérequis Windows de la configuration Prisma retenue, sans imposer une installation avec élévation.
- Distinguer génération de migrations et application de migrations versionnées ; base temporaire de développement strictement distincte des données utilisateur.
- Figurer et tester le contrat de sessions : 8 h absolues, 30 min d'inactivité, sans « Se souvenir de moi » ; récupération locale selon D-PRD-139, contrôles techniques encore à spécifier.
- Qualifier build de production et lancement loopback, POC PDF et sauvegardabilité ; ne pas assimiler documentation et preuve.
- Si un choix échoue aux contraintes, documenter le constat et proposer un remplacement ; ne pas changer silencieusement le framework ou l'ORM validé.

Les anciennes mentions de ces composants comme simples candidats décrivent l'état antérieur à cette validation. Cette ADR et la table Stack actualisée de la spine prévalent.

**Suite :** préciser le protocole de migrations PostgreSQL et l'organisation des secrets. **C3 reste ouvert pour les preuves et les mécanismes manquants ; C4 reste ouvert pour le séquencement.** Aucun PASS, suivi de Sprint, développement, recette ou fusion n'est attesté par cet accord.
