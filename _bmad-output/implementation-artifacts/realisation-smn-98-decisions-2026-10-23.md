# SMN-98 — Décisions, justifications et remplacements

Jira : https://lmn24.atlassian.net/browse/SMN-98

## Livré sur main

- La fiche décision du registre central comporte les états Active, Remplacée, Annulée avec révisions communes (SMN-89/91).
- Table `smn_decision_detail` : justification libre facultative, référence facultative à une décision précédente, identifiant central stable.
- Table d'audit append-only `smn_decision_detail_audit` avec auteur, horodatage et anciennes/nouvelles informations ; contrôle optimiste des révisions et transaction atomique.
- Validation de la cible : décision existante, même équipe, pas d'auto-référence ; contrôle de cycle de remplacement.
- API GET/PATCH de lecture et écriture sous contrôle de rôle ; fiche décision avec liens d'origine et inverse. Traductions FR/EN.
- Tests préparés dans `tests/smn-98-decision-replacement.test.ts`.

## Limites de recette

- La justification et le lien s'ajoutent sur la fiche après la création initiale. La raison d'annulation peut être consignée dans le commentaire commun déjà historisé.
- L'état Remplacée n'est pas déclenché automatiquement par l'enregistrement d'une décision remplaçante. L'administrateur gère explicitement ce statut sur la fiche d'origine.
- Le service ne modifie ni Sprint, ni snapshot, ni PDF ; préservation des anciens bilans à confirmer en intégration avec les Stories correspondantes.
- Aucune commande typecheck, test, build ou recette navigateur/PostgreSQL exécutée depuis l'environnement connecté. Jira reste non clôturée.

Validation Windows : `git pull`, `pnpm typecheck`, `pnpm exec tsx --test tests/smn-98-decision-replacement.test.ts`, `pnpm i18n:check`, `pnpm build`.
