# SMN-227 — Raccordement Paramètres, retours et permissions

Référence : https://lmn24.atlassian.net/browse/SMN-227
BMAD : `_bmad-output/planning-artifacts/ux-designs/ux-parametres-2026-10-23/`

## Changements développés sur main
- **AC1** : les rubriques Langues et Apparence du registre pointent maintenant vers `/app/admin/settings/general#settings-language` et `#settings-appearance`. Les ancres réelles sont intégrées au formulaire SMN-18 et appliquées après son chargement asynchrone. Les autres liens actifs pointent toujours vers leurs écrans métiers existants.
- **AC2** : Cérémonies, Capacité et Jours ouvrés ne créent aucune destination artificielle ; états conservés par le catalogue SMN-225. Sécurité/sessions pointe seulement vers les fonctions personnelles et administratives réellement présentes dans `/app/security`, sans se prétendre console de session complète.
- **AC3** : retour « Paramètres » ajouté à Cadence, Pays, Fermetures, Catégories d'absences, Comptes, Sauvegardes, Audit. Le formulaire général conserve son retour. La page de sécurité offre ce retour **uniquement à l'administrateur** ; les utilisateurs gardent leur accès personnel habituel. Aucune ancienne URL n'est supprimée.
- **AC4** : Sprints, Membres, Calendrier et Sécurité personnels sont conservés dans les groupes métier ; seules les entrées administratives redondantes (comptes, cadence, audit, sauvegardes, pays) sont retirées de la sidebar. Les routes/API correspondantes subsistent.
- **AC5** : aucun assouplissement des autorisations serveur des pages, des APIs ou des ressources ; les liens ne déterminent jamais le droit d'accès.
- **AC6** : aucune migration, modification de valeurs ou API d'écriture ajoutée. Le formulaire général et tous les composants métier sont réutilisés.

## Tests et recette
- Test ajouté : `tests/smn-227-settings-navigation.test.ts`; test existant `tests/private-navigation.test.ts` aligné sur l'organisation du menu.
- À exécuter après Pull main : `pnpm typecheck`, `pnpm exec tsx --test tests/private-navigation.test.ts tests/smn-227-settings-navigation.test.ts`, puis `pnpm dev`.
- Contrôler les liens Langues/Apparence (chargement asynchrone et focus visuel), retours, accès admin/user, anciennes URLs, brouillons non perdus silencieusement, absence de changement de révision/audit sans validation métier.

**Important : compilation, tests automatisés, recette visuelle et tests d'autorisation par session réelle non exécutés dans cette session. Ne pas déclarer l'US recettée ou terminée dans Jira.**
