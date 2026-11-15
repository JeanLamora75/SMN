# SMN — Étude UX : éditeur de modèles de briefs IA en texte libre

**Date :** 15 novembre 2026  
**Agent :** 🎨 Sally — UX Designer (BMAD v6.12.4)  
**Statut :** proposition UX à valider en détail avant développement ; principes fonctionnels validés par le Product Owner  
**Référence architecture :** [Étude Winston](../../architecture/ETUDE-TECHNIQUE-REFONTE-BRIEFS-IA-2026-11-15.md)  
**Référence UX :** `docs/UX-REFERENTIEL-BMAD.md`.

## 1. Besoin et décision

Le formulaire actuel est trop complexe : rubriques, questions, consignes, profondeur, cases de données. La cible validée est un **éditeur bloc-notes de prompts avec tags SMN insérables comme dans les rapports Office**. Les utilisateurs de SMN doivent pouvoir exploiter un modèle existant immédiatement, sans comprendre la structure technique.

Objectifs : intuitivité, cohérence Cockpit Agile, faible nombre d'actions, FR/EN extensible, accessibilité, zéro installation additionnelle. Les évolutions IA (appel direct d'API externe gratuite) sont un lot distinct.

## 2. Parcours utilisateurs

### A — Créer un modèle

1. Ouvrir « Modèles de briefs IA » depuis la préparation ou les Paramètres adaptés.
2. Cliquer « Nouveau modèle » dans l'en-tête.
3. Saisir un nom et, facultativement, une description courte.
4. Rédiger librement dans une zone de texte large, avec retour à la ligne et copier-coller.
5. Cliquer « Insérer un tag » ; choisir une famille, rechercher un tag, lire sa description métier.
6. Valider l'insertion **à la position du curseur**, sans écraser le texte ni perdre la sélection.
7. Enregistrer ; afficher confirmation et statut des changements non sauvegardés.

### B — Utiliser un modèle depuis le sprint

1. Depuis la page de sprint, « Générer un brief IA » ouvre la préparation contextualisée.
2. Choisir un modèle natif ou personnalisé ; montrer le nom, la description et un aperçu court.
3. Le prompt source est présenté en lecture lisible, avec modifications ponctuelles facultatives qui **ne remplacent pas le modèle**.
4. Prévisualiser la version résolue à partir des données autorisées du cycle.
5. Identifier les données manquantes et les tags non résolus, avec leur raison.
6. Relire tout le prompt résolu et confirmer explicitement la confidentialité **pour cette version exacte**.
7. Copier / finaliser / archiver selon les comportements existants ; l'envoi automatique vers une IA reste hors de cette première refonte.

### C — Gérer des modèles existants

Table filtrable et lisible : nom, description courte, état actif, origine natif/personnalisé, date de modification, actions adaptées aux droits. Actions : éditer, dupliquer, désactiver/réactiver. Les modèles natifs sont protégés mais duplicables. Confirmation avant désactivation ; les archives restent accessibles.

## 3. Structure de l'écran éditeur

- Conteneur **pleine largeur sous un bandeau d'en-tête Cockpit Agile**, fond de contenu blanc, alignements cohérents avec les pages Paramètres et Rapports.
- En-tête : titre, sous-titre, lien de retour, bouton Enregistrer clairement identifiable.
- Bloc identité : nom + description facultative.
- Espace de travail prioritaire : **grande zone de texte** souple avec conservation des sauts de ligne, police confortable et bonne lisibilité.
- Barre d'outils légère : « Insérer un tag », « Aperçu », « Copier » ; pas de fonctions de traitement de texte non nécessaires.
- Sur écran large : éditeur puis aperçu côte à côte si la largeur le permet ; sur mobile : affichage vertical ou onglets « Rédiger / Aperçu ». Ne pas réduire l'éditeur à une petite colonne.
- Éviter un formulaire modal pour rédiger un long prompt ; le catalogue de tags, lui, doit s'ouvrir en **modale Cockpit Agile**.
- Boutons de sortie et retour sûrs en cas de modifications non enregistrées, avec choix enregistrer / abandonner / rester.

## 4. Modale « Insérer un tag »

