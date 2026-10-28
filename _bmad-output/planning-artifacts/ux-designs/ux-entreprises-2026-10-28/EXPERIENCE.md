# EXPERIENCE — Entreprises et disponibilités — SMN
**BMAD v6.12.4 — Sally UX Designer — 28/10/2026**
**Statut : UX-ENT-01 à UX-ENT-12 validées ; aucune recette ou exécution de tests attestée.**
**Sources :** [Brief John](../../briefs/entreprises-disponibilites-2026-10-28/BRIEF-BMAD-PM.md), `docs/UX-REFERENTIEL-BMAD.md`.

## Principes
Une entreprise est enregistrée une seule fois par installation, associée facultativement à chaque membre à sa création ; ses fermetures s'appliquent automatiquement aux disponibilités et capacités dynamiques des membres, en supplément des jours fériés du pays et des absences. Aucune double déduction ; références figées et bilans clôturés préservés. Pas de transfert d'entreprise.

## Parcours utilisateur
1. **Créer :** Paramètres > Entreprises > Ajouter ; nom obligatoire, commentaire facultatif, couleur palette ; Enregistrer. Retour au catalogue, statut Actif. En cas d'erreur, garder les saisies et expliquer près du champ.
2. **Consulter / modifier :** clic sur carte ou ligne, fiche à trois onglets ; Informations > crayon > modale préremplie > Enregistrer. Confirmer la sortie avec modifications non sauvegardées.
3. **Archiver :** action séparée > confirmation contextualisée avec effectif visible et conséquences ; maintenir liens membres et calendrier ; masquer entreprise archivée des nouveaux choix ; réactivation autorisée via confirmation simple.
4. **Fermetures :** onglet Fermetures > Ajouter ou Modifier ; saisir nom et plage de dates inclusives ; empêcher dates incohérentes ou chevauchements **actifs** de la même entreprise avec détail intelligible ; seules les fermetures annulées peuvent partager une plage. Après succès, rafraîchir le tableau et les capacités dynamiques concernées. Annulation par action distincte et confirmation ; conserver historique ; ne jamais modifier snapshots figés.
5. **Membres :** onglet Membres = tableau lecture seule, recherche et filtre équipe ; ouvrir fiche individuelle si droits. Sur création d'un membre, entreprise facultative parmi les actives ; après création affichage en lecture seule, aucune modification/transfert. Si changement réel d'entreprise : clôturer la fiche et en créer une nouvelle, sans fonctionnalité de transfert.
6. **Calendrier :** fermetures de l'entreprise affichées comme événements d'information pour les membres de l'équipe concernée, pas comme indisponibilité collective ; clic ouvre modale détaillée lecture seule avec nom, dates, effectif et noms **seulement autorisés**.

## Règles de sécurité et d'erreur
Catalogue global ne signifie pas accès transversal aux identités : ne jamais exposer les membres d'équipes non autorisées, y compris via les compteurs. Les actions interdites sont **masquées** et refusées aussi côté API. Prévoir chargement, aucun élément, aucun résultat après filtre, erreur réseau et conflit de concurrence (sans écrasement silencieux). Toutes les confirmations sont explicites, les formulaires préservent les données si échec.

## Recette UX — critères à vérifier réellement
- R01 : première visite en Cartes ; 3/2/1 colonnes ; bascule Cartes/Liste et mémorisation.
- R02 : recherche et filtres du catalogue, états vides pertinents.
- R03 : fiche Informations/Fermetures/Membres accessible depuis catalogue ; navigation et retour préservent le contexte.
- R04 : modale unique entreprise, champs, palette prédéfinie, validation et données préservées sur erreur.
- R05 : archivage contextualisé, réactivation simple ; membres existants et fermetures conservés ; aucune nouvelle affectation à une entreprise archivée.
- R06 : tableau fermetures, filtres, périodes, création/édition/annulation/audit.
- R07 : chevauchements de deux fermetures actives bloqués côté UI et serveur, annulées non bloquantes.
- R08 : tableau Membres filtrable, lecture seule et navigation autorisée ; aucune divulgation hors périmètre.
- R09 : pastille + entreprise sur carte, liste et fiche membre ; absence de champ sans entreprise ; entreprise fixée à la création.
- R10 : fermeture visible à titre informatif dans calendrier de l'équipe concernée ; clic modale avec informations et noms autorisés seulement.
- R11 : sans entreprise, calcul de capacité inchangé ; jours fériés, fermetures et absences combinés sans double déduction.
- R12 : modifications de fermeture ne recalculent que les capacités dynamiques, sans toucher les références initiales figées ni bilans clôturés.
- R13 : droits d'accès contrôlés serveur, actions non autorisées masquées.
- R14 : FR/EN, thèmes, clavier, focus, zoom 200 %, responsive et états d'erreur fonctionnels.
- R15 : conservation contrôlée des fermetures historiques actuellement rattachées à une équipe, sans attribution arbitraire.

## À instruire avec Winston
Migration des fermetures avec `teamId`, schéma et uniques des membres / clôtures, préservation des corrections manuelles de capacités, isolation installation/équipes, cohérence des snapshots et calcul des effectifs visibles. Les arbitrages techniques non résolus ne constituent pas une recette réussie.

**Aucune modification Jira ni développement inclus dans ces contrats.**
