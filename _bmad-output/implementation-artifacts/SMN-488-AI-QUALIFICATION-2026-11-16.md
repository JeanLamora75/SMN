# SMN-488 — Qualification transverse IA, sécurité et distribution Windows

Date : 16 novembre 2026. Agents : Amelia (implémentation/CI), Murat (stratégie de recette), Winston (architecture).
Epic SMN-479 ; Stories SMN-480 à SMN-487 ; continuité SMN-442 et refonte SMN-472 à SMN-478.

## Décision de qualification

Statut au dépôt : **candidat technique**. Ne pas annoncer l'activation d'une IA gratuite ni livrer une distribution publiquement comme « qualifiée » tant qu'un modèle Free n'a pas été essayé avec un compte de test empêchant toute facturation. Le catalogue SMN-482 reste volontairement vide ; l'absence de modèle entraîne un refus sûr.

## Livrables du présent lot

- Test `tests/smn-488-ai-qualification.test.ts` : approbation HMAC liée au compte/session/revision/connexion/texte, expiration et usage unique ; fournisseurs mockés (HTTP 402/429/503, redirection 307, réseau interrompu, une requête maximum, TLS fixe, pas de fallback) ; absence de persistance en retour d'envoi ; archivage uniquement sur clic ; contrôles d'origine, d'accès, d'absence d'exposition des clés, traduction FR/EN, modes Scrum/Kanban ; sécurité ZIP/restauration SMN-442.
- `scripts/windows/distribution-package-policy.mjs` refuse explicitement `data/ai-secrets` et le nom `.vault-master-v1` dans **toute** l'arborescence distribuée (et refuse tout lien symbolique). L'installateur neuve ne peut plus embarquer un ancien coffre, même par accident.
- Commande de recette `pnpm test:smn-488` : test de contrat de toutes les Stories 480 à 488, sans scripts `uv` ni accès réseau fournisseurs.
- Workflow autonome `.github/workflows/smn-488-ai-qualification.yml` : Linux et Windows exécutent les tests IA, régressions 472–478, contrôles ZIP SMN-442, typecheck et i18n. Un autre job exécute des recettes réelles PostgreSQL 18 sur **bases jetables** : installation neuve et mise à jour des briefs. Le même commit Git est utilisé par tous les jobs.
- Workflow de packaging Windows : exécute explicitement les scénarios SMN-480–488 **avant** la compilation et le packaging. Le ZIP public demeure soumis à déclenchement explicite (`workflow_dispatch`) et aux validations SMN-478 existantes, avec vérification du `sourceCommit`. Aucun paquet ancien n'est réutilisé.

## Matrice des exigences et preuves

| Critère | Preuve exécutable | Limite |
| --- | --- | --- |
| AC1 | Nouveau test mock + tests 480–488 | Test fournisseur authentifié non disponible |
| AC2 | Non-persistence send, ID idempotent, API/SQL, policy coffre ZIP | Vérification binaire ZIP final sur vrai Windows à confirmer |
| AC3 | Parité FR/EN, Scrum/Kanban, tests 472–478, 442 | Accessibilité clavier/lecteur d'écran réelle non attestée |
| AC4 | Jobs Linux/Windows + PostgreSQL isolé du workflow 488 | Deux PC physiques + panne réelle du processus non exécutés ici |
| AC5 | Tests avant build Windows, nettoyage source, provenance SHA | ZIP officiel seulement après recette complète et déclenchement manuel |

## Protocole de recette à compléter

1. Sur un PC Windows de test, créer deux connexions distinctes, chacune avec clé fictive locale puis, lorsque modèle autorisé, une vraie clé de compte **Free vérifié sans facturation**. Vérifier les tests locaux/externes, quota, 402/429, changement de modèle, suppressions, permissions et double-clic.
2. Préparer un brief Scrum et un Kanban, relire le TXT exact, cliquer « Prévisualiser », cocher le consentement puis envoyer. Sans bouton Save : aucun enregistrement en base. Avec Save : une seule réponse après clic, même en cas de retry après perte d'ACK.
3. Créer une sauvegarde ZIP depuis la UI SMN, vérifier hash, contenu des entrées, absence de maître/clefs IA, manifest/dump sans clé, ledgers et preuves signées.
4. Restaurer sur une **installation neuve séparée**, depuis la UI sans PowerShell. Vérifier restauration des TXT/réponses/identifiants, connexions désactivées avec clé à ressaisir, blocage d'envoi, puis revalidation et réactivation explicitement via UI.
5. Refaire sur un SMN existant avec données : tester interruption avant bascule, interruption après promotion, rollback, effacements historiques, maintenance et reconnexion obligatoire. Ne jamais forcer une bascule active depuis l'upload.
6. Après tous les workflows verts sur **le même SHA**, reconstruire depuis une source propre le ZIP Windows en `workflow_dispatch`. Vérifier la recette SMN-442 du paquet, la provenance SHA, Defender, les fichiers contenus et l'empreinte de livraison. Publier le ZIP seulement si ces preuves sont vertes.

## Consignes utilisateur et exploitation

- Tous les parcours d'administration et sauvegarde/restauration utilisent l'interface SMN ; aucune commande PowerShell n'est requise pour les utilisateurs.
- Clés API : saisir dans Paramètres → Connexions IA. La clé ne peut pas être relue en clair. Après transfert, ressaisir et tester sur le nouveau PC.
- Les modèles gratuits changent : l'allowlist par défaut est vide ; un candidat visible n'est pas un modèle utilisable. Aucun envoi ni fallback payant avant qualification des limites et du compte utilisateur.
- Après une réponse IA, **Enregistrer la réponse** est facultatif et volontaire. Les réponses non enregistrées sont perdues en quittant la page.
- Les limites de recette empêchent de déclarer SMN-488 « Terminée » sans preuves réelles de transfert et de non-facturation.

## Liens

- Jira : https://lmn24.atlassian.net/browse/SMN-488
- Actions GitHub : https://github.com/JeanLamora75/SMN/actions
- Qualification Windows : https://github.com/JeanLamora75/SMN/actions/workflows/portable-package.yml
