# SMN — EXPERIENCE.md — Parcours transversaux des modales
Statut : Option B validée par le commanditaire le 27/10/2026.
## Parcours
1. Depuis n'importe quel module, action Ajouter/Modifier ouvre une modale centrée avec le même bandeau Cockpit Agile, contexte compréhensible, champs préremplis lorsque la donnée existe et priorité visuelle claire.
2. La première zone de formulaire contient les informations essentielles. Les champs sont groupés par sens métier plutôt que par ordre de colonnes de base de données. Champs avancés restent disponibles sans cacher les informations nécessaires à l'enregistrement.
3. Listes affichent des libellés complets traduits, avec état initial clair « Sélectionner… » ; valeurs enregistrées et codes API inchangés. Les contrôles date/heure suivent le fuseau de référence existant.
4. Validation côté client et serveur conforme aux comportements existants. En erreur, conserver la saisie, afficher un message pertinent, positionner le focus vers le premier problème accessible ; ne pas annoncer de succès avant réponse serveur.
5. Enregistrer : verrouiller pendant la requête, succès ferme la modale puis rafraîchit l'écran en conservant le contexte de navigation. Annuler/fermer : respecter la politique actuelle des modifications non enregistrées et ne jamais supprimer une saisie critique par surprise.
6. Parcours lecture seule et états protégés : commandes absentes/désactivées avec explication adaptée selon règle existante. Les autorisations sont contrôlées par le serveur.
7. Mobile : formulaire en une colonne et zone d'actions accessible avec clavier logiciel ; pas de double scroll inutilisable.
## Inventaire obligatoire avant développement
Recenser chaque modale avec module, composant source, objet métier, mode création/édition/lecture, champs, validations, i18n, thèmes, contraintes et tests. Couvrir Équipe, Membres, Sprints, Calendrier, Registres, Rapports, Paramètres et toutes les modales supplémentaires trouvées dans le code. Ne pas supposer qu'un composant partagé couvre tout.
## Stratégie de mise en œuvre
Créer une abstraction de présentation réutilisable compatible avec les modales Bootstrap existantes ; migrer progressivement sans changement des signatures métier, en priorisant Réunion, Membre, Risque comme cas pilotes. Ne pas bloquer les cas atypiques : consigner exception justifiée (tableaux larges, assistants multiétapes, confirmation destructive). Ajouter vérifications de non-régression ciblées.
## Définition de terminé
Inventaire signé ; toutes les modales éligibles migrées ou exception documentée ; revue visuelle comparative ; i18n:check, lint, typecheck, tests et build exécutés localement par l'utilisateur si indisponibles ; aucun résultat de test inventé ; validation utilisateur avant clôture.