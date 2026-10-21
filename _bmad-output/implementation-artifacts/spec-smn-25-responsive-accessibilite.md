# SMN-25 — Story 1.16 (BMAD)

**Références normatives** : [Jira SMN-25](https://lmn24.atlassian.net/browse/SMN-25), FR-63/59/65, NFR-1/2, UX-DR11/14, AD-28, D-PRD-001/127.

**Décision** : consolider le socle existant en responsive **sans changer les parcours métier**, les permissions ni les endpoints. Unifier le lien d'évitement au niveau du layout racine et maintenir les landmarks natifs `main` de chaque page. Préserver le vrai tableau desktop et transformer uniquement sa présentation mobile en fiches accessibles.

**Accessibilité** : `aria-describedby` ciblé et `aria-invalid` si approprié, statuts/error rôles explicites, focus et clavier, icônes décoratives non parlées.

**Preuves** : test statique `tests/responsive-accessibility.test.ts` et assertions SSR HTTP ajoutées au script d'intégration. Recette physique tablette/smartphone/clavier/lecteur d'écran **non exécutée** ; aucun engagement de compatibilité ou score WCAG n'est déclaré.

**Détails et plan de recette** : [docs/RESPONSIVE-ACCESSIBILITE-SMN-25.md](../../docs/RESPONSIVE-ACCESSIBILITE-SMN-25.md).

**Statut** : implémentation sur branche de développement, validation en attente.
