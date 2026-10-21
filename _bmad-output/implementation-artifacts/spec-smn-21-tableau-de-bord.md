---
story: SMN-21
status: in-progress
implementation: first-ux-iteration
language: fr
date: 2026-10-20
---
# SMN-21 — First dashboard iteration

## Intent vérifié
Lire l'identité du produit, de l'équipe et le mode réellement enregistrés ; présenter une première expérience post-connexion sans faux cycles ni fausses métriques ; maintenir la confidentialité du profil Utilisateur. Le périmètre d'AC2/AC3 continuera à s'enrichir avec les Stories productrices de cycles et indicateurs.

## Artefacts modifiés
- `src/server/dashboard/read.ts` — contrat collectif en lecture seule, champs personnels absents.
- `src/app/app/page.tsx` — interface responsive, sections et navigation.
- `src/app/dashboard.css`, `src/app/layout.tsx` — présentation.
- `tests/dashboard-read.test.ts`, `scripts/verify-http-ci.mjs` — contrôles.
- `docs/TABLEAU-DE-BORD-SMN-21.md` — recette et limites.

## Restrictions
Aucune création automatique de cycle ni mutation métier. Aucune vérification d'AC2 avec données de cycles n'est possible avant la livraison de leur modèle et interfaces. Les modules non livrés sont identifiés comme futurs. Les deux seuls profils restent admin et user.

## Workflow
Implémentation incrémentale via connecteur GitHub, publication directe sur main comme décidé pour le pilote. La commande BMAD de rendu du skill ne peut pas être exécutée depuis le seul connecteur GitHub ; ne pas assimiler cette adaptation à l'exécution complète du workflow officiel. La validation complète attend le retour ergonomique utilisateur et les futurs producteurs.


## Extension — refonte UX, lot 1 (21/10/2026)

**Contrats :** `DESIGN.md` et `EXPERIENCE.md` approuvés le 21/10/2026. Objectif du lot : infrastructure UI pleine largeur, header et sidebar, sans réinterpréter l'UX.

**Tâches de développement :**
- [x] Coque privée partagée, header pleine largeur et sélecteurs natifs respectant le contexte réel.
- [x] Navigation latérale rétractable et version mobile, focus clavier et fermeture Escape.
- [x] Messages FR/EN centralisés, réutilisation des tokens de thèmes.
- [x] Tests de structure ajoutés et contrôle de recette initial mis à jour.
- [ ] CI GitHub Actions exécutée et analysée.
- [ ] Publication après vérification sur `main`.

**Critères lot 1 :** UX-TDB-01 (layout), UX-TDB-02 (menu), UX-TDB-03 partiel (aucun cycle fictif), UX-TDB-14 (structure responsive) et UX-TDB-15 partiel (navigation clavier + FR/EN). Les AC métier SMN-21 ne sont pas déclarés satisfaits par cette mise en page.

**Écarts et suites :** la mise en page de la page `/app` elle-même (bandeau Sprint et cartes) est programmée au lot 2. Les colonnes et la configuration non dominante relèvent du lot 3. Cycles, recherche globale et préférences persistées restent indisponibles.

**Adaptation BMAD :** lecture du skill Amelia et du workflow Build via GitHub ; ce contexte de développement via connecteurs ne permet pas de prétendre que la commande locale de rendu `uv run ...render_skill.py` a été exécutée. Travail jalonné par ce document, tests et PR vérifiables.

**Contrôles constatés :** vérifications source exécutées sur les contenus de branche (12+26 assertions, JSON FR/EN parité 462 clés, aucune variable manquante). Workflow [I0 #315](https://github.com/JeanLamora75/SMN/actions/runs/39580664197) lancé, mais refus d'exécution avant allocation d'un runner Linux ou Windows (jobs sans étapes, durée 2 secondes). Tests `pnpm` et recette navigateur **non exécutés** ; ne pas marquer les AC d'intégration comme validés. Publication technique à tracer par PR #26, validation qualité restant ouverte.
