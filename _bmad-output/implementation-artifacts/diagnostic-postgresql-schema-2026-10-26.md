# Diagnostic de compatibilité PostgreSQL — SMN (26 octobre 2026)

## Symptôme remonté sur Windows 11

L'écran d'accueil annonçait « Connexion PostgreSQL impossible ». Les contrôles locaux rapportés indiquent pourtant :
- Instance PostgreSQL **portable** propre à SMN ; `runtime.json` présente `smn_owner`, port `57085` ;
- port `127.0.0.1:57085` accessible en TCP ; `pg_ctl status` confirme le serveur actif ;
- `existingManagedUri()` : **cluster validé** ;
- `classifySnapshot(await probePostgres(uri)).status` : **schema-incompatible**.

Le problème n'est donc pas le service PostgreSQL ni le port. **La cause exacte parmi les objets de la base locale n'est pas encore démontrée** tant que la liste des objets rejetés n'a pas été fournie.

## Audit du code : causes confirmées de faux négatifs possibles

`src/server/db/probe.ts` interrompt l'exploration du schéma dès qu'un objet SQL
n'appartient pas à `INSTALLATION_RELATIONS` dans
`src/server/installation/contract.ts`. Le diagnostic qualifie alors la base
`schema-incompatible` avant même la lecture de `smn_installation` et de la
table des migrations.

Des modules ajoutés au pilote ont pourtant créé de nouvelles tables légitimes
via `CREATE TABLE IF NOT EXISTS` sans inscription dans cette liste. Exemples
vérifiés par lecture GitHub : `smn_report_document` et
`smn_report_document_session_write` (Studio de rapports),
`smn_registry_comment` et `smn_registry_comment_revision` (commentaires),
`smn_registry_linked_request` (registre), `smn_sprint_historical_event`
(historique Sprint), `smn_kanban_period` (Kanban),
`smn_ai_brief_archive` (briefs), `smn_historical_csv_batch`.

## Correctif

- Déclaration **explicite** des 36 nouvelles tables SMN vérifiées dans leurs
  modules sources + `smn_ai_brief_archive_immutable:function`. Aucune règle
  de type wildcard (par exemple « tout `smn_*` ») n'est autorisée.
- Maintien de l'interdiction d'une table, vue, fonction ou schéma inconnus.
  La validation des migrations, versions, privilèges et snapshots reste identique.
- Ajout de `scripts/diagnose-schema-compatibility.ts` :
  connexion PostgreSQL portable chiffrée par les fonctions **existantes** SMN,
  lecture des seuls identifiants d'objets SQL et de leur statut, sans modification
  de schéma, sans journalisation d'URI, mot de passe ou données personnelles.
- Ajout de `tests/installation-late-relations-contract.test.ts` :
  acceptation des tables connues, rejet des objets étrangers, présence des DDL
  dans le code, contrôle statique du script de diagnostic.

## Recette Windows sans altération des données

Depuis le répertoire SMN, après avoir récupéré la branche à jour :

```powershell
pnpm exec tsx scripts/diagnose-schema-compatibility.ts
```

Attendu : `Diagnostic SMN : initialized`, `Objets non reconnus : 0`.
Si une relation inconnue subsiste, **ne pas la supprimer, renommer ni créer une
nouvelle base** ; vérifier son origine source/migration avant d'ajuster le contrat.
En cas de version de schéma/migration réellement incompatible, traiter
séparément, sans contourner la sécurité.

Puis relancer **uniquement l'application** `pnpm dev` et vérifier l'accès aux
Sprints existants. Ne pas arrêter PostgreSQL ni déplacer
`%LOCALAPPDATA%\ScrumMasterNotebook\data`, `runtime.json`, `.settings-key`
ou les archives de récupération.

Les commandes `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` et
le diagnostic dans le cluster local **n'ont pas été exécutés depuis le connecteur
GitHub**. Aucune restauration de données n'a été entreprise.
