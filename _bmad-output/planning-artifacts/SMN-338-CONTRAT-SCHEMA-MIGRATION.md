# SMN-338 — Contrat de schéma et stratégie de migration convergente

**Statut : conception en cours, aucun DDL exécuté — 31/10/2026.** Dépend de SMN-337, SMN-326/329/334 et des décisions ARCH-02, REV-02.

## Objectif
Une installation vierge et une installation déjà en v32 doivent converger vers le même schéma des indicateurs, sans perte des données métiers non exclusivement liées aux anciens indicateurs.

## Huit tables à livrer (noms contractuels)
1. `smn_indicator_definition` : catalogue global, `tag` UNIQUE, `type` manuel/calculé, `formula_revision`, `type_locked`, `archived_at`.
2. `smn_indicator_team_selection` : `team_id` FK, `indicator_id` FK, `is_active`, UNIQUE(team_id,indicator_id).
3. `smn_indicator_display_preference` : références équipe/indicateur/écran, visibilité, ordre ; unicité et cohérence avec la sélection d'équipe.
4. `smn_indicator_manual_value` : (team_id,cycle_type,cycle_id,indicator_id) UNIQUE, `value NUMERIC NULL`.
5. `smn_indicator_computed_result` : même identité, `value NUMERIC NULL`, statut, reason/detail, source tag, formule révision.
6. `smn_indicator_dependency` : indicateur cible, type de source indicateur/calendrier, référence exclusive, vérifications CHECK et FK si source indicateur.
7. `smn_indicator_cycle_revision` : clé (team_id,cycle_type,cycle_id), version positive.
8. `smn_indicator_system_revision` : singleton, revision globale positive ou zéro.

**Attention :** les noms et principes sont des invariants ; les types précis des identifiants, ordre/index complémentaires et valeurs des enums restent à vérifier contre la base réelle et les services TS. Références polymorphes `cycle_type`+`cycle_id` : existence et isolation garanties côté serveur en transaction, pas de FK magique.

## Contrats SQL impératifs
- Contraintes ordinaires CHECK, FK, UNIQUE et index par équipe/type/cycle/indicateur ; pas de triggers pour l'intégrité polymorphe.
- Valeurs DECIMAL/NUMERIC sans conversion intermédiaire en float JS ; valeurs NULL différentes de zéro.
- Suppressions de définitions bloquées si références de formule ou sélection ; archivage sans effacement de valeurs.
- Les valeurs calculées indisponibles sont persistées avec motif, valeur NULL et révision de formule.
- Contrôle de capacité de schéma central conforme à SMN-326 ; aucune route ne crée ou modifie du DDL implicitement.

## Plan d'installation
- Nouvelle base : construire une baseline native N cohérente avec toutes les tables à conserver et les huit nouvelles tables ; une seule signature d'installation valide.
- Base v32 existante : sauvegarde vérifiée, diagnostic, migration dédiée versionnée avec verrou global d'installation, création non destructive des tables et vérification physique, puis suppression ciblée **seulement après levée des réserves de SMN-337**.
- L'existant `scripts/db-upgrade.ts` refuse les mises à niveau historiques automatiques : ne pas présenter `pnpm db:upgrade --apply` comme un chemin valide tant que le registre, le script et les tests n'ont pas évolué.
- Si la migration complète ne peut pas garantir la préservation, refuser l'opération avant toute écriture destructive et laisser l'installation exploitable.
- Vérifier identité du schéma (colonnes, types, FK, contraintes, index, triggers autorisés, version) entre base native et base migrée.

## Matrice de validation
1. Installation native et mise à niveau : mêmes structures.
2. Migration partiellement exécutée ou relancée : comportement diagnostiqué sans perte.
3. Conflit de version/capacité : refus explicite sans DDL implicite.
4. Contrôles de données historiques : capacités, Kanban, fermetures, absences, rapports, snapshots intacts.
5. Non-conformité FK, contraintes, colonnes, index : diagnostic bloque l'activation.
6. Tests de concurrence et transactionalité des changements de formules et calendrier.
7. Recette locale Windows 11 et validation du commanditaire avant bascule.

## Décision de sécurité transférée depuis SMN-337
La clôture Jira de SMN-337 constitue une **acceptation documentaire**, pas une preuve que la base PostgreSQL locale a été audité. Avant tout DROP, effectuer : recherche exhaustive des références dans le code, interrogation de `pg_depend`, `pg_constraint`, `pg_trigger`, `pg_views`, `pg_proc` dans la base pilote, sauvegarde/restauration vérifiée et validation de la liste définitive KEEP/ADAPT/DROP.

## État de réalisation
Ce fichier n'est **pas** une migration SQL prête à être exécutée et n'atteste aucun test ni installation. La Story SMN-338 reste **En cours**.
