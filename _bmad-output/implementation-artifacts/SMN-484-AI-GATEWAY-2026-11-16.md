# SMN-484 — Passerelle serveur pour IA gratuites (Amelia)

Date : 16 novembre 2026. Epic SMN-479. Branche main.

## Implémentation
- Deux opérations POST authentifiées, sous protection `authorizeApi`, d'origine locale et avec cookies de session : `/api/admin/ai-connections/preview` et `/api/admin/ai-connections/send`.
- Entrées limitées aux UUID d'une **archive finalisée** et d'une connexion. Aucun texte client n'est accepté par l'API. Le serveur vérifie le périmètre installation/équipe, récupère le TXT original et contrôle son SHA-256, sa taille et la révision/fournisseur/modèle gratuits de la connexion.
- L'aperçu reflète **exactement l'archive finalisée**, qui est le résultat immuable de la composition des tags et de la revue humaine. Le contrat signé par HMAC est lié à ID utilisateur, session, archive, hash, connexion, révision, fournisseur et modèle. TTL 120 secondes, nonce consommé une seule fois avant tout appel externe ; un redémarrage invalide tous les aperçus.
- Adaptateurs backend Gemini, Groq et OpenRouter : hôtes HTTPS fixes, schémas de requêtes distincts, aucune URL configurable, aucune redirection, aucun retry automatique, aucun fallback de modèle (OpenRouter `allow_fallbacks:false`), timeout 25 secondes, plafond texte/réponse et erreurs minimisées.
- Un endpoint de **test de connexion** envoie uniquement une phrase fictive, jamais une donnée de sprint ; après succès, le modèle et la clé contrôlés sont marqués testés et activés en base. Il refuse tout modèle absent de l'allowlist, et utilise aussi la réservation de quota.
- Les secrets sont lus via le coffre local SMN-481 puis le tampon est remis à zéro en `finally`. Le quota préventif SMN-482 est réservé avant l'appel. L'API retourne `stored:false` et ne crée aucune archive/réponse, aucun journal du prompt et aucun stockage Web.
- Aucun modèle gratuit n'a été approuvé sur un véritable compte : `REVIEWED_FREE_MODELS` reste **vide**. Les endpoints sont donc **bloqués par conception** et aucun appel API authentifié n'a eu lieu pendant ce développement.

## Limites et suites
- Le premier contrat privilégie une **archive déjà finalisée** comme source de vérité, plutôt que de reconstituer en direct les indicateurs depuis les bases mutables et d'accepter un texte client. La composition des tags et la revue du texte sont réalisées en amont par le moteur existant. Le parcours direct depuis le brouillon, sans archive préalable, est à cadrer avec SMN-485 en maintenant les mêmes garanties côté serveur.
- Le contrôle d'autorisation actuel pour `settings/write` restreint les envois aux administrateurs : un élargissement au Scrum Master nécessiterait une révision explicite de la politique d'accès et des droits par équipe.
- Le test fournisseur peut être lancé depuis le bouton de Paramètres **après** qualification d'une offre gratuite et création d'une clé valide. L'attestation réelle n'est pas possible sans clé de test Free et qualification SMN-482. Aucune fausse validation du test réel ne doit être affichée.
- L'exigence « pas de double appel » est respectée par nonces en mémoire d'un **processus**. Sur plusieurs processus, un aperçu émis dans un autre processus échoue fermé, et ne provoque pas une seconde émission.
- La confidentialité et la rétention des données dépendent aussi des politiques des fournisseurs externes ; ne jamais envoyer de données SMN réelles lors de la qualification.
- Avant clôture : tests Chromium d'aperçu/confirmation, tests PostgreSQL réels de quota/concurrence, essais authentifiés Free, recette de bout en bout et CI Windows/Linux sur le même commit.

## Tests
`tests/smn-484-ai-gateway.test.ts` : contrats HMAC, invalidation, double clic, endpoints, absence de redirections, limite de réponse, refus de modèles non qualifiés.
