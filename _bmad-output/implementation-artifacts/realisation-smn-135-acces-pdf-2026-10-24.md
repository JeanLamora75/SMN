# SMN-135 — Consultation et téléchargement de PDF autorisés

Jira : https://lmn24.atlassian.net/browse/SMN-135 (Story 6.21).

## Incrément publié sur main
- Téléchargement de l'archive PDF exacte depuis le stockage privé, sans régénération et avec contrôle de l'empreinte d'intégrité.
- Contrôle serveur du rattachement à l'installation et du masquage, y compris sur URL directe.
- L'Administrateur peut télécharger ; un Utilisateur doit avoir une permission explicite dans `smn_report_archive_grant`, rattachée à l'identifiant d'archive. Aucune autorisation implicite en l'absence de la table ou de permission.
- Endpoint POST administrateur `/api/admin/reports/archives/[id]/grants` avec `userId` pour autoriser la lecture d'une archive à un compte actif de rôle user. Le droit de générer reste réservé à l'Administrateur.
- Tests du modèle de droits `tests/smn-135-pdf-access.test.ts`.

## Non terminé
- L'interface pour gérer les autorisations des utilisateurs et leur bibliothèque d'archives n'est pas développée ; l'API administrative de permission seule existe.
- Un endpoint de révocation et une interface de suivi/audit des permissions sont nécessaires avant une diffusion réelle.
- Le générateur PDF et le processus d'archivage final SMN-127/128 manquent toujours ; aucun PDF produit par ce parcours.
- Recette des erreurs fichier absent/corrompu, sécurité des routes, schéma PostgreSQL et permissions requise.
- Aucun test, typecheck ou build exécuté dans ce contexte. Jira reste ouverte.

Vérification : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-135-pdf-access.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
