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

---

## 11. Complément Sally — Sélection multi-IA et sauvegarde volontaire (décisions PO du 16/11/2026)

**Statut :** orientations UX intégrées au cadrage, à détailler et valider avant transmission à John et rédaction de nouvelles User Stories.

### 11.1 Règles produit incontournables

1. L'utilisateur peut configurer **plusieurs connexions IA** et sélectionner librement celle à utiliser **au moment d'envoyer un brief**, y compris plusieurs connexions pour le même fournisseur.
2. **Seuls les modèles gratuits sont sélectionnables et exécutables.** Un modèle facturable, inconnu ou dont la gratuité ne peut être confirmée doit être indisponible avec une explication claire ; pas de bascule payante cachée.
3. Les réponses IA sont **conservées uniquement par une action manuelle explicite** ; ni sauvegarde automatique, ni historique implicite. Une réponse non enregistrée peut disparaître à la fermeture de l'écran ; prévenir l'utilisateur sans lui imposer l'archivage.
4. Conserver l'éditeur « bloc-notes » et les tags du système de rapports sans réintroduire de formulaires techniques pour les modèles de briefs.

### 11.2 Parcours A — Paramètres > Intelligence artificielle

- Écran pleine largeur, fond de contenu blanc, en-tête et séparation filtres/données conformes au référentiel Cockpit Agile.
- Tableau de connexions : nom lisible, fournisseur, modèle gratuit sélectionné, statut actif/inactif, dernier résultat de test lorsque disponible, actions éditer/tester/désactiver/supprimer selon droits.
- Bouton « Ajouter une connexion » dans l'en-tête ; **modale Cockpit Agile** pour nom, fournisseur, clé masquée, modèle gratuit compatible et bouton « Tester la connexion ».
- Permettre plusieurs clés pour un fournisseur, les distinguer par des libellés personnalisables ; ne jamais réafficher une clé complète. Modification de clé par remplacement explicite.
- Afficher le lien officiel pour obtenir une clé API et l'information sur les quotas et la politique de confidentialité ; ne pas promettre la permanence de la gratuité.
- État vide, erreur de validation, fournisseur indisponible, clé invalide et accès lecture seule : messages accessibles, localisés, avec action de correction.
- Pas de clé obligatoire pour écrire, prévisualiser, copier ou archiver un prompt local.

### 11.3 Parcours B — Envoyer un brief IA depuis un sprint

1. Préparer le prompt dans la grande zone de texte et insérer des tags.
2. Prévisualiser le **texte intégral résolu** et les données qui seront transmises ; signaler explicitement les informations personnelles/sensibles et les tags invalides.
3. Sélectionner une connexion active dans une liste « Envoyer à » ; afficher fournisseur, modèle gratuit et éventuelle limitation connue.
4. Contrôler que le modèle reste autorisé et gratuit, puis demander la confirmation explicite d'envoi du **contenu exact affiché**. Une modification du texte, du contexte ou de la connexion annule cette confirmation.
5. Afficher progression, annulation lorsque possible, erreurs de quota/authentification/réseau et réponse retournée directement dans SMN.
6. Fournir **Copier** et **Enregistrer cette réponse**, cette dernière étant la seule action qui autorise la persistance. Après enregistrement, fournir un retour clair et le lien vers l'archive ou le journal selon le modèle de données existant.

### 11.4 États, garde-fous et accessibilité

- Aucune connexion ; plusieurs connexions ; connexion inactive ; clé à remplacer ; service indisponible ; aucun modèle gratuit disponible ; quota gratuit dépassé ; confirmation refusée ; erreur pendant l'appel.
- Réponse affichée mais **non enregistrée** : marque explicite « Non enregistrée », avertissement de perte à la navigation, sans pop-up répétitive et sans écriture cachée.
- Réponse déjà enregistrée : état visible et prévention de doublons accidentels.
- Contrôles clavier, lecteurs d'écran, messages non uniquement colorés ; responsive et traductions FR/EN avec extensibilité 6–10 langues.
- Éviter de mélanger « Générer le brief » (résolution locale), « Envoyer à l'IA » (transmission externe) et « Enregistrer la réponse » (persistance locale).
- Respecter le contrôle des permissions de SMN, la confidentialité des tags et le droit de ne jamais envoyer le brief hors du PC.

