# SMN-34 — Restauration contrôlée : état d'implémentation et protocole

Date : 09/11/2026. Jira : https://lmn24.atlassian.net/browse/SMN-34. Epic 2.

## Statut réel
**Partiellement implémenté — garde-fous de préparation uniquement. La restauration n'est pas exécutable.**
Cette limitation est intentionnelle : SMN-33 constate un risque d'effacement non qualifié et le code ne fournit pas encore de bascule atomique vérifiée PostgreSQL + documents. Aucun succès de restauration ni recette n'est attesté.

## Code publié sur main
- `src/server/backup/restore-readiness.ts` : classification pure des incompatibilités et exigences manquantes. L'issue de préflight est **toujours bloquée**, indépendamment d'un paramètre envoyé par le client.
- `src/app/api/admin/backups/restore/preflight/route.ts` : route POST authentifiée administrateur et protégée contre les origines non autorisées ; ne fait que relire SMN-33 et évaluer les prérequis. Réponse HTTP 409 explicite ; aucune commande PostgreSQL de restauration, aucune mutation de fichiers métier.
- `src/app/app/admin/backups/backups-admin.tsx` : contrôle des prérequis depuis l'aperçu d'une archive, messages traduits FR/EN.
- `tests/backup-restore-readiness.test.ts` : tests rédigés, non exécutés dans l'environnement GitHub connecté.

## Conception requise pour terminer les AC1–AC5
1. **Qualification et confirmation séparée** : revalider le paquet au moment de l'action, son origine, les versions, l'inventaire et les effacements. Confirmer explicitement l'identifiant et les pertes potentielles ; refuser toute confirmation obsolète.
2. **Construction isolée** : obtenir une clé locale ou recouvrée par phrase secrète sans logs, déchiffrer en flux le dump PostgreSQL et les documents dans un espace privé isolé ; `pg_restore` dans une base de test dédiée, jamais dans la base active. Vérifier schémas, contraintes, références et documents par couples manifeste/contenu ; pas de fichiers fictifs.
3. **Point de reprise avant bascule** : produire une sauvegarde complète cohérente des données actuellement actives ; vérifier sa lecture et sa capacité réelle de retour arrière.
4. **Bascule** : suspendre les écritures et les sessions, acquérir les verrous appropriés, remplacer DB et documents de manière coordonnée. PostgreSQL et le système de fichiers ne forment **pas une transaction atomique commune** : prévoir journal d'intention durable, phases explicites et stratégie de reprise après crash/rupture de courant ; ne jamais servir un état mixte comme opérationnel.
5. **Post-contrôles** : réouvrir le service seulement après contrôles d'intégrité, diagnostic de restauration effective, journal d'audit pérenne, invalidation des sessions sensibles, contrôle des chemins et autorisations. Conserver le point de reprise tant que la restauration n'est pas validée.
6. **Confidentialité SMN-40** : exploiter des traces d'effacement **hors** de la base susceptible d'être restaurée. S'il est impossible de prouver l'absence d'effacements ou de filtrer l'archive, restauration suspendue.
7. **Tests** : paquet corrompu, clé perdue/mauvaise phrase, base différente, schema ancien/nouveau, PostgreSQL incompatible, archives sans documents, fichiers orphelins, absence de permissions, coupure au milieu de chaque phase, retour arrière, sessions actives, fuite de secrets et données effacées. Recette Windows 11 PostgreSQL 18.6 sur base jetable.

## Acceptation
- AC1–AC4 : **non terminés** (pas de moteur de restauration).
- AC5 : les contrôles d'inventaire des documents existants sont disponibles côté vérification mais doivent être démontrés sur une restauration réelle.
- Les commandes `pnpm i18n:check`, `pnpm typecheck`, `pnpm test`, `pnpm build` et une recette PostgreSQL Windows restent **à exécuter**.
- Respect du mode ChatGPT + connecteurs GitHub/Jira ; script `uv` du skill BMAD non exécuté.

**Ne pas passer la Story à Terminée** ni présenter cette livraison comme permettant de charger une sauvegarde. L'API de préflight répond 409 et l'interface ne comporte pas de bouton exécutant une restauration.


