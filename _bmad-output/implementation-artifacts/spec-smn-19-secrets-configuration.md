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
- [x] Tests automatisés ajoutés (exécution GitHub Actions toujours indisponible).
- [ ] CI Linux / Windows / paquet autonome finale.
- [x] Relecture statique du diff par le développeur (ne remplace pas une revue indépendante).
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

## Relecture statique complémentaire du 20/10/2026 — périmètre et preuves

Les constats suivants portent sur **le code commité et inspecté**, non sur des tests exécutés. La distinction demeure obligatoire.

| AC | Vérification de code | Résultat statique |
| --- | --- | --- |
| AC1 | `src/server/bootstrap/settings.ts` : clé AES-256-GCM aléatoire, configuration chiffrée dans LocalAppData, absence de génération au déchiffrement ; `src/server/auth/session.ts` : session aléatoire en mémoire ; `src/server/db/config.ts` : URL locale avec mot de passe | Conforme au contrat de code inspecté ; ACL Windows à recetter |
| AC2 | `src/server/bootstrap/job.ts` : liste positive de codes d'erreur publics ; `scripts/recover-admin.mjs` : messages d'exception whitelistés ; `src/server/installation/current.ts` et `src/lib/messages.ts` : erreur `configuration-key-missing` normalisée sans chemin | Conforme au contrat de code inspecté ; test HTTP complet à exécuter |
| AC3 | `src/app/api/admin/settings/route.ts` et `src/server/settings/manager.ts` existants : projection explicite des seuls réglages non secrets avec authentification/autorisation | Régression interdite, parcours CI initialement validé dans SMN-18 ; exécution sur cette branche manquante |
| AC4 | `.gitignore` exclut clés et fichiers privés ; `.env.example` contient seulement des placeholders ; `scripts/windows/verify-package.mjs` vérifie absence de fichiers sensibles à la racine | Inspection conforme ; paquet de cette branche non construit |
| AC5 | `src/server/bootstrap/settings.ts` refuse la clé absente et la décryption corrompue ; lecture absente ne crée pas le répertoire ; `src/server/installation/current.ts` expose un code sans secret | Conforme au contrat de code inspecté ; tests Windows non exécutés |

### Corrections complémentaires postérieures à la PR initiale

- `src/server/bootstrap/settings.ts` : préserver l'erreur sûre `configuration-key-missing` et `configuration-decryption-failed` plutôt que la masquer derrière `postgres-config-invalid` ; aucun dossier n'est créé par une simple lecture.
- `src/server/installation/{current,diagnostic}.ts`, `src/lib/messages.ts` : diagnostic FR/EN d'une clé manquante, en bloquant l'accès métier et sans proposer une réinstallation implicite.
- `scripts/recover-admin.mjs` : filtrer les erreurs terminales avant tout affichage ; les messages potentiellement construits par JSON, pg ou crypto ne sont pas reproduits.
- `tests/private-secrets.test.ts` : test déterministe de l'altération AES-GCM, de l'absence d'une clé et des lectures non créatrices.

### Bloquant GitHub Actions documenté

Pour le commit de code [`04affb72`](https://github.com/JeanLamora75/SMN/commit/04affb728d86c109104403ec9153111039ad323c) :

- [Vérification I0 39479862588](https://github.com/JeanLamora75/SMN/actions/runs/39479862588) : `failure` ; jobs sans runner attribué, zéro étape publiée.
- [Paquet Windows 39479862524](https://github.com/JeanLamora75/SMN/actions/runs/39479862524) : `failure` ; zéro étape publiée. Les échecs identiques sont observés sur plusieurs commits précédents, y compris deux tentatives de runs initiaux.
- Les jobs meurent en environ une à deux secondes et aucun test n'est attesté. Les journaux de jobs précédents renvoyaient `404 BlobNotFound`. Aucune preuve ne permet d'affirmer une cause exacte (facturation/quota, indisponibilité des runners ou autre). Les trois jobs échouent **avant toute attribution de runner**.
- À titre de référence et **pas de validation de SMN-19**, les suites du `main` antérieur ont réussi : [I0 39475715289](https://github.com/JeanLamora75/SMN/actions/runs/39475715289) et [paquet 39475618860](https://github.com/JeanLamora75/SMN/actions/runs/39475618860).

**Décision de sécurité : PR #14 maintenue draft, pas de fusion sur main, BMAD in-progress/Jira En cours.** Pour achever la vérification, l'exécution effective des jobs Linux/PostgreSQL, Windows et packaging ainsi qu'une revue indépendante reste indispensable. La recette sur le PC Windows 11 personnel est différée conformément à l'accord. Ne jamais transformer les contrôles statiques en déclarations de tests réussis.

La reprise technique peut partir de la [PR n°14](https://github.com/JeanLamora75/SMN/pull/14), sans recommencer le développement. Vérifier dans GitHub Actions la capacité des runners et les notifications de limite de consommation/facturation si présentes (non établi ici), puis relancer les workflows.