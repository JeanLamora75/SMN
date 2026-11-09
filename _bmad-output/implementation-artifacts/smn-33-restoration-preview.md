# SMN-33 — Prévisualiser les effets et risques d'une restauration

Story Jira : https://lmn24.atlassian.net/browse/SMN-33 — Epic 2. Implémentation de lecture seule sur `main` (9 novembre 2026).

## Fonctionnement
- Administration → Sauvegardes → Inventaire → **Prévisualiser la restauration**.
- Accès réservé à l'Administrateur (session et origine locale vérifiées).
- L'API `GET /api/admin/backups/preview?id=<uuid>` exige une session autorisée et ne dispose d'aucune route d'exécution de restauration.
- Le paquet est **revérifié à chaque demande** par `inspectBackup`, sans réutiliser le statut historique du contrôle.
- Les métadonnées courantes sont lues dans une transaction PostgreSQL `READ ONLY`. L'inventaire des documents privés est parcouru sans modification.
- L'aperçu montre la date, les versions, l'origine, le nombre de composants et de documents privés, ainsi que le fait qu'une restauration remplacerait la **base complète** et les fichiers privés.
- Les contenus privés, secrets et données personnelles ne sont pas révélés dans l'aperçu. Les composants vérifiés sont comptés, sans déchiffrement des données en UI.

## Alertes et sécurité
- Paquet invalide/non vérifié, origine inconnue ou étrangère, version de schéma plus ancienne ou plus récente, version majeure PostgreSQL incompatible, version applicative différente, inventaire actuel illisible.
- Si la sauvegarde précède l'état courant, prévenir de la perte potentielle des changements.
- L'absence de registre fiable des données personnelles effacées entraîne **toujours** un avertissement conservatoire `privacy-not-cleared`. L'application **ne propose aucun bouton Restaurer** : cette action relève de SMN-34 et nécessite les garanties SMN-40.
- Fermer l'aperçu ne change aucune donnée. Aucun dump n'est restauré, aucune base ni aucun document métier n'est écrasé.

## Vérifications
- Test ajouté : `tests/backup-restore-preview.test.ts` (versions, origine, paquet invalide, documents privés, confidentialité).
- Exécution recommandée sur Windows : `pnpm exec tsx --test tests/backup-restore-preview.test.ts`, puis `pnpm i18n:check`, `pnpm typecheck`, `pnpm test` et `pnpm build`.
- **Tests et recette Windows non exécutés depuis GitHub**. Une validation bout en bout reste nécessaire ; Jira doit rester `En cours` tant que les preuves manquent.

## Adaptation BMAD
Le skill `.agents/skills/bmad-build/SKILL.md` repose sur `uv run ... render_skill.py`, non exécutable sur le dépôt GitHub. L'intervention est une implémentation manuelle adaptée aux connecteurs, **pas** une exécution du workflow généré ; aucune qualification `uv` ou CI n'est revendiquée.