## Lot de finalisation demandé — répétition de restauration isolée (09/11/2026)

**Statut de conformité : NON TERMINÉE.** Une reconstruction technique est désormais codée pour une base PostgreSQL 18 jetable. La recette réelle et la restauration active demeurent bloquées pour ne pas perdre les données et ne pas réintroduire d'effacements personnels.

### Ajouts publiés
- `src/server/backup/restore-sandbox-policy.ts` : refuse tout URI de cible non locale, identique à la source, non nommé `smn_restore_test_*`, sur un autre serveur/port ou sous un autre utilisateur PostgreSQL. Ce contrat est testable sans accéder aux données.
- `src/server/backup/restore-sandbox.ts` : relecture de l'intégrité réelle de chaque paquet, déverrouillage par clé locale ou phrase de récupération (variable d'environnement non loguée), vérification des métadonnées signées par AES-GCM, déchiffrement du dump PostgreSQL **en flux vers l'entrée standard** de `pg_restore` (aucun dump SQL clair écrit sur disque), `--single-transaction --exit-on-error` dans une base dédiée **préexistante et vide**. Extraction privée temporaire des documents TXT/PDF capturés et contrôle des couples manifestes/fichiers par `scanDocuments`. Nettoyage en `finally`. Les éventuelles sorties PostgreSQL contenant des secrets ne sont pas relayées.
- `scripts/smn-34-restore-rehearsal.ts` : entrée CLI explicite `--archive <uuid> --sandbox-only`. Nécessite `SMN_RESTORE_TEST_URL` : jamais de création/suppression automatique de base, aucune application sur `SMN_DATABASE_URL` et aucun branchement au bouton de restauration de l'application.
- `tests/smn-34-restore-sandbox.test.ts` : matrice de refus de cibles locales actives, distantes, sur mauvais port, identiques, non dédiées ou sans mot de passe.
- `.github/workflows/smn-34-restore-sandbox.yml` : contrôles sur Windows/Linux (tests de politique, typecheck et traductions), déclenchables sur `main`.
- Le backend SMN-34 conserve `canExecute:false`, car la preuve de confidentialité SMN-40 demeure indisponible.

### Découverte bloquante sur AC1/AC5
Le format réel de sauvegarde `runner.ts` capture le dump et le contenu de `SMN_PRIVATE_DOCUMENTS_DIR`. **Il ne contient pas automatiquement les PDF des rapports archivés par `pdf-archive-store.ts` dans `SMN_PRIVATE_REPORT_ARCHIVE_DIR`, ni les fichiers générés de `SMN_OFFICE_REPORTS_DIR`.** Les références `smn_report_pdf_archive` sont donc présentes dans la base restaurée, mais leurs fichiers peuvent manquer. Le simulateur interroge le nombre de ces références et retourne `incomplete-archive-scope` si elles existent. Il ne crée aucun faux PDF/TXT. Ce contrôle **ne constitue pas** un inventaire exhaustif des autres types de fichiers hors paquet. Le résultat expose systématiquement `fullRestoreQualified:false`. Les sauvegardes existantes ne sont pas déclarées complètes rétroactivement.

### Qualification Windows / PostgreSQL 18 — protocole
1. Contrôler les fichiers de `main`, la version de PostgreSQL 18, les outils `pg_restore` 18 et les variables de connexion **sans publier aucune URL contenant le mot de passe**.
2. Créer manuellement une **nouvelle base vide dédiée** : nom `smn_restore_test_abcdef1234`, sur le même serveur local, avec le même compte que la base source. Vérifier dans pg_catalog qu'aucune relation métier n'y existe. Ne pas utiliser une base contenant des données de travail.
3. Définir `SMN_RESTORE_TEST_URL` uniquement pour cette base jetable. Une copie de la clé locale (dans le répertoire des sauvegardes) ou `SMN_BACKUP_RECOVERY_PHRASE` doit permettre l'ouverture du paquet.
4. Exécuter depuis la racine du projet :
   ```powershell
   pnpm exec tsx --test tests/smn-34-restore-sandbox.test.ts tests/backup-restore-readiness.test.ts tests/backup-erasure-protection.test.ts
   pnpm typecheck
   pnpm i18n:check
   pnpm exec tsx scripts/smn-34-restore-rehearsal.ts --archive <UUID_DE_SAUVEGARDE> --sandbox-only
   ```
