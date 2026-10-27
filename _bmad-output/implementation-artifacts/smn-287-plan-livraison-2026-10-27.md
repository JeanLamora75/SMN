# SMN-287 — Plan de livraison Amelia — 27/10/2026

**Statut : en cours, non validé.** Branche `feat/smn-287-agile-multi-teams-20261027`. Aucune migration ni test PostgreSQL exécuté.

## Ordre de réalisation

0. Qualifier les migrations SMN-282 v28, le diagnostic, les autorisations, la préférence d'équipe et les lecteurs transverses.
1. **SMN-288** : mode persistant par équipe et migration additive distincte de v28 ; reprise d'un mode fiable, sinon Scrum ; aucun lancement automatique. Vérifier les chemins de migration, le schéma Prisma, les checksums et les bases historiques.
2. **SMN-289** : création avec mode obligatoire (sans présélection) ; mutation dans Paramètres > Équipes uniquement avant la première création d'un cycle ; marqueur irréversible, sérialisation et contrôle de révision.
3. **SMN-296 (prioritaire)** : refus par défaut des accès interinstallations et interéquipes, protection de toutes les écritures sur équipe archivée, vérification des relations équipe/cycle/ressource.
4. **SMN-290** : archivage/réactivation transactionnels, refus concurrent de l'archivage de la dernière équipe active, historique conservé, consultation admin en lecture seule.
5. **SMN-291** : équipe active autorisée et non archivée, purge de l'ancien contexte, cycle en cours sinon plus récent, protection des brouillons, états vides et erreurs.
6. **SMN-292** : Sprints pour Scrum / Périodes pour Kanban, sans contenu fictif ; badge Cockpit Agile.
7. **SMN-293** : paramètres métier, cérémonies, calendriers, capacités indépendants par équipe.
8. **SMN-294** : indicateurs et capacité pertinents au mode sélectionné, isolation.
9. **SMN-295** : registres, rapports, PDF, archives et imports isolés, consultations historiques sécurisées.
10. **SMN-297** : documentation de sauvegarde/restauration, tests sur copie locale Windows 11, recettes admin/lecture seule et non-régression.

## Règles de livraison

- Un lot est **codé**, non **validé**, tant que les tests n'ont pas été effectivement exécutés.
- Ne pas déclencher `apply-multi-team-migration.ts` ni une nouvelle migration sur une base réelle sans approbation explicite.
- Conserver `SMN_MULTI_TEAM_WRITES_ENABLED` désactivé tant que les gardes métier et lecteurs transverses ne sont pas qualifiés.
- Chaque lot met à jour le journal BMAD et le ticket Jira correspondant ; aucune clôture « Done » sans recette PC.
- UX normatives : `_bmad-output/planning-artifacts/ux-designs/ux-agile-multiequipes-2026-10-27/DESIGN.md` et `EXPERIENCE.md`.

## Premier incrément

`src/lib/team-agile-mode.ts` définit les règles métier pures ; `tests/smn-288-team-agile-mode.test.ts` décrit leurs attentes. **Non branchés** aux routes, au schéma SQL ou aux composants : ce premier incrément n'implémente pas à lui seul SMN-288.
