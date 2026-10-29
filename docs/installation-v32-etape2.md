# Installation native SMN v32 — étape 2

## Nouvelle règle métier

Aucun choix Scrum/Kanban au niveau de l'installation.
Aucune équipe n'est créée automatiquement.
Le mode Agile sera configuré lors de la création de chaque équipe.

## Modifications

- Le formulaire `/welcome` ne collecte plus le mode, le produit ni l'équipe.
- Le contrat d'installation accepte uniquement les informations administrateur.
- `installExpress` cible la baseline SQL v32 plutôt que la migration v1.
- Un fichier `prisma/baseline/v32/schema.sql` absent ou incompatible bloque l'installation.
- L'accès à une base déjà utilisée ne déclenche jamais une réinitialisation silencieuse.

## Limites connues avant la mise en service

1. Le fichier SQL de baseline n'a pas encore été produit ni contrôlé sur une base vierge.
2. La baseline extraite de l'ancien schéma contient potentiellement la colonne
   globale `smn_installation.mode`, à retirer par une migration de conception contrôlée.
3. Le diagnostic doit reconnaître l'unique marqueur `smn_v32_native_baseline`
   avant qu'une installation native v32 puisse être déclarée terminée (étape 3).
4. Les parcours initiaux dépendant de la présence d'une équipe devront gérer
   une installation sans équipe.
5. La compatibilité de la suite de tests historique avec l'ancien contrat reste à traiter.

Ne pas utiliser la nouvelle installation pour initialiser une base réelle tant que
les points 1 à 4 ne sont pas validés sur une base isolée. La base pilote existante
n'est pas touchée par ces changements de code.

## Étape 3 — contrôle du diagnostic natif

Le diagnostic reconnaît maintenant deux historiques distincts :
- la chaîne historique des 32 migrations, laissée inchangée ;
- une entrée unique `smn_v32_native_baseline`, uniquement lorsque son checksum
  correspond au fichier SQL v32, que le schéma a la version 32 et que les contrôles
  de structure essentiels réussissent.

Le verrou permanent a été remplacé par un contrôle de baseline à l'exécution.
**À ce jour le fichier SQL de référence est absent du dépôt**, donc le refus
`baseline-v32-unavailable` reste le comportement attendu. Aucune installation
native réussie n'a été observée ni validée sur une base PostgreSQL vierge.

La prochaine validation doit produire la baseline, contrôler les DDL des modules
optionnels et réaliser une installation de recette isolée.
