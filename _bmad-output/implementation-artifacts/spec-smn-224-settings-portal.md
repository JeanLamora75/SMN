# SMN-224 — Centre Paramètres : menu et portail sécurisé

**Référence** : https://lmn24.atlassian.net/browse/SMN-224  
**BMAD** : `_bmad-output/planning-artifacts/ux-designs/ux-parametres-2026-10-23/`  
**Statut** : développement publié sur `main`, non recetté.

## Réalisation
- AC1 : entrée `Paramètres` avec engrenage existante et conservée dans `src/lib/private-navigation.ts` ; cible portail `/app/admin/settings`, au lieu du formulaire. La sélection reste active dans la route enfant.
- AC2 : `/app/admin/settings` et `/app/admin/settings/general` protègent l'accès via `currentAccount`, changement de mot de passe obligatoire et `canAccess(...settings...)`, côté serveur avant tout rendu.
- AC3 : formulaire général SMN-18 conservé **sans modification** dans `settings-form.tsx`, désormais utilisé à `/app/admin/settings/general`. Aucune migration ou écriture métier.
- AC4 : les liens connus vers `/app/admin/settings` aboutissent au portail et proposent une entrée « Informations générales » vers le formulaire, avec retour vers Paramètres, sans redirection circulaire.
- AC5 : portail `container-fluid` avec surcharge `smn-team-page`, exploite la largeur disponible et présente « Paramètres » / « Configuration de l’application » conformément au DESIGN.
- Traductions ajoutées dans `fr.json` et `en.json`.

## Délimitation volontaire du lot P1
Seule la rubrique fonctionnelle « Informations générales » figure initialement sur le portail. Les 14 rubriques en 4 familles, la bascule Cartes/Liste et les raccordements de tous les modules appartiennent à **SMN-225 / SMN-226 / SMN-227** et ne doivent pas être considérés comme livrés par SMN-224.

## Tests ajoutés
`tests/smn-224-settings-portal.test.ts` vérifie la navigation, les autorisations, les deux contrôles d'accès côté serveur, la présence de l'ancien formulaire et des traductions. Vérifications ajoutées mais **non exécutées**.

## Recette à exécuter sur Windows
1. `pnpm typecheck`
2. `pnpm exec tsx --test tests/smn-224-settings-portal.test.ts`
3. `pnpm dev` puis connexion administrateur.
4. Ouvrir la sidebar dépliée et repliée, vérifier l'entrée Paramètres et l'ouverture du portail en pleine largeur.
5. Ouvrir « Informations générales », contrôler langue, thème, palette, pays, valeurs existantes, modifications et retour.
6. Essayer `/app/admin/settings` et `/app/admin/settings/general` avec un compte Utilisateur non autorisé ; aucun contenu de paramètres ne doit être divulgué.
7. Essayer l'ancienne URL `/app/admin/settings` enregistrée comme favori : elle doit afficher le portail et permettre d'atteindre le formulaire.

**Aucune compilation, exécution de tests ni recette navigateur attestée dans cette session.**
