# Installation native v32 — Étape 1 : extraction du schéma

## État
Ce lot introduit un **générateur de baseline**, non une baseline vérifiée et publiée.
Il ne modifie ni la base ni l'installateur actuel. La bascule n'est **pas** autorisée à ce stade.

## Génération sur le PC de développement
1. Mettre à jour `main`, sauvegarder la base de test, vérifier `pnpm db:diagnose`.
2. Installer ou localiser `pg_dump` PostgreSQL 18 (celui de la version portable convient).
3. Si nécessaire : `$env:SMN_PG_DUMP_PATH="C:\\chemin\\vers\\pg_dump.exe"`.
4. Lancer `pnpm db:baseline:v32 --generate`.
5. Inspecter `prisma/baseline/v32/schema.sql` avant de le versionner.

Le générateur refuse toute source non initialisée v32, toute histoire autre que 32 migrations terminées,
un dump contenant des données et l'écrasement d'une baseline divergente.
Le SQL généré inclut les **objets réellement présents** dans la base pilote, et non les tables
optionnelles jamais matérialisées. Il ne contient aucune ligne de données.

## Contrôles indispensables avant clôture de l'étape 1
- Inventorier les DDL applicatives et migrations présentes, y compris celles des modules
  jamais sollicités sur le poste de test.
- Comparer les relations, vues, index, fonctions, triggers, contraintes, types et séquences
  avec les contrats applicatifs et la sortie du diagnostic.
- Construire un SQL canonique indépendant des variations de données de test.
- Tester le SQL sur une base **vierge isolée**, puis vérifier que l'installation et les contrats
  d'une vraie v32 sont satisfaits.
- Définir les données initiales et une nouvelle entrée de baseline dans le journal des migrations.

Ne pas déclarer une installation native v32 utilisable tant que ces contrôles ne sont pas passés.
