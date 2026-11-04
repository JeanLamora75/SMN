# SMN-381 — Refonte UX Cockpit Agile des modales Dashboard Builder

**Epic Jira :** [SMN-353](https://lmn24.atlassian.net/browse/SMN-353)  
**Story :** [SMN-381](https://lmn24.atlassian.net/browse/SMN-381)  
**Source UX validée :** [Référence des modales](../planning-artifacts/ux-designs/ux-dashboard-builder-2026-11-04/MODALES-PARAMETRAGE-REFERENCE-VALIDEE.md)  
**Date :** 4 novembre 2026  
**Statut :** code publié sur `main`, vérifications statiques en cours, **pas de recette exécutée**.

## Audit des composants

La mécanique de galerie, d'assistant en deux étapes, des dimensions, de copie interéquipes et de gestion du brouillon existait avant SMN-381. Elle exposait des formulaires techniques, des miniatures peu significatives, des sélecteurs de dimensions et des confirmations visuellement hétérogènes.

## Modifications apportées

- `modal-ux.module.css` : vocabulaire graphique localisé au Dashboard Builder, bandeaux bleu nuit, cartes sélectionnables, modales responsives, pied d'actions stable, aperçu de géométrie, tokens SMN/Bootstrap.
- `modal-focus.ts` : gestion de focus, cycle Tab/Shift+Tab, Échap, retour au déclencheur ; aucune modification du shell.
- `template-gallery.tsx` : cartes visuelles et géométries strictement dérivées du catalogue versionné M01–M06, noms métier, sélection préalable puis confirmation, pagination du catalogue.
- `slot-wizard.tsx` : étapes conservées, catégories en français, recherche métier, sources en cartes, visualisations compatibles, aperçu sans faux KPI, sélection des colonnes par libellés. Le nom reste obligatoire pour accéder aux fiches. Vidage avec confirmation contextualisée.
- `block-dimensions.tsx` : choix illustrés des quatre largeurs et des six hauteurs réellement permises (`auto/240/320/400/480/640`), aperçu et application explicite à la validation, sans changement de stockage.
- `dashboard-copy-modal.tsx` : aperçu géométrique des dispositions enregistrées, messages d'incompatibilité sans codes techniques, conservation du contrôle de révision et de l'autorisation.
- `dashboard-editor.tsx` : confirmations réinitialiser/changer/supprimer/quitter harmonisées avec les conséquences sur le brouillon.
- `dashboard-business-list.tsx` et `dashboard-consultation.tsx` : rendu conditionnel des métadonnées choisies dans l'assistant, sans changement d'API ni source de données.

## Préservation des invariants

- Aucun changement à `private-shell.tsx`, `private-navigation.tsx` ou aux sélecteurs de contexte SMN.
- Pas de modification de base PostgreSQL, de moteur v33, de calculs d'indicateurs, d'API de copie, de droits ou de snapshots.
- La galerie et les dimensions n'enregistrent pas directement le Dashboard : elles modifient le brouillon, à sauvegarder explicitement.
- La copie porte toujours uniquement sur la disposition **enregistrée** ; la permission et la révision sont vérifiées côté serveur.

## Tests et limitations

- Contrats statiques ajoutés : `tests/smn-381-dashboard-modal-ux.test.ts`.
- Assertions historiques mises à jour : `tests/smn-364-dashboard-composition.test.ts` et `tests/smn-368-dashboard-dimensions.test.ts`, afin de tester la nouvelle interface sans abandonner les protections de la mécanique existante.
- **Non exécutés dans cette session :** `pnpm typecheck`, `pnpm lint`, tests TSX, tests PostgreSQL, `pnpm build`, CI GitHub Actions et recette visuelle/keyboard/mobile sur Windows 11. La présence du code ne démontre pas la conformité de toute la Story.
- **Internationalisation :** le Dashboard Builder contient déjà des libellés en français codés en dur. Le chantier transversal de centralisation FR/EN reste à contrôler et compléter ; ne pas annoncer AC09/DoD atteints.
- **Agent BMAD :** la configuration du framework BMAD 6.12.4 est connue, mais le `.agents/skills/*/SKILL.md` officiel d'Amelia n'a pas été trouvé par la recherche GitHub. Aucun script BMAD/uv n'a été exécuté. Travail adapté au connecteur GitHub.

## Recette locale recommandée

```powershell
git pull origin main
pnpm typecheck
pnpm lint
pnpm exec tsx --test tests/smn-381-dashboard-modal-ux.test.ts tests/smn-364-dashboard-composition.test.ts tests/smn-368-dashboard-dimensions.test.ts tests/smn-372-dashboard-copy.test.ts tests/smn-363-dashboard-draft.test.ts
pnpm build
pnpm dev
```

Sur `http://127.0.0.1:3003/app/dashboard-builder`, vérifier sous un compte autorisé : six modèles, six familles de fenêtres, annulation sans modification du brouillon, dimensions réellement sauvegardées, copie d'une disposition publiée, sources incompatibles, révisions concurrentes, clavier Échap/Tab, thèmes clair/sombre, responsive mobile. Comparer le résultat à la maquette approuvée et relever les écarts.

**Décision de fin de Story :** conserver Jira SMN-381 ouverte jusqu'à typecheck/lint/tests/CI et recette visuelle réels, corrections des éventuelles anomalies et contrôle i18n.
