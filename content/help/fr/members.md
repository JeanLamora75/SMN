# Membres : consulter les profils et gérer les affectations

Une équipe se construit avec des personnes, pas seulement des fiches. Commencez par contrôler les profils existants avant d'ajouter qui que ce soit.

## Prérequis et droits

Une équipe doit exister. Ouvrez [Équipe / Membres](/app/admin/members) avec un compte autorisé. Le guide détaillé de configuration est destiné aux administrateurs ; les actions de création, de modification et de gestion des affectations ne sont proposées que si votre compte possède les droits nécessaires.

## Repérer les membres de l'équipe

1. Sélectionnez l'équipe ou le contexte approprié lorsque plusieurs équipes sont disponibles.
2. Choisissez la présentation **Cartes** ou **Liste** dans l'en-tête.
3. Utilisez les filtres **recherche**, **rôle**, **fonction** et **statut** ; appliquez-les avec **Filtrer** ou utilisez la réinitialisation pour revenir à la liste complète.
4. Consultez séparément les groupes de membres **actifs** et **inactifs**, puis ouvrez la fiche du membre voulu.
5. Vérifiez le nom, la fonction, la localisation, les rôles et les informations d'affectation affichées. Les éléments visibles varient selon les données renseignées.

Le choix Cartes/Liste est mémorisé localement par le navigateur ; il n'affecte pas les affectations métier.

## Personnaliser les profils déjà présents

Si cette installation contient déjà des membres (par exemple à la suite d'une restauration ou d'une préparation antérieure), commencez par ouvrir chaque fiche et vérifier son identité, sa fonction, sa localisation, ses rôles et ses périodes d'affectation. Modifiez les informations avec les commandes autorisées. **Ne créez pas de doublon pour remplacer un profil existant.** Le nombre de profils présents n'est pas garanti d'une installation à l'autre.

## Ajouter uniquement les membres manquants

Si le bouton d'ajout est disponible dans l'en-tête et que la personne n'existe pas encore :

1. Ouvrez le formulaire **Ajouter un membre**.
2. Renseignez le nom demandé ; si la sélection d'entreprise est proposée, choisissez l'entreprise appropriée.
3. Validez avec l'action de création et contrôlez l'apparition du membre dans l'équipe.
4. Ouvrez ensuite sa fiche pour compléter les informations et vérifier ses affectations.

Le bouton peut être absent si votre rôle ne permet pas la création ou si le contexte d'équipe ne remplit pas les conditions du formulaire. L'ajout d'un membre ne prouve pas qu'il soit affecté sur toute la durée du sprint.

## Vérifier le profil et les affectations

- Depuis la fiche du membre, contrôlez les données du profil, la **fonction**, la **ville** et le **pays** lorsqu'ils sont disponibles.
- Vérifiez les dates de **début** et de **fin** d'affectation et les rôles associés (Scrum Master, Product Owner, Développeur).
- Une affectation terminée ou inactive ne doit pas être confondue avec un profil supprimé. Consultez les sections actives et inactives pour retrouver les situations historiques.
- Contrôlez la cohérence des absences et des jours travaillés dans le calendrier de la personne avant d'interpréter sa capacité sur un sprint.
- Après une modification autorisée, revenez à la fiche ou à la liste pour vérifier le résultat enregistré.

## En cas de problème

- **Membre absent de la liste** : vérifiez l'équipe, les filtres, le statut et la présentation sélectionnée.
- **Création ou modification inaccessible** : vérifiez votre rôle et les autorisations du contexte ; ne tentez pas de contourner un contrôle.
- **Dates ou capacité incohérentes** : comparez les affectations et les jours ouvrés du calendrier avant de conclure à une erreur de calcul.

## Votre point de contrôle

L'aide ne crée ni membre ni affectation. Marquez l'étape **members** terminée manuellement dans le Centre d'aide uniquement après avoir contrôlé les profils et leurs périodes d'affectation.
