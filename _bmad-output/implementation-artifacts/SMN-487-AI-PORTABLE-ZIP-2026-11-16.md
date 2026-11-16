# SMN-487 — Transfert sécurisé des connexions IA via ZIP et restauration (Amelia)

Date : 16 novembre 2026. Epic SMN-479. Architecture : Winston ; parcours UX : Sally.

## Décisions implémentées
- **Source :** les métadonnées des connexions (`public.smn_ai_connection`), les archives de briefs TXT et les réponses volontairement enregistrées (`public.smn_ai_brief_response`) font partie du dump PostgreSQL déjà chiffré par SMN-442. Les identifiants, noms, fournisseurs, modèles et révisions sont conservés. Les éventuelles autorisations restent régies par les contrôles d'accès et les nouvelles sessions obligatoires.
- Le coffre `data/ai-secrets`, les versions `*.enc` des clés API et `.vault-master-v1` sont **exclus du ZIP**, de son manifest et des composants. Le format ZIP/tar interne reste inchangé : allowlist stricte `index.json`, `manifest.enc`, `database.pgcustom.enc` et documents/PDF/Office/tickets chiffrés. Aucune extension permissive.
- **Vérification de l'origine :** `inspectPortableAiTransfer` refuse toute colonne imprévue dans la table des connexions (dont `api_key`) et dans celle des réponses ; le chemin du backup ne peut jamais englober le coffre local. L'inventaire des lignes dans les archives/réponses est contrôlé, sans consulter ni exposer leur contenu à la couche de transfert.
- **Restitution isolée :** après `pg_restore`, `inspectPortableAiTransfer` valide les tables/colonnes et la cardinalité. Le pipeline continue d'exiger archive authentifiée, ledger d'effacements, réception signée, comparaison des empreintes source/candidat, contrôle de fichiers et contraintes FK.
- **Nouvel ordinateur :** `activateFreshManagedInstallation` doit d'abord établir la correspondance des empreintes de la sauvegarde et de la base isolée. Ensuite, sous maintenance hors ligne, toutes les connexions du candidat sont désactivées et passent `credential_state='missing'`, `last_test_status='never'`, `last_test_at=NULL` ; **id et revision inchangés**. Aucun archive TXT ni aucune réponse n'est modifiée. Les nombres de connexions, archives et réponses doivent correspondre avant/après ; sinon annulation de la transaction. La base candidate devient active uniquement après ce contrôle.
- **Clés préexistantes sur la destination :** si le dossier de coffre local contient des fichiers, la migration est refusée avant toute bascule pour empêcher la réutilisation de secrets appartenant à une installation différente. Aucun coffre n'est écrasé ou supprimé arbitrairement. L'administrateur peut utiliser l'interface de réinitialisation du coffre avant une nouvelle tentative, sans PowerShell.
- **Parcours UI :** les connexions affichent « Clé à renseigner sur ce PC » ; le serveur bloque tout envoi tant qu'une nouvelle clé n'est pas fournie et testée sur un modèle gratuit approuvé, comme dans SMN-481/482/484.
- **Rollback :** les chemins d'origine, le journal, le marqueur de maintenance et les états précédents du système restent régis exclusivement par SMN-442. Le présent lot n'active aucun endpoint de restauration en ligne et ne retire aucune barrière d'effacement historique.
- **Anciennes archives :** l'absence de table de connexions est acceptée comme un inventaire vide (ancienne version), sans prétendre restaurer des connexions inexistantes.

## Tests ajoutés
- Simulation transactionnelle PostgreSQL : conservation des IDs/révisions, nombre d'archives/réponses, réinitialisation de tous les états, rejet d'une colonne secrète, rollback en cas de dérive, archive ancienne.
- Fichiers : coffre étranger non vide refusé sans supprimer sa clé ; staging, ZIP, export, sauvegarde et cutover reliés au même contrôle.
- Tests Linux/Windows GitHub Actions attendus sur le même commit ; le parcours source→cible réel et les scénarios crash/rollback ne doivent pas être déclarés qualifiés avant exécution.

## Réserves de recette
- Une transaction interrompue avant commit laisse la candidate inchangée. Si une interruption survient plus tard dans la promotion, la politique SMN-442 reste responsable du rollback. Une candidate déjà assainie peut nécessiter une nouvelle reconstruction isolée pour retrouver l'empreinte de preuve originale avant un nouvel essai.
- Le test d'export/import réel avec une **clé fictive et un compte IA Free de test** est encore à effectuer. Aucune preuve d'appel authentifié n'a été fabriquée.
- La mise à jour d'une installation existante peut exiger les migrations SMN-480/482 ; on ne prétend pas qu'un archive plus ancienne contient les nouvelles connexions.
