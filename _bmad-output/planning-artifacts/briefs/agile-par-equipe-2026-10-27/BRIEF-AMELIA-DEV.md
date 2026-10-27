# Brief de transmission — Amelia, Développeuse BMAD v6.12.4

**Epic Jira : [SMN-287](https://lmn24.atlassian.net/browse/SMN-287)** · Stories SMN-288 à SMN-297
**Références :** [BRIEF-PRODUIT.md](./BRIEF-PRODUIT.md), [ARCHITECTURE-SPINE-PROPOSITION.md](./ARCHITECTURE-SPINE-PROPOSITION.md), [DECOUPAGE-JIRA.md](./DECOUPAGE-JIRA.md), [BRIEF-SALLY-UX.md](./BRIEF-SALLY-UX.md), `docs/UX-REFERENTIEL-BMAD.md`, `SMN-282`.
**Statut :** préparation du développement ; aucune implémentation de cet Epic ni validation locale n'est revendiquée.

## Mission
Ajouter le mode Scrum/Kanban au niveau de chaque équipe, l'archivage/réactivation, la contextualisation des écrans et des producteurs métier et la sécurité multiteam, en réutilisant SMN-282.

## Avant le premier commit de code
1. Activer le skill `.agents/skills/bmad-agent-dev/SKILL.md`, relire la `main` actuelle et les documents ci-dessus.
2. Vérifier la PR #189 de SMN-282 fusionnée le 27/10/2026 mais sans supposer que la base v28, la préférence active ou toutes les lectures sont activées sur Windows.
3. Confirmer version/état réel PostgreSQL, intégrité `_prisma_migrations`, sauvegarde et restauration testable. Ne jamais appliquer de migration sur données de travail sans validation explicite du Product Owner.
4. **Contrats Sally désormais finalisés** : appliquer https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-agile-multiequipes-2026-10-27/DESIGN.md et https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-agile-multiequipes-2026-10-27/EXPERIENCE.md ; voir également BRIEF-AMELIA-UX.md et RECETTE-UX.md du même dossier.
5. **UX-01 à UX-04 validées le 27/10/2026** : lecture des archives en lecture seule admin, écritures métier interdites sur archive, dernière équipe active non archivable, édition du mode exclusivement dans Paramètres > Équipes. Ne pas rouvrir ces arbitrages.

## Ordre d'exécution
- **L0** : inventaire des consommateurs `smn_installation.mode`, des comparaisons `schema_version===28`, des routes fail-closed et de l'isolation incomplète. Produire une matrice fichiers/risques.
- **L1** : SMN-288 / 289 / 296. Nouvelle migration additive, mode/checks et verrou d'historique permanents ; sécuriser la création concurrente Sprint/période et la modification de mode.
- **L2** : SMN-290 / 291. États actifs/archivés, API et journal, sélecteur actif + mode de l'équipe et autosélection cycle courant > plus récent ; repli sûr.
- **L3** : SMN-292 / 293 / 294. Navigation Scrum/Kanban, modèles et capacités propres à l'équipe, composants Cockpit Agile et producteurs fiables.
- **L4** : SMN-295. Registres, Rapports, PDF, archives, imports, historiques et contrôles d'appartenance.
- **L5** : SMN-297. Recette intégrée multiéquipes, scénarios négatifs, sauvegarde/restauration, validation Windows.

## Contrôles techniques impératifs
- Ne pas traiter `smn_installation.mode` comme mode métier en nouveau schéma.
- Ne pas activer `MULTI_TEAM_CONTEXT_READY` avant de qualifier **tous** les consommateurs pouvant exposer ou écrire des données d'une autre équipe.
- Traiter strictement l'extension de version de schéma ; l'existant comporte des comparaisons strictes à 28 et des chemins historiques v27.
- Ne pas réécrire les données de cycles, snapshots, rapports ou archives historiques.
- Conserver l'isolement côté serveur, les refus d'accès sans fuite et le statut réel de l'équipe.
- Aucun ajout de permission `user` sans décision V1.
- Aucune nouvelle infrastructure/IDE/Docker imposée au poste Windows 11 ; utiliser pnpm/Node/PowerShell/GitHub Desktop existants.

## Preuve d'exécution et livraison
- Exécuter réellement `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` et la recette PostgreSQL sur l'environnement adéquat ; documenter pass/fail/non exécuté.
- Priorité aux branches dédiées et traçabilité GitHub/Jira ; vérifier code, migrations et UI avant déclaration « terminé ».
- Si GitHub Actions n'est pas disponible, documenter ce fait et préparer une procédure PowerShell reproductible pour le test local.
- Ne pas fusionner une migration ni lever les gardes sans qualification du Product Owner.
