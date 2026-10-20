# SMN-17 — Renouvellement des accès et récupération locale

## État et périmètre

Fonction développée sur la branche de reprise SMN-17. La recette globale sur le poste Windows 11 de l'utilisateur reste différée ; ne pas clôturer la Story avant cette recette.

Le MVP dispose uniquement de deux profils : **Administrateur** et **Utilisateur**. La sécurité est assurée côté serveur. Aucun mécanisme de récupération anonyme par navigateur, e-mail, deuxième administrateur automatique ou opération SQL manuelle n'est proposé.

## Changer son mot de passe

Depuis le tableau de bord, ouvrir **Sécurité du compte**. Confirmer le mot de passe actuel, saisir un nouveau mot de passe différent (contrainte MVP : 4 à 256 caractères). Le secret est dérivé par scrypt avec sel unique et jamais écrit en clair. La modification et son audit sont commités ensemble ; le cookie de la session renouvelée remplace l'ancien. Toutes les anciennes sessions sont rejetées par la comparaison de l'empreinte du mot de passe côté serveur. La modification invalide également toute phrase de secours précédemment préparée.

Le changement initial de mot de passe reste obligatoire dès la première connexion, sans autre donnée métier consultable avant remplacement.

## Préparer sa récupération, impérativement avant l'oubli

Un Administrateur déjà connecté et disposant de son mot de passe actuel peut préparer une **phrase de secours** dans **Sécurité du compte**. Elle doit comprendre au moins 20 caractères, ne doit pas être le mot de passe courant et doit être **distincte** de la phrase protégeant les sauvegardes de clés. Conservez-la dans un lieu sûr hors de SMN : l'application ne pourra pas l'afficher à nouveau. Seule sa dérivation salée est conservée. La préparation remplace une éventuelle phrase précédente.

Sans phrase préparée préalablement, **il n'est pas possible** de déclencher la récupération locale prévue par SMN-17. Ni une simple présence devant le navigateur, ni une requête locale anonyme ne permettent de contourner cette règle.

## Commande locale Windows

1. Démarrer normalement SMN pour disposer de sa connexion PostgreSQL locale ; ne pas réinstaller et ne pas effacer ses données.
2. Utiliser **Recuperer admin SMN.cmd** dans le dossier du paquet Windows livré. En environnement de développement, exécuter `pnpm recover:admin` depuis un terminal Windows et l'installation SMN correspondante.
3. Saisir au clavier, **sans affichage des caractères**, l'identifiant de l'Administrateur existant, sa phrase de secours et le nouveau mot de passe deux fois. Ne transmettre aucun secret en argument de commande ou par redirection de fichier.
4. Si la validation et la transaction réussissent, toutes ses sessions précédentes deviennent invalides. Se reconnecter avec le nouveau mot de passe et le changer immédiatement lorsque SMN l'exige. Préparer ensuite une **nouvelle** phrase de secours.

La commande refuse l'absence de terminal interactif, la mauvaise phrase, le compte inexistant ou inactif, une base non locale ou non reconnue, une transaction incomplète, ainsi que toute tentative sans phrase préparée. Un refus ne crée pas de compte ni de session. Elle n'est pas un outil de récupération des clés de chiffrement perdues.

## Données, migration et traçabilité

La migration **`20261020_smn17_recovery`** fait passer `smn_installation.schema_version` de 2 à 3 dans une transaction, avec verrou PostgreSQL et enregistrement de checksum dans `_prisma_migrations`. Elle ajoute uniquement :

- `smn_recovery_phrase` — relation vers le compte et empreinte salée, sans phrase en clair ;
- `smn_auth_audit` — compte, horodatage et type d'événement (`password_changed`, `recovery_prepared`, `recovery_used`) ; ni ancien mot de passe, ni nouveau, ni jeton.

Les comptes, produits, équipes et données existants ne sont pas réinstallés ni purgés. Les installations v1 et v2 reconnues sont migrées de façon additive à la première authentification serveur. Les migrations inconnues ou incomplètes sont rejetées.

## Vérification et limites

Tests unitaires de la dérivation, validation, traces et transactions ; sonde HTTP réelle de la préparation de phrase, des autorisations et des révocations sur PostgreSQL éphémère. [CI Linux/PostgreSQL et Windows réussie](https://github.com/JeanLamora75/SMN/actions/runs/39472442560) et [paquet Windows autonome vérifié](https://github.com/JeanLamora75/SMN/actions/runs/39472442745), avec [artefact Windows](https://github.com/JeanLamora75/SMN/actions/runs/39472442745/artifacts/12286339309). Le test du paquet autonome Windows refuse une récupération via stdin non interactif. **La saisie interactive de secours et la récupération effective sur le PC de l'utilisateur restent à valider dans la recette globale.**

Sources : [SMN-17 dans Jira](https://lmn24.atlassian.net/browse/SMN-17), [spécification BMAD](../_bmad-output/implementation-artifacts/spec-smn-17-renouvellement-acces.md).
