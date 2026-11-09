# SMN-40 — Non-réintroduction des données personnelles effacées

**État au 9 novembre 2026 : partiellement implémentée, barrière de restauration active et bloquante.**
Jira : https://lmn24.atlassian.net/browse/SMN-40 ; Epic 2.
Ce document fait foi pour les limites de l'implémentation publiée sur `main`.

## Exigence
Une sauvegarde techniquement intègre peut contenir des données personnelles supprimées depuis sa création. La date et les empreintes du paquet ne démontrent **pas** que ces données sont légalement/restaurablement réintroduisibles. En l'absence d'une preuve indépendante et complète, la reprise doit être suspendue.

## Implémentation
- `src/server/backup/erasure-protection.ts` : contrat explicite `ErasureEvidence` ; verdict `evaluateErasureProtection` purement fonctionnel et défensif.
- `src/server/backup/restore-readiness.ts` : intègre le verdict à l'évaluation SMN-34 et distingue `privacy-erasures-unverified`, `privacy-coverage-gap` et `privacy-erased-data`.
- `src/app/api/admin/backups/restore/preflight/route.ts` : récupère la preuve du seul serveur, jamais depuis un champ du client. La réponse reste HTTP 409 et **aucun mécanisme de restauration n'est déclenché**.
- UI : diagnostics déjà affichés dans l'aperçu SMN-33/34, messages FR/EN complétés.
- `tests/backup-erasure-protection.test.ts` : cas de dates absentes, preuve non fiable, lacune historique, effacement ultérieur, intégrité et refus persistant de restaurer.

## Décisions de sécurité
1. **Preuve externe à la base restaurable** : le futur registre d'effacement devra être protégé contre la modification, append-only ou équivalent, avec vérification cryptographique et traçabilité minimale (horodatage, portée et références non réidentifiantes). La présence de zéro entrée ne prouve jamais l'absence d'effacement sans attestation fiable de couverture complète.
2. **Pas de faux registre** : `currentErasureEvidence()` retourne `ledger-not-implemented`, car SMN-39 n'a pas encore livré de producteur sûr d'effacements. Le code ne déclare ni preuve ni historique existant. Aucun événement d'effacement ne peut être inventé.
3. **Couverture temporelle** : une preuve vérifiée doit couvrir la création du paquet et être suffisamment récente ; elle est refusée si les dates sont incohérentes. Un effacement postérieur impose un blocage ; autoriser le rétablissement nécessiterait une suppression sélective démontrée, contrôlée dans une base isolée.
4. **Copies externes** : une copie exportée hors du stockage géré est hors du contrôle de suppression de SMN. Les délais de rétention des paquets ne détruisent pas les rapports PDF/TXT archivés ni les snapshots métier.
5. **Pas de contournement** : le backend n'accepte pas d'indicateur `privacyOk` ou de confirmation permettant de supprimer les alertes ; même en présence d'une preuve sans effacement, SMN-34 reste bloquée tant que reconstruction, point de reprise, bascule et sessions ne sont pas qualifiés.

## Correspondance avec la Story
- **AC1 — partiel** : contrat du marqueur défini. Pas de registre opposable alimenté, en attente du flux d'effacement SMN-39.
- **AC2 — partiel** : contrôle des preuves et blocage fonctionnel implémentés ; preuve fiable non encore produite.
- **AC3 — non réalisé** : pas de restauration effective ni de reconstruction expurgée validée ; dépend de SMN-34 et SMN-39.
- **AC4 — conservé** : la politique existante de rétention est limitée aux sauvegardes gérées ; aucune modification ni suppression ajoutée à cette Story.
- **AC5 — couvert dans le contrat et l'interface existante** : copies externes hors contrôle de SMN.

## Validation
Contrôles de présence des fichiers GitHub à effectuer / fichiers de tests rédigés. Les tests `pnpm exec tsx --test tests/backup-erasure-protection.test.ts`, `pnpm typecheck`, `pnpm i18n:check`, `pnpm test` et une recette Windows/PostgreSQL sur installation isolée **ne sont pas réputés exécutés**. Ne pas marquer SMN-40 « Terminée » avant implémentation et qualification de SMN-39 et SMN-34.

## Adaptation BMAD
Le skill `.agents/skills/bmad-build/SKILL.md` exige une commande `uv` de génération du workflow, non exécutée depuis GitHub. Les modifications ont été faites via le connecteur GitHub comme adaptation explicite et non comme workflow BMAD exécuté.
