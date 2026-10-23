# SMN — Décision MVP : cérémonies exclusivement issues des modèles actifs

**23 octobre 2026 — Décision fonctionnelle exprimée par l'utilisateur ; implémentation proposée sur branche dédiée.**
**Agents concernés :** Winston (architecture), Sally (UX) et Amelia (développement). 
**Statut :** code publié en branche pilote, validation locale utilisateur et migration PostgreSQL non attestées.

## 1. Règle métier approuvée

- Un nouveau Sprint Scrum génère **exclusivement** les occurrences des modèles de cérémonie **actifs** de l'équipe.
- L'application ne crée plus par un moteur séparé de Planning, Daily, Review ou Rétrospective « obligatoires ».
- **Aucun enrichissement des modèles en règles de durée variable, positionnement relatif ou exception pour le MVP.** Seulement les champs existants : nom, fréquence (daily/weekly/sprint), jour ou début/fin, heure, durée fixe, activation, révision.
- Pendant l'installation Scrum, insérer 4 modèles initiaux configurables, actifs, à revoir par l'administrateur avant génération : Sprint Planning (début, 09:30, 120 min), Daily Scrum (jours de semaine, 09:00, 15 min), Sprint Review (fin, 15:00, 60 min), Sprint Retrospective (fin, 16:30, 60 min).
- Ce sont des **valeurs de départ modifiables**, non une nouvelle norme Scrum gravée dans le code. Exemple : Daily le premier jour possible, pas d'exception obligatoire ; la pause déjeuner et les timeboxes variables ne sont pas déduites pour les modèles.
- Désactiver tous les modèles permet de créer des Sprints sans occurrence automatique.
- Aucun ancien Sprint ni ancienne cérémonie n'est réécrit, migré ou effacé, même si son origine était « standard ». Changer/désactiver un modèle ne modifie aucune occurrence déjà enregistrée.
- En reprise historique, le choix explicite de générer les cérémonies reste **désactivé par défaut** ; si activé, seules les occurrences des modèles actifs sont produites, marquées `reconstructed` sans prétendre une tenue.
- Les réunions exceptionnelles créées manuellement restent indépendantes.

## 2. Impacts sur le code

- `ceremony-templates.ts` : catalogue de 4 defaults et initialisation idempotente pour les installations nouvelles.
- `install.ts` : création initiale des quatre modèles en mode Scrum seulement.
- Migration PostgreSQL `20261023_smn232_template_only_defaults` : insertion des quatre modèles manquants pour les installations Scrum **déjà initialisées**. Elle ne modifie aucune table d'occurrences.
- `ceremonies.ts` : point d'entrée de génération redirigé uniquement vers `saveTemplateOccurrences`. L'ancien calcul standard est conservé sans appel dans la génération ordinaire/historique.
- `wizard.ts`, `creation.ts`, `batch-confirm.ts` : points d'entrée inchangés ; ils appellent déjà le point d'entrée commun de génération et bénéficient de cette correction.
- `/api/team-calendar/meetings` : ajoute la catégorie de réunion `template` ; `/app/team-calendar/meeting/template/[id]` affiche la fiche.
- Détection de conflits : modèle inclus dans avertissements de chevauchement et calendrier des fermetures.
- Anciens types `standard` restent supportés en lecture/édition/historique afin de préserver les événements de test existants.

## 3. Références Jira à harmoniser avant recette finale

- SMN-72 : son contrat « générer automatiquement les standards » doit devenir « modèles actifs exclusivement ».
- SMN-76/77 : conserver l'édition des modèles et rendre leur génération exclusive.
- SMN-160 : reprise historique facultative alimentée exclusivement par les modèles actifs.
- SMN-229/231 : Paramètres configure les modèles, assistant affiche et utilise leur version active réellement persistée ; création de lot atomique et vérification des révisions conservées.
- Les API calendrier, fiche réunion, avertissements, présence et durées réelles conservent leur historique existant.

**Aucune modification Jira dans cette intervention** ; solliciter l'accord utilisateur avant de modifier les Stories.

## 4. Plan de vérification sur le PC utilisateur

1. Synchroniser la branche via GitHub Desktop ou après fusion approuvée.
2. Sur installation existante : exécuter la migration PostgreSQL versionnée (`pnpm exec prisma migrate deploy` après configuration correcte de `DATABASE_URL` selon `prisma.config.ts`).
3. Vérifier les quatre lignes dans **Paramètres → Cérémonies et modèles** ; contrôler leur activation, puis modifier horaires et durées si souhaité.
4. Désactiver le Daily, créer un Sprint **futur** : aucune occurrence Daily ; les autres modèles actifs sont générés.
5. Désactiver tous les modèles, générer un autre Sprint : zéro cérémonie automatique ; aucun ancien Sprint modifié.
6. Réactiver les modèles ; vérifier création unitaire et par lot, calendrier et fiche réunion, chevauchements et provenance de reprise historique si utilisée.
7. Vérifier la migration sans doublons au second passage ; vérifier aucune nouvelle occurrence dans les Sprints existants.

**Limites :** les services PostgreSQL sur le PC, les tests locaux réels, la migration et les tests du calendrier n'ont pas été exécutés depuis ChatGPT. Ne pas déclarer la recette terminée avant exécution utilisateur.

## 5. Règle d'installation et base existante

La migration n'est **pas automatiquement exécutée par `pnpm dev`** dans l'état constaté du code. Le lancement `pnpm exec prisma migrate deploy` est requis pour mettre à niveau une installation existante lorsque les variables de connexion Prisma sont accessibles ; vérifier la présence de `DATABASE_URL` et ne publier aucun secret.

Pour une installation vierge via l'assistant Express, l'amorçage des modèles Scrum est intégré dans la transaction d'installation. Si la base est en mode Kanban, aucun modèle Scrum n'est inséré.

**Garanties de changement :** aucune mutation des données d'occurrences historiques, tests ciblés ajoutés, absence de test réel signalée.
