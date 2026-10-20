# SMN-14 — Connexion et sécurité des sessions (pilote local)

**Date :** 20 octobre 2026. **Périmètre :** installation individuelle Windows 11, PostgreSQL 18, sans exposition web publique. Le démarrage reste `pnpm dev` en développement et le port web demeure 3003. La base SMN installée en SMN-12 est réutilisée **sans migration ni réinitialisation**.

## Parcours de recette Windows

1. Récupérer la branche **main** dans GitHub Desktop (Fetch origin, puis Pull origin), fermer l'ancien serveur et démarrer SMN avec `pnpm dev`.
2. Ouvrir `http://localhost:3003` ; une installation reconnue doit présenter **Se connecter**. Cliquer le lien ou ouvrir `/login`.
3. Entrer le **nom d'utilisateur ou l'e-mail** créé dans SMN-12 et son mot de passe. Si les valeurs initiales du pilote ont été conservées, le compte est `admin` / `admin`. Si elles ont été personnalisées, utiliser celles réellement choisies.
4. À la première connexion, SMN impose **Modifier votre mot de passe initial**. Donner le mot de passe actuel, puis un nouveau mot de passe différent (minimum 4 caractères pour le pilote local). Après succès, l'accès `/app` est possible.
5. Vérifier la déconnexion avec **Se déconnecter** ; une nouvelle visite à `/app` doit renvoyer sur `/login`. Tester aussi une URL `/app` directe depuis une fenêtre privée.
6. Après connexion, si l'application reste inactive plus de 30 minutes, une nouvelle connexion est exigée. La session expire toujours au bout de 8 heures au plus tard, même si la personne reste active.

**Ne pas publier son mot de passe dans ChatGPT, Jira, captures ou logs.** Si SMN-12 a déjà créé son compte avec un mot de passe personnalisé, il n'est pas remplacé automatiquement et aucune base n'est recréée.

## Contrat de sécurité

- Cookies de session opaques générés aléatoirement (256 bits), **HttpOnly**, **SameSite=Strict**, **Secure sous HTTPS** ; durée cookie maximale de 8 heures. Pas de stockage du jeton dans localStorage et pas de case « Se souvenir de moi ».
- Vérification côté serveur à chaque page ou API privée : session présente et non révoquée, limite absolue de 8 heures, inactivité de 30 minutes, compte toujours présent et même version du hachage du mot de passe. Aucun GET de diagnostic ou poll ne renouvelle l'inactivité.
- Seules les **actions clavier/souris réellement détectées** sur les pages privées émettent un signal d'activité (au plus une fois par minute), soumis à une vérification d'origine et de session. Déconnexion et changement de mot de passe révoquent immédiatement le jeton antérieur.
- Les requêtes POST sensibles vérifient strictement l'origine du navigateur, le `Host` local et le format JSON. Les échecs de connexion ne révèlent pas si le compte existe. Cinq échecs en quinze minutes bloquent les tentatives pour cette identité dans le processus serveur.
- L'installation initiale a conservé `must_change_password=true`. Une session ne donne donc **aucun accès métier** avant le changement effectif. Les seuls rôles autorisés sont `admin` et `user`. Aucun tableau de bord métier complet n'est revendiqué à ce stade.

## Limites explicitement acceptées pour le pilote

- **Sessions en mémoire serveur** : redémarrer `pnpm dev` invalide toutes les sessions ; c'est un comportement conservateur. Pas de partage des sessions entre plusieurs processus Node : un hébergement web multi-instance devra utiliser un stockage central sécurisé et être requalifié.
- La table actuelle `smn_account` n'a pas encore de champ d'activation/désactivation, ni de workflow de récupération d'un compte : la gestion de ces scénarios appartient aux Stories ultérieures de l'Epic 1. Toute identité valide présente avec un rôle reconnu est considérée active pour ce pilote.
- Le minimum de 4 caractères du nouveau mot de passe reprend le choix du pilote local SMN-12 ; **ne pas exposer ce système sur Internet avec les valeurs initiales admin/admin**. Un durcissement des comptes et une protection des secrets sont requis avant tout déploiement réseau.
- L'application ne change pas le modèle Prisma ni les migrations existantes pour SMN-14. Les tests de bout en bout PostgreSQL et HTTP sont exécutés exclusivement sur les bases jetables de GitHub Actions ; la preuve de fonctionnement sur le PC utilisateur provient de la recette manuelle.

## Preuves

Consulter [la CI du dépôt](https://github.com/JeanLamora75/SMN/actions/workflows/verify-i0.yml), la [Story Jira](https://lmn24.atlassian.net/browse/SMN-14) et la [spécification BMAD](../_bmad-output/implementation-artifacts/spec-smn-14-authentification-sessions.md). Ne déclarer les contrôles réussis qu'après vérification de leurs résultats.
