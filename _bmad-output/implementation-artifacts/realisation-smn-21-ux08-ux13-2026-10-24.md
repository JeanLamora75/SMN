# SMN-21 — Extension du cockpit I01/I02 (AC-UX08 à AC-UX13)

**Référence fonctionnelle :** `docs/UX-REFERENTIEL-BMAD.md` (avenant du 24/10/2026), [SMN-21](https://lmn24.atlassian.net/browse/SMN-21).

## Périmètre mis en œuvre

- Cinquième carte après les quatre KPI du tableau de bord `/app`, I01 puis I02, jauges semi-circulaires indépendantes séparées par un trait.
- Échelles entières 1–5 → 20, 40, 60, 80, 100 %, avec note /5. Les valeurs `null`, indisponibles et invalides laissent la jauge vide/grise avec « Non renseigné ».
- Source courante : `public.smn_sprint_scores(confidence,clarity)`, déjà administrée dans la fiche du Sprint, sans nouvelle table ni migration.
- Source pour Sprint clôturé : `public.smn_sprint_closure_snapshot.snapshot.confidenceClarity` versionnée, **sans retour aux tables courantes** pour une ancienne clôture incomplète.
- Respect du Sprint sélectionné, du contrôle d'appartenance à l'équipe, de la transaction PostgreSQL `REPEATABLE READ READ ONLY`, et des permissions collectives existantes.
- Responsive 5/3/2/1 selon largeur réelle du conteneur. Les quatre colonnes opérationnelles 4/2/1 et les calculs des quatre autres cartes demeurent inchangés.
- Jauges sans contrôle de saisie, équivalents textuels et focus clavier, couleurs fondées sur les variables de thème, traductions centralisées FR/EN.

## Vérifications préparées

- `tests/dashboard-scores-ux08-13.test.ts` : barème, null/invalides, jauges indépendantes, accès et contexte de Sprint, snapshot de clôture, langues, accessibilité, responsive et non-régression.
- Adaptation des tests existants qui vérifient explicitement la cardinalité des KPI ou construisent une projection `CollectiveCycleProjection`.
- **Aucune validation d'exécution de tests, compilation TypeScript, ESLint, build, base PostgreSQL ou recette visuelle n'est attestée depuis le connecteur GitHub.** Vérifier sur le poste Windows après synchronisation de `main` :
  `pnpm lint`, `pnpm typecheck`, `pnpm exec tsx --test tests/dashboard-scores-ux08-13.test.ts tests/dashboard-ux-kpi-cards.test.ts tests/dashboard-transversal-step5.test.ts`, `pnpm build`.

## Recette utilisateur restante

Valider `null,1,2,3,4,5` et invalides pour chaque note, coexistence note saisie/absente, changement de Sprint, cycle historique avec/sans snapshot, admin/user, FR/EN, clair/sombre et tailles desktop/tablette/mobile. Comparer la taille des cinq cartes à la maquette et vérifier la lisibilité à largeur intermédiaire.

**Jira non modifié. Story laissée En cours, sans déclaration de livraison terminée avant recette.**