5. Constater : schéma version conforme, cohérence d'intégrité, nombre de documents, statut de reconstruction, nombre de références PDF non capturées. Un statut de reconstruction dans la sandbox n'autorise **jamais** une bascule active.
6. Tester séparément : paquet chiffré corrompu, clé erronée, phrase erronée, schéma incompatible, cible non vide, cible active ou distante, fichiers document orphelins, coupure pendant `pg_restore`, et chaque catégorie de documents absente. Requalifier sur un environnement Windows jetable.
7. Ne pas publier la phrase secrète, la clé, les URLs contenant des mots de passe, ni les répertoires temporaires. Détruire **manuellement** la base jetable une fois la recette terminée.

### Ce qui empêche de déclarer SMN-34 terminée
1. **Extension du format de sauvegarde** : couvrir PDF archivés, rapports Office et les autres stockages métier sous contrôle SMN, avec empreintes, vérifications et compatibilité des anciennes sauvegardes.
2. **Preuve SMN-40** : registre d'effacement append-only crédible, ancre externe et vérification temporelle ; `ledger-not-implemented` demeure un refus de restauration.
3. **Bascule réellement sûre et récupérable** : inventaire exact du point de reprise, interruption des écritures, coordination DB/fichiers par journal durable, rollback crash-safe, invalidation des sessions, audit de succès signé et tests de panne. La base et le système de fichiers ne constituent pas une transaction commune.
4. **Recette réelle** : le workflow et les tests ont été **publiés**, mais leur exécution/résultat ne sont pas attestés dans cette session (aucun accès exécutable au dépôt Windows ou à une base PostgreSQL isolée vérifiée). Un job GitHub n'est pas déclaré vert sur la seule base du fichier YAML.

**Conclusion : une répétition isolée plus protectrice existe dans le code ; la restauration active reste intentionnellement désactivée. Ne pas clôturer Jira.**

### Adaptation BMAD
Le dépôt est accessible via connecteurs GitHub/Jira, pas comme racine de projet locale exécutable. Le fichier `.agents/skills/bmad-build/SKILL.md` a été relu ; la commande `uv run ... render_skill.py` ne peut pas être exécutée depuis la vue GitHub. Aucune simulation de l'exécution BMAD n'est revendiquée.


## Extension des sauvegardes v3 — PDF + Office (9 novembre 2026)

**Implémenté dans le code de `main`, recette PostgreSQL 18 réelle programmée mais réussite non attestée dans cette conversation.** Les diagnostics SMN-34 et le blocage SMN-40 demeurent actifs ; aucune restauration sur l'installation de travail.

### Capture v3
- `src/server/backup/extra-archives.ts` répertorie toutes les références de `smn_report_pdf_archive`, impose que chaque PDF du magasin officiel `SMN_PRIVATE_REPORT_ARCHIVE_DIR` corresponde à une référence, puis compare taille et SHA-256 du fichier à la ligne SQL. Aucun PDF non référencé, symlink, nom dangereux ou fichier illisible ne peut être silencieusement ignoré.
- Le magasin des rapports Office `SMN_OFFICE_REPORTS_DIR` est entièrement inventorié pour les fichiers DOCX/PPTX. Les fichiers sont chiffrés AES-256-GCM dans le nouveau paquet ; une entrée inconnue, un fichier illisible ou une modification pendant la capture invalide la sauvegarde.
- `runner.ts` chiffre désormais ces fichiers dans `report-pdfs/` et `office-reports/`, avec des métadonnées `reportPdfs` et `officeReports` en **manifest.version=3** et leurs empreintes. Un second scan en fin de capture refuse les changements des sources. Les archives PDF/Office ne sont **pas** détruites ni réécrites.
- Les anciens paquets v1/v2 restent lisibles pour la vérification d'intégrité mais ne sont **pas** promus au niveau complet v3 par hypothèse.
- Les modèles Office situés dans `SMN_OFFICE_TEMPLATES_DIR`, les copies exportées en dehors des répertoires gérés et d'éventuels autres médias externes ne sont pas inclus par cette extension. Il faut les qualifier séparément si leur restauration est requise.