Réutiliser les familles du catalogue de rapports : informations simples, indicateurs, données métier répétées, et graphiques **uniquement si un rendu TXT est supporté et défini**. Recherche insensible aux accents, catégorie claire, nom métier avant identifiant technique, exemple et éventuelles restrictions contextuelles. Sélection au clavier ; focus dans la modale, Escape pour fermer, focus rendu au bouton d'origine. Le clic sur « Insérer » place la syntaxe exacte au curseur ; le presse-papiers reste une option secondaire.

Le catalogue ne doit pas laisser entendre qu'un tag techniquement résolvable est automatiquement autorisé à être envoyé à une IA externe, notamment membres, contacts, liens, textes libres et informations sensibles.

## 5. Aperçu, erreurs et transparence

- Distinguer **« Prompt modèle »** (tags visibles) et **« Aperçu avec données du sprint »** (valeurs calculées).
- Signaler le sprint et l'équipe utilisés ; indiquer lorsqu'un cycle n'est pas clôturé.
- Tag inconnu / incompatible / sans données : signaler précisément, sans inventer de valeur ; message lisible et position accessible.
- Contenu long : texte sélectionnable et scrollable ; bouton copier accessible, pas de perte de contenu.
- Qualité, source et statut provisoire des informations conservés dans le texte ou sa présentation lorsque disponibles.
- Après modification du prompt ou contexte, annuler automatiquement l'approbation de confidentialité antérieure.
- Les textes d'aide doivent expliquer les différences entre générer le prompt, archiver et contacter réellement une IA.

## 6. États à spécifier et tester

Nouveau vide ; modification de modèle ; copie d'un modèle natif ; modèle désactivé ; chargement des données ; absence de sprint/données ; tag invalide ; erreur réseau ; conflit de révision ; prompt modifié après validation ; données personnelles ; archive consultée ; permission lecture seule ; changement de langue ; navigation clavier ; écran mobile ; annulation avec modifications non sauvegardées.

## 7. Internationalisation et accessibilité

Composants conformes aux conventions SMN FR/EN ; catalogue avec libellés localisés mais syntaxe technique stable ; architecture compatible avec 6 à 10 langues sans injecter les textes complets des modèles dans les JSON UI. Labels reliés aux champs, états annoncés aux lecteurs d'écran, focus visible et ordre logique, contraste Cockpit Agile ; ne pas dépendre de la couleur seule pour les avertissements.

## 8. Critères d'acceptation UX proposés

1. Un utilisateur peut créer un modèle nommé en saisissant seulement un texte, sans remplir de listes techniques.
2. Un tag choisi via le configurateur est inséré **au curseur** avec syntaxe inchangée et n'altère pas les caractères voisins.
3. Le choix du modèle depuis le sprint conserve le contexte courant.
4. L'aperçu montre le résultat calculé et les erreurs de résolution de tags de façon non ambiguë.
5. Une validation de confidentialité ne s'applique qu'à la version exacte consultée.
6. Modèles natifs non modifiables directement, mais duplicables.
7. Aucun brief historique ni réponse IA antérieure n'est modifié par la refonte.
8. FR et EN sont complets ; l'interface fonctionne au clavier et en vue étroite.
9. Les utilisateurs sans droit d'édition ne voient aucune action d'écriture.
10. Aucun nouveau service IA n'est requis pour utiliser les modèles.

## 9. Questions à arbitrer lors du design détaillé

- Modal tags Office actuelle : factorisation d'un sélecteur commun ou composant partagé avec nouveaux modes « copier / insérer ».
- Politique de texte pour les tags de graphiques et les tableaux.
- Apparence exacte de la liste des modèles et placement dans la navigation.
- Niveau de contrôle de la confidentialité des données insérées automatiquement.
- Comportement d'édition ponctuelle d'un prompt et création éventuelle d'un nouveau modèle à partir de celui-ci.

## 10. Passage de relais à John

Prévoir de petites User Stories indépendantes et testables couvrant : contrat simplifié et migration des modèles, intégration du sélecteur de tags, éditeur UX, résolution TXT, préparation du brief, prévisualisation et confidentialité, nettoyage du schéma et des anciens composants, compatibilité des archives, tests et i18n. **Le nettoyage PostgreSQL est une exigence obligatoire, pas une amélioration facultative.**

L'architecture de Winston et les présents critères sont des entrées de cadrage, non la preuve d'exécution. Aucun code d'application ni schéma de base n'a été modifié pour cette étude.
