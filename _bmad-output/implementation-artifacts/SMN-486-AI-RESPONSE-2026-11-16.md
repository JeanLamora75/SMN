# SMN-486 — Enregistrement volontaire des réponses IA

Date : 16 novembre 2026. Epic SMN-479. Auteur fonctionnel : Amelia (implémentation).

## Fonctionnel livré
- Après l'envoi IA du brief, la réponse reste dans la mémoire de la page, affichée « Non enregistrée ». Aucun appel au serveur d'archivage n'a lieu au retour de l'IA.
- Trois actions indépendantes : **Copier**, **Enregistrer la réponse**, **Nouvelle demande**. Seule « Enregistrer la réponse » provoque un POST vers le module historique `/api/ai-briefs/archives/[id]/responses`.
- L'appel utilise l'archive TXT finalisée, l'équipe validée par le serveur, l'utilisateur connecté, la réponse exacte et le fournisseur/modèle retournés par la passerelle SMN-484. Le TXT original n'est pas modifié.
- Affichage « Réponse enregistrée » seulement après une réponse HTTP réussie attestant le COMMIT PostgreSQL. L'identifiant de réponse est conservé dans le composant ; le bouton Save est désactivé après succès.
- Une clé d'idempotence UUID unique est générée **lors de la réception de la réponse**, pas lors du clic Save. Les tentatives répétées soumettent la même clé. `INSERT ... ON CONFLICT(id) DO NOTHING`, puis rapprochement sous transaction de l'auteur, l'archive, l'équipe, du texte intégral et du fournisseur/modèle. Même réponse : confirmation déjà enregistrée ; divergence : conflit refusé sans fuite ni écrasement.
- Aucun `localStorage`, `sessionStorage`, IndexedDB ni sauvegarde silencieuse. Si le POST échoue ou sa réponse se perd, la réponse reste visible et peut être réessayée avec sa même clé. Fenêtre de fermeture/rechargement et liens de l'écran avertissent en cas de réponse non enregistrée ; nouvelle demande soumise à confirmation. Une navigation externe au composant peut néanmoins faire perdre un état purement volatile.
- L'API existante reçoit aussi une protection d'origine same-host (CSRF) avant d'accepter le POST et continue à utiliser `authorizeApi` pour les droits administrateur, avec résolution de la seule équipe de l'installation.
- Les anciennes réponses collées manuellement restent compatibles sans clé d'idempotence fournie : SMN crée un nouvel UUID.

## Contrôles et sécurité
- Le serveur ne renvoie pas de secret et ne persiste aucune réponse en dehors d'un POST explicite.
- Le contrôle d'intégrité SHA-256 de l'archive est refait par `readPrivateBriefArchive` avant toute insertion.
- Les accès à une archive étrangère ou une clé de collision ne peuvent ni lire ni modifier une réponse existante.
- Les tests mock PostgreSQL vérifient la première insertion, le replay sans doublon, le refus d'un ID déjà utilisé pour un texte différent et la préservation du TXT. Les tests statiques vérifient les boutons, l'absence de stockage Web, la protection d'origine et la parité FR/EN.

## Réserves
- Les fournisseurs restent inaccessibles tant que SMN-482 ne qualifie aucun véritable compte API Free et que les tests authentifiés ne sont pas réalisés. Cette Story n'active aucun modèle payant.
- Les tests de navigateur effectif, le PostgreSQL isolé, la CI Linux/Windows et le scénario réseau interrompu devront être vérifiés sur le même commit avant fermeture de la Story.
- La sauvegarde/restauration ZIP des réponses archivées et le traitement des clés du nouvel ordinateur relèvent de SMN-487.
