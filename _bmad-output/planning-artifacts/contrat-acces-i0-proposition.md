# SMN — Contrat d'accès I0 : durées et récupération validées, conception à qualifier

**19 octobre 2026. Statut : préparation documentaire ; durées validées par D-PRD-138 et principe de récupération validé par D-PRD-139 ; mécanismes à qualifier, non implémentés.**
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
| Récupération | Procédure locale contrôlée, sans dépendance à l'envoi d'e-mails et sans réinitialisation anonyme accessible par navigateur | Principe validé D-PRD-139 ; contrôles techniques à spécifier |

L'exemple de récupération locale n'est pas une autorisation universelle de contourner l'authentification. La vérification de possession/contrôle de l'installation, le jeton à usage unique, le traitement des clés et l'audit doivent être définis avant livraison. La bibliothèque ne garantit pas à elle seule l'amorçage atomique multi-modules.

## 3. Politique de durée validée — D-PRD-138

- **Durée maximale de session : 8 heures**, à compter de la connexion ; au-delà, nouvelle authentification.
- **Expiration après 30 minutes d'inactivité**.
- Pas de session persistante « se souvenir de moi » dans cette première politique proposée.
- Expiration et nouvelle connexion doivent respecter la protection des brouillons prévue au PRD : pas de succès fictif, pas d'enregistrement automatique implicite. Le comportement de reprise du formulaire doit être conçu et testé.

**Ces valeurs ont été explicitement validées par l'utilisateur le 19/10/2026 à 22:19**, sous D-PRD-138. Ce sont les règles SMN, pas une recommandation de paramètres de l'éditeur. Le seuil d'inactivité devra être distingué de l'expiration absolue et de l'actualisation automatique de session : des requêtes de fond ne doivent pas maintenir arbitrairement une session en vie.

## 4. Constats issus de la documentation officielle

La documentation Better Auth distingue expiration et renouvellement de session, ainsi que fraîcheur pour opérations sensibles. Le défaut publié de sept jours n'est pas adopté comme politique SMN. Elle précise qu'un cache de session en cookie peut retarder une révocation sur un autre appareil ; notre proposition le désactive pour favoriser la vérification serveur.

La documentation décrit des fonctions de révocation et la révocation des autres sessions au changement de mot de passe. Leur cohérence transactionnelle dépend de l'adaptateur et de la configuration. Ne pas conclure à une garantie SMN sans tests. Sources consultées :

- https://better-auth.com/docs/concepts/session-management
- https://better-auth.com/docs/authentication/email-password
- https://better-auth.com/docs/reference/options

Le principe de récupération est validé par D-PRD-139, ses contrôles techniques restent à spécifier ; les durées de la section 3 sont désormais validées par l'utilisateur, pas une fonctionnalité prête à activer telle quelle dans la bibliothèque.

## 5. Preuves à produire lors de la construction autorisée

| Cas | Résultat attendu |
| --- | --- |
| Deux demandes d'initialisation simultanées | Une seule installation et un administrateur cohérents, pas de résidu partiel |
| Accès privé anonyme après installation | Refus, assistant non réactivé |
| Utilisateur tente une mutation ou une donnée individuelle | Refus serveur, aucun contenu confidentiel |
| Compte désactivé ou rôle réduit | Anciennes permissions refusées à la requête suivante |
| Déconnexion ou révocation | Ancienne session inutilisable |
| Changement de mot de passe | Révocation conforme à la politique et échec sans faux succès |
| Expiration absolue et inactivité | Comportements distincts, testés avec horloge contrôlée selon les seuils validés |
| Récupération administrateur | Procédure documentée à usage contrôlé, pas de porte dérobée ni secret publié |
| Retour après expiration | Aucun brouillon présenté à tort comme sauvegardé ; droits revérifiés |

**Non exécutés :** tous ces tests, toute installation de Better Auth, toute mutation PostgreSQL et tout développement. La réserve C3 reste ouverte. SMN-14 est actualisé avec les durées validées ; suivi de Sprint non généré.


## D-PRD-138 — Durée des sessions MVP

**19 octobre 2026 à 22:19 (Europe/Paris) — politique explicitement validée par l'utilisateur.**

- Durée absolue maximale : **8 heures** depuis la connexion. Une nouvelle authentification est requise à l'échéance, même si la personne est active.
- Expiration après **30 minutes d'inactivité utilisateur** ; les requêtes de fond ne constituent pas à elles seules une activité de la personne.
- **Aucune option « Se souvenir de moi » au MVP.**
- Contrôle côté serveur ; les refus et garanties de confidentialité existants restent applicables. La protection des brouillons reste celle du PRD ; cette politique n'introduit pas d'enregistrement automatique implicite.

S'applique aux deux profils MVP sans nouveau rôle. Complète FR-66/67 et les garanties AD-7/26/31 ; [SMN-14](https://lmn24.atlassian.net/browse/SMN-14) porte les critères correspondants. La validation de ces durées ne finalise ni le choix de Better Auth ni la procédure de récupération administrateur. Aucun développement, essai d'expiration ou résultat de sécurité attesté.


## D-PRD-139 — Récupération locale du compte administrateur MVP

**19 octobre 2026 à 22:23 (Europe/Paris) — principe explicitement validé par l'utilisateur.**

En cas de mot de passe administrateur oublié, une commande locale fournie avec SMN permet de définir un nouveau mot de passe, avec saisie masquée, sans installer d'outil supplémentaire ni demander une modification SQL manuelle. La récupération vise le compte administrateur existant : elle ne crée aucun second administrateur et ne dépend pas d'un envoi d'e-mail. Après réussite, toutes les sessions de ce compte sont révoquées ; une trace est conservée sans le mot de passe.

**Limite de la validation :** le mécanisme de contrôle du propriétaire de l'installation, les protections de la commande, la cohérence transactionnelle du renouvellement/révocation et les modalités de reprise restent à concevoir et à tester. La seule présence sur le poste ou une requête loopback ne constitue pas une preuve d'autorisation ; aucun bouton ou endpoint anonyme de récupération n'est introduit. Pas de mot de passe en argument de commande, dans Git ou dans les journaux.

Complète FR-66/67/70/72 et AD-7/9/10/26/31 ; [ticket de référence](https://lmn24.atlassian.net/browse/SMN-17). Les deux profils, la politique de session D-PRD-138 et le produit fixe restent inchangés. La récupération d'accès ne doit pas prétendre récupérer automatiquement les clés de chiffrement perdues. Aucun développement ni essai de récupération exécuté.
