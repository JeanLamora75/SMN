---
title: "SMN-19 — Protection des paramètres privés et secrets"
type: feature
created: "2026-10-20"
status: in-progress
review_loop_iteration: 0
baseline_commit: "ce6c59c23d6e8204be9ec84c022dd0cd6f4a3a2e"
---

## Intent et contraintes gelées

Le contrat de la Story 1.9 Jira, validée fonctionnellement le 19/10/2026, prévoit une stricte séparation des paramètres métier et des secrets PostgreSQL et d'installation. Aucune modification du code ne doit exposer d'URL de connexion, clé, mot de passe, session, donnée individuelle ou fichier privé brut.

ADR-I0-002/003 : secrets dans le profil privé, chiffrement local sans question répétée à chaque connexion, copie de récupération par phrase indépendante **ultérieurement avec l'Epic 2**. Une restauration inter-PC ne peut pas être déclarée réussie sans essais. Ce développement n'instaure ni nouveau rôle, ni migration de base, ni transfert/export de clé.

## Acceptance mapping

| Critère | Solution I0 | Preuves attendues |
| --- | --- | --- |
| AC1 | `SMN_DATABASE_URL` depuis environnement privé validé ; clé et configurations chiffrées dans `LOCALAPPDATA` hors Git, session volatile aléatoire | Tests variables et confidentialité Windows |
| AC2 | Diagnostic public réduit à codes énumérés ; exception brute remplacée par code générique ; aucune donnée privée dans la réponse | Tests des erreurs et endpoints |
| AC3 | Administrateur : projection publique non secrète explicitement sélectionnée ; aucun export de clés/URL | Tests de projection et rôles précédents |
| AC4 | Dépôt `.gitignore` spécifique, `.env.example` fictif, paquet autonome sans fichiers privés | Tests du packaging |
| AC5 | Refus explicite si mot de passe d'URL ou clé de déchiffrement absents ; aucune création de clé pendant le déchiffrement | Tests Windows et validation URL |

## Carte d'implémentation

- `src/server/bootstrap/settings.ts` : stockage chiffré, écriture atomique, validation des fichiers privés, refus de la perte de clé.
- `src/server/bootstrap/portable.ts` : lecture du manifeste runtime privé et fichier temporaire imprévisible.
- `src/server/bootstrap/job.ts` : liste sûre de codes diagnostiques exposables.
- `src/server/db/config.ts` : aucun URI vide de mot de passe validé.
- `scripts/recover-admin.mjs` : accès aux fichiers privés sans suivre les liens symboliques.
- `.gitignore`, `scripts/windows/verify-package.mjs` : exclusion et contrôle du paquet.
- `tests/private-secrets.test.ts` : régression cryptographique et messages d'erreur.
- `docs/SECURITE-CONFIGURATION-SMN-19.md` : limites et guide de sécurité.

## Avancement de la livraison

- [x] Lecture de la Story Jira et des ADR applicables.
- [x] Protection explicite contre régénération des clés perdues et données invalides.
- [x] Diagnostic public à erreurs normalisées.
- [x] Format URI PostgreSQL sans mot de passe refusé.
- [x] Exclusion des fichiers sensibles du packaging et Git.
- [x] Tests automatisés ajoutés.
- [ ] CI Linux / Windows / paquet autonome finale.
- [ ] Vérification indépendante du diff.
- [ ] Recette sur Windows 11 utilisateur (différée).

## Limites d'attestation

Aucun accès à la base personnelle de l'utilisateur. Les tests de CI attestent le comportement du runner, jamais les ACL réelles de son profil Windows. Récupération de clé par phrase de sauvegarde : **hors périmètre SMN-19**, non développée et non testée ici.

Les liens et résultats précis de CI sont ajoutés après l'exécution.


## État de vérification au 20/10/2026

- [CI I0 — run 39477583968](https://github.com/JeanLamora75/SMN/actions/runs/39477583968) : **échec non diagnostiqué**, tentative initiale et relance. Les deux jobs retournent `failure` sans aucune étape visible et le téléchargement des journaux des jobs signale `404 BlobNotFound`. **Aucun test exécuté attesté** pour SMN-19.
- [CI paquet Windows — run 39477584166](https://github.com/JeanLamora75/SMN/actions/runs/39477584166) : **échec non diagnostiqué** dans les mêmes conditions (aucune étape visible, journal inaccessible), même après relance.
- Le statut **In progress** est maintenu, la [PR #14](https://github.com/JeanLamora75/SMN/pull/14) reste **draft**, aucun merge vers `main` ; l'échec d'infrastructure est une **hypothèse**, non une cause prouvée. Ne pas déclarer la CI verte.
- Reprise ciblée : retrouver les annotations GitHub Actions / résoudre l'indisponibilité des jobs, puis revalider les tests Linux/PostgreSQL, Windows et le paquet autonome, consulter le diff et fusionner seulement après preuve.
- L'utilisateur a reporté une recette Windows 11 **globale**, distincte des vérifications sur runners.
