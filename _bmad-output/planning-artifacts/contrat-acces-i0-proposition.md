# SMN — Contrat d'accès I0 : proposition à valider

**19 octobre 2026. Statut : préparation documentaire ; compléments techniques proposés, non implémentés.**
Sources internes : [Spine](architecture/architecture-SMN-2026-10-19/ARCHITECTURE-SPINE.md), [sécurité](architecture/architecture-SMN-2026-10-19/SECURITE-EXPLOITATION.md), [préparation I0](preparation-technique-i0.md). PostgreSQL précis sera confirmé ultérieurement ; cela ne bloque pas la préparation de ce contrat.

## 1. Garanties déjà approuvées

Deux profils, authentification après installation vierge, premier administrateur créé une seule fois, changement du secret initial avant usage métier. Comptes applicatifs indépendants des membres Agile. Accès serveur contrôlé sur pages/API/documents. Utilisateur : lecture collective et téléchargement autorisé ; aucune mutation, génération ou lecture individuelle sensible. Une équipe Scrum/Kanban au MVP. Ces décisions ne sont pas soumises à nouvelle validation.

## 2. Stratégie technique proposée pour respecter les garanties

| Sujet | Proposition de conception | Statut |
| --- | --- | --- |
| Session | Session conservée en PostgreSQL ; navigateur porteur d'un identifiant de session, pas source de vérité du rôle | Candidat technique |
| Révocation | Vérifier session, activation et droits côté serveur sur chaque requête protégée ; cache de session client désactivé au départ | Concrétise le refus immédiat déjà attendu ; essai nécessaire |
| Identité | Better Auth reste candidat ; versions/adaptateur et transactions à qualifier | Aucun choix final de bibliothèque |
| Cookies et mutations | HttpOnly/SameSite, Secure sous HTTPS selon le contrat local ; protections CSRF et origine sur mutations | Garanties existantes, mécanisme à éprouver |
| Rôles | Changement/désactivation par Administrateur ; anciennes sessions privées de leurs anciens droits à la requête suivante | Garantie existante |
| Mots de passe | Dérivation par bibliothèque éprouvée, limitation des essais, aucun secret en log ou document | Paramétrage à vérifier, pas d'algorithme maison |
| Amorçage | Création cohérente de l'installation, équipe et administrateur, avec contrôle de concurrence et fermeture durable de l'assistant | Architecture existante ; vérifier l'atomicité réelle de l'intégration |
| Récupération | Procédure locale contrôlée, sans dépendance à l'envoi d'e-mails et sans réinitialisation anonyme accessible par navigateur | Orientation proposée ; procédure détaillée encore à spécifier |

L'exemple de récupération locale n'est pas une autorisation universelle de contourner l'authentification. La vérification de possession/contrôle de l'installation, le jeton à usage unique, le traitement des clés et l'audit doivent être définis avant livraison. La bibliothèque ne garantit pas à elle seule l'amorçage atomique multi-modules.

## 3. Nouvelle politique de durée proposée — validation utilisateur nécessaire

- **Durée maximale de session : 8 heures**, à compter de la connexion ; au-delà, nouvelle authentification.
- **Expiration après 30 minutes d'inactivité**.
- Pas de session persistante « se souvenir de moi » dans cette première politique proposée.
- Expiration et nouvelle connexion doivent respecter la protection des brouillons prévue au PRD : pas de succès fictif, pas d'enregistrement automatique implicite. Le comportement de reprise du formulaire doit être conçu et testé.

**Ces valeurs sont des propositions SMN pour discussion**, pas des seuils déjà validés, ni les paramètres recommandés par l'éditeur. Le seuil d'inactivité devra être distingué de l'expiration absolue et de l'actualisation automatique de session : des requêtes de fond ne doivent pas maintenir arbitrairement une session en vie.

## 4. Constats issus de la documentation officielle

La documentation Better Auth distingue expiration et renouvellement de session, ainsi que fraîcheur pour opérations sensibles. Le défaut publié de sept jours n'est pas adopté comme politique SMN. Elle précise qu'un cache de session en cookie peut retarder une révocation sur un autre appareil ; notre proposition le désactive pour favoriser la vérification serveur.

La documentation décrit des fonctions de révocation et la révocation des autres sessions au changement de mot de passe. Leur cohérence transactionnelle dépend de l'adaptateur et de la configuration. Ne pas conclure à une garantie SMN sans tests. Sources consultées :

- https://better-auth.com/docs/concepts/session-management
- https://better-auth.com/docs/authentication/email-password
- https://better-auth.com/docs/reference/options

Les orientations de récupération et les durées de la section 3 sont notre proposition, pas une fonctionnalité prête à activer telle quelle dans la bibliothèque.

## 5. Preuves à produire lors de la construction autorisée

| Cas | Résultat attendu |
| --- | --- |
| Deux demandes d'initialisation simultanées | Une seule installation et un administrateur cohérents, pas de résidu partiel |
| Accès privé anonyme après installation | Refus, assistant non réactivé |
| Utilisateur tente une mutation ou une donnée individuelle | Refus serveur, aucun contenu confidentiel |
| Compte désactivé ou rôle réduit | Anciennes permissions refusées à la requête suivante |
| Déconnexion ou révocation | Ancienne session inutilisable |
| Changement de mot de passe | Révocation conforme à la politique et échec sans faux succès |
| Expiration absolue et inactivité | Comportements distincts, testés avec horloge contrôlée après validation des seuils |
| Récupération administrateur | Procédure documentée à usage contrôlé, pas de porte dérobée ni secret publié |
| Retour après expiration | Aucun brouillon présenté à tort comme sauvegardé ; droits revérifiés |

**Non exécutés :** tous ces tests, toute installation de Better Auth, toute mutation PostgreSQL et tout développement. La réserve C3 reste ouverte. Pas de changement Jira pour des valeurs encore proposées ; suivi de Sprint non généré.