### 11.5 Recette UX préalable aux User Stories

- L'utilisateur crée deux connexions du même fournisseur, les distingue et choisit l'une à l'envoi.
- La liste ne propose que des modèles confirmés gratuits ; le changement de statut d'un modèle bloque proprement l'envoi.
- Aucun texte de réponse n'est conservé sans clic explicite « Enregistrer cette réponse » ; la copie ne déclenche pas la sauvegarde.
- Les données résolues envoyées correspondent exactement à celles que l'utilisateur a relues et autorisées.
- Le parcours demeure utilisable pour la simple édition locale du prompt sans clé ni connexion internet.
- Les archives et réponses historiques restent accessibles sans réécriture.

**Traçabilité :** arbitrages validés par le Product Owner le 16 novembre 2026. Ce document est une spécification UX, pas une implémentation ni une preuve de test.

---
## Addendum du 16 novembre 2026 — connexions IA et envoi direct (Sally)

**Décisions UX fermes :** plusieurs connexions et clés (y compris plusieurs par fournisseur) ; choix de l'IA **au moment de l'envoi** ; seuls les modèles gratuits qualifiés apparaissent comme utilisables ; une réponse n'est enregistrée **que par clic explicite**. Conception prête pour découpage Jira, sans implémentation.

### A. Écran Paramètres > Intelligence artificielle