### Vérification / répétition
- `verification.ts` impose pour v3 les deux inventaires supplémentaires, noms et positions attendus, taille, SHA-256 des contenus **clairs et chiffrés**, AES-GCM valide, absence de composants supplémentaires ou manquants.
- `restore-sandbox.ts` reconstruit en quarantaine les PDF et DOCX/PPTX, sans toucher à la cible active ; après `pg_restore` isolé, il compare chaque `smn_report_pdf_archive` restauré à un PDF effectivement présent et validé dans le paquet v3. Les absences donnent une erreur explicite, jamais un PDF inventé. Les fichiers déchiffrés de la quarantaine temporaire sont nettoyés à la fin de la répétition ; aucune publication de l'installation active n'est effectuée.
- `RehearsalResult` indique `verifiedReportPdfs`, `verifiedOfficeReports`, `verifiedDocuments`, `missingDocumentReferences` et `fullRestoreQualified:false` (la répétition isolée ne prouve pas une bascule crash-safe ni la confidentialité SMN-40). Les paquets v2 sont classés incomplets dans cette répétition.

### Essais codés
- `tests/smn-34-extra-archives.test.ts` : fichiers réels en répertoires temporaires, comparaison SQL/SHA-256, chiffrement/déchiffrement AES-GCM, absence de mutation des sources et refus de PDF orphelin.
- `tests/smn-34-v3-postgres.test.ts` : test d'intégration **réel** à exécuter avec PostgreSQL 18. Crée deux bases jetables `smn_restore_source_*` et `smn_restore_test_*`, installe SMN v33, ajoute équipe, sprint, archive PDF, document TXT et rapport Office, exécute `createManualBackup` v3, vérifie le paquet chiffré, exécute `rehearseBackupRestore`, compare les références SQL restaurées, puis détruit uniquement ses propres bases temporaires. Ne touche jamais à une base de travail préexistante.
- `.github/workflows/smn-34-restore-sandbox.yml` inclut maintenant un job `postgres-18-v3-reconstruction` avec service PostgreSQL 18 et client officiel PostgreSQL 18, plus les contrats Windows/Linux, typage et traductions. **La présence du job dans GitHub n'est pas la preuve de sa réussite.**

### Contrat de qualification
L'exécution doit produire pour le test `SMN-34-v3-PG18-sandbox` une preuve de succès contenant `pdfCount=1`, `officeCount=1`, `privateCount=1`, `databaseAndDocumentsConsistent=true` et `activeInstallationModified=false`. Ce sont des valeurs **attendues**, non un résultat observé dans cette session.

Consulter les jobs et logs de GitHub Actions :
https://github.com/JeanLamora75/SMN/actions/workflows/smn-34-restore-sandbox.yml

En local Windows avec PostgreSQL 18 déjà disponible :
```powershell
pnpm exec tsx --test tests/smn-34-extra-archives.test.ts tests/smn-34-restore-sandbox.test.ts
pnpm typecheck
pnpm i18n:check
# Uniquement avec SMN_TEST_DATABASE_URL pointant sur la base maintenance
# postgres d'un service PostgreSQL 18 local réservé aux essais :
pnpm exec tsx --test tests/smn-34-v3-postgres.test.ts
```

### Clôture
Ne pas clôturer SMN-34 tant que les tests n'ont pas une preuve **exécutée** (dont Windows), que la restauration isolée ne couvre pas les stockages métier requis et que le moteur de bascule sûre, de retour arrière, de gestion des sessions et le registre d'effacements SMN-40 ne sont pas qualifiés. Aucune affirmation « restauration active réussie » n'est justifiée par ce lot.
