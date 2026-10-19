# Revue adversariale du PRD — SMN

**Portée :** PRD `prd.md` et ses annexes, branche `docs/bmad-prd-smn-20261018`, le 2026-10-19.  
**Méthode :** lecture critique des conflits inter-exigences, variantes d'état et cas limites ; la présence d'un point ouvert connu n'est pas interprétée comme un échec technique exécuté.

## Constats (lens adversarial)

### 1. Création rétrospective d'un Sprint et événements automatiques
- **location :** `prd.md` FR-17/FR-42 ; `reprise-imports-historiques.md` FR-42.
- **trigger_condition :** l'utilisateur crée aujourd'hui un Sprint qui s'est terminé plusieurs mois auparavant.
- **guard_snippet :** imposer une branche métier « reprise historique » qui ne qualifie jamais les événements générés comme réellement tenus sans preuve.
- **potential_consequence :** fausses statistiques de cérémonies tenues, et reportings historiques trompeurs.

### 2. Gel rétroactif d'une capacité initiale inconnue
- **location :** `prd.md` FR-14/FR-42.
- **trigger_condition :** une période passée n'existait pas dans SMN lors de son démarrage réel.
- **guard_snippet :** ne figer la valeur initiale qu'à partir d'une donnée de l'époque explicitement connue ; sinon « non renseignée ».
- **potential_consequence :** référence historique calculée avec des affectations actuelles.

### 3. Reclôture d'un cycle et photographies divergentes
- **location :** `prd.md` FR-16/FR-41 ; `registres-qualitatifs.md` FR-41.
- **trigger_condition :** clôture, réouverture, correction d'un risque ou d'une action, puis nouvelle clôture.
- **guard_snippet :** versionner et dater les états figés, définir quel bilan futur lit quelle version.
- **potential_consequence :** un rapport historique peut changer sans règle de correction auditable.

### 4. Import avec erreurs et lignes valides
- **location :** `reprise-imports-historiques.md` FR-43 à FR-45.
- **trigger_condition :** 100 lignes CSV dont 5 invalides et 10 modifiant des données déjà enregistrées.
- **guard_snippet :** préciser le contrat de fichier, l'arbitrage de lot tout-ou-rien vs sous-ensemble confirmé, les collisions et le compte rendu.
- **potential_consequence :** import partiel indétectable ou comportement divergent suivant l'écran.

### 5. Échéance de risque extérieure à la période replanifiée
- **location :** `prd.md` FR-25 ; `risques-dependances.md` D-PRD-120/121.
- **trigger_condition :** une dépendance transverse conserve volontairement une échéance au-delà du cycle.
- **guard_snippet :** définir une heuristique d'alerte **potentielle** qui explique le contexte sans marquer toute date extérieure comme erreur.
- **potential_consequence :** prolifération d'alertes trompeuses, puis désactivation des contrôles utiles.

### 6. Désassociation après clôture
- **location :** `risques-dependances.md` D-PRD-121/122 ; `registres-qualitatifs.md` FR-41.
- **trigger_condition :** un risque associé à trois cycles est détaché du plus ancien après clôture.
- **guard_snippet :** figer aussi l'ensemble des associations à date et imposer une procédure de correction de lien historique.
- **potential_consequence :** disparition d'un risque du bilan passé ou contradiction entre fiche centrale et photographie.

### 7. Criticité inconnue et cockpit des risques élevés
- **location :** `registres-qualitatifs.md` FR-36/FR-39.
- **trigger_condition :** probabilité ou impact manquant ; une autre fiche est élevée selon la matrice non définie.
- **guard_snippet :** valider les neuf cases 3×3 et tester « Non calculable » séparément du niveau Faible.
- **potential_consequence :** le cockpit masque un risque important ou crée une fausse alerte.

### 8. Suppression autorisée d'une personne historisée
- **location :** `prd.md` FR-4/FR-69 ; `securite-exploitation.md` FR-67/FR-69.
- **trigger_condition :** demande d'effacement tandis que des instantanés, TXT, journaux ou sauvegardes conservent des traces.
- **guard_snippet :** fixer une politique de conservation, masquage, suppression et restauration adaptée au périmètre et aux obligations applicables.
- **potential_consequence :** conflit entre confidentialité, traçabilité et archives.

### 9. Un rapport ancien contient chiffres corrigés et photographies qualitatives originales
- **location :** `prd.md` FR-20/D-PRD-078, FR-41 ; `reportings-html-pdf.md` FR-30.
- **trigger_condition :** une valeur chiffrée est corrigée après clôture tandis que le risque archivé garde son état original.
- **guard_snippet :** afficher provenance, date de correction et temporalité des deux catégories sans modifier les anciennes exports.
- **potential_consequence :** lecteur croyant toutes les valeurs figées à la même date.

### 10. Rapport PDF exporté et non conservé dans l'application
- **location :** `prd.md` FR-31/FR-68 ; `reportings-html-pdf.md` FR-31.
- **trigger_condition :** un PDF est téléchargé mais aucune copie n'est stockée par SMN.
- **guard_snippet :** distinguer explicitement export immuable, archive consultable dans SMN et sauvegarde des fichiers réellement stockés.
- **potential_consequence :** promesse perçue d'historique de rapports impossible à satisfaire.

### 11. Charge MVP incompatible avec l'objectif de 15 à 30 minutes hebdomadaires
- **location :** `prd.md` sections 4, 6 et 7 ; `recette-finalisation-mvp.md` FR-76.
- **trigger_condition :** tous les champs qualitatifs, KPI et liens exigent une saisie manuelle durant le pilote.
- **guard_snippet :** prioriser le préremplissage et tester le parcours minimum réellement utile avant d'élargir les fonctions avancées déjà approuvées.
- **potential_consequence :** outil complet mais trop lourd pour être adopté.

### 12. Déploiement personnel dans l'environnement professionnel contraint
- **location :** `prd.md` FR-63/FR-66 et NFR-1 à NFR-3 ; `securite-exploitation.md` FR-66/FR-68.
- **trigger_condition :** environnement Windows professionnel sans droits d'administration ni IDE installable.
- **guard_snippet :** expliciter cette contrainte au cahier de charge architecte et tester le parcours d'installation/démarrage/restauration retenu.
- **potential_consequence :** architecture théoriquement conforme mais impossible à utiliser par le premier opérateur.

**Note :** ces douze constats ont été examinés comme chemins à risque ; certains sont déjà signalés comme questions ouvertes dans le PRD, mais ne disposent pas d'une réponse opératoire et testable. Aucun traitement automatique de correction n'a été appliqué.