- Entrée dans le catalogue Paramètres, visible suivant permissions : administrateur pour gérer les connexions ; autres utilisateurs autorisés peuvent sélectionner uniquement les connexions actives depuis leurs briefs.
- Page plein format Cockpit Agile : en-tête, bouton « Ajouter une connexion », bloc de filtres distinct, table/listing dans un bloc blanc distinct. Colonnes : nom personnalisé, fournisseur, modèle gratuit, statut (connectée / à tester / clé à renseigner / quota atteint / inactive), dernier test, actions icônes accessibles.
- Création/édition dans une **modale Cockpit Agile** : nom, fournisseur dans un sélecteur, clé API masquée, modèle choisi dans le catalogue **gratuit vérifié**, activation, aide vers la page officielle de création de clé. N'afficher aucune clé existante et ne jamais la préremplir. Changer la clé nécessite de la ressaisir.
- Actions : Tester la connexion (sans envoyer les données d'un sprint), modifier, désactiver, supprimer avec confirmation. Un échec de test n'efface pas les valeurs déjà enregistrées. L'utilisateur peut créer plusieurs connexions Gemini, Groq, etc.
- Afficher une notice non alarmiste : « L'utilisation de modèles gratuits peut être limitée par des quotas. N'envoyez pas de données confidentielles sans autorisation. » Afficher un message spécifique lorsque la gratuité d'un modèle ne peut plus être confirmée ; blocage explicite de l'envoi.
- Conception accessible clavier, focus géré à l'ouverture/fermeture des modales, descriptions et erreurs traduites. Aucune carte « gratuite » ne doit garantir l'absence absolue de facture si la facturation du compte externe est activée.

### B. Parcours depuis un brief de sprint

1. L'utilisateur ouvre « Générer un brief IA », choisit ou personnalise son prompt en texte libre avec tags, puis visualise le résultat **intégral** des tags résolus.
2. Un bloc « Envoyer à une IA » présente un sélecteur de connexion **au moment de l'action**. Afficher sous la connexion le fournisseur, le modèle gratuit, et son état. Ne pas forcer un choix figé dans le modèle de brief.
3. Clic « Prévisualiser l'envoi » : montrer en lecture seule le texte exact, l'équipe/sprint, le destinataire IA, le modèle, les avertissements de confidentialité et les tags sensibles. L'utilisateur valide la transmission pour cet aperçu seulement.
4. Clic « Envoyer à l'IA » actif uniquement si tous les contrôles sont satisfaits. État d'envoi clair, pas de doublon, annulation visuelle sans promesse qu'une requête déjà envoyée sera révoquée ; pas d'envoi automatique.
5. Après succès : afficher une zone « Réponse de l'IA » sélectionnable, avec « Copier », **« Enregistrer la réponse »** et « Nouvelle demande ». Indication permanente « Non enregistrée » jusqu'au succès réel d'un enregistrement explicite. Ne pas enregistrer lors de l'envoi, de l'affichage, de la copie ou du changement d'onglet.
6. Au clic « Enregistrer la réponse », vérifier l'archive de rattachement/permissions ; s'il faut d'abord finaliser une archive, guider clairement l'utilisateur et demander confirmation avant toute écriture. Après succès seulement, montrer « Enregistrée dans les archives ». Préserver l'immutabilité du TXT original.
7. Si l'utilisateur quitte la page, change de brief ou actualise pendant qu'une réponse non enregistrée existe, avertir de sa perte possible. Le navigateur ne doit pas utiliser localStorage/sessionStorage/indexedDB pour persister le contenu d'une réponse non sauvegardée.

### C. Erreurs et scénarios de restauration

- Aucun fournisseur connecté : état vide avec accès à la configuration pour un administrateur, invitation à contacter l'administrateur sinon.
- Clé absente après transfert ZIP : état **« Clé à renseigner sur ce PC »**, bouton « Configurer la clé » dans Paramètres. Ne pas confondre transfert de données réussi et connexions IA opérationnelles.
- Modèle devenu payant / gratuité non vérifiable : désactivation de l'envoi, explication, bouton d'actualisation du catalogue ou de choix d'une autre connexion **gratuite vérifiée**.
- Quota épuisé : réponse explicite sans nouvelle tentative implicite ; l'utilisateur peut choisir une autre connexion, puis doit revoir et confirmer le nouvel envoi.
- Erreur authentification, réseau, délai dépassé, retour trop volumineux : messages différenciés, sans exposer clé ni corps de réponse de diagnostic brut.
- Réponse reçue mais non enregistrée : badge textuel « Non enregistrée », copie possible, dialogue de prévention de perte. Une réponse déjà sauvegardée reste consultable selon les droits.
- Chargement, lecture seule, modèle supprimé, changement de langue, petit écran, clavier/lecteur d'écran : parcours documentés et testables.

### D. Critères UX de recette avant User Stories

1. Ajouter deux connexions du même fournisseur sans conflit et choisir celle à utiliser à chaque envoi.
2. Aucun modèle non qualifié gratuit ne peut être sélectionné, ni devenir implicitement payant.
3. Une clé existante est toujours masquée, jamais restituée à l'édition.
4. La revue affiche exactement le prompt résolu et doit être recommencée après modification de contenu, contexte, fournisseur ou modèle.
5. Envoi réussi ne crée **aucune réponse enregistrée** ; seul le bouton « Enregistrer la réponse » le fait, avec confirmation de succès.
6. Après migration/restauration, connexions identifiables mais mention « Clé à renseigner », sans exigence de ligne de commande.
7. Interface conforme Cockpit Agile (filtres séparés, pleine largeur sous en-tête, modales de configuration), FR/EN et extensibilité à 6–10 langues.
8. Aucun appel réseau automatique à l'ouverture de Paramètres, des archives ou des briefs.

### E. Recommandation Sally

Conserver une action primaire claire « Prévisualiser l'envoi » puis « Envoyer à l'IA », et rendre **« Enregistrer la réponse » explicitement secondaire et volontaire**. Ne pas ajouter de comparaison multi-IA ou d'historique automatique à cette première version. **Aucune User Story créée ici.**
