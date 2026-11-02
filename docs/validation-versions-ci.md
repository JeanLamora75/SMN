# Validation des versions SMN (cible v33)

## Point d'entrée commun

- `pnpm validate:version` : profil `quality` (i18n, TypeScript, ESLint), sans PostgreSQL.
- `node scripts/validate-version.mjs --profile smn-348` à `smn-351` : validations des lots indiqués.
- `node scripts/validate-version.mjs --profile migration-v33` : contrats et tests de migration v33, à utiliser exclusivement sur une base éphémère isolée.
- `pnpm test:validate-version` : tests de contrat de l'orchestrateur.

Le même programme pilote chaque profil Linux/Windows. Les scripts de tests existants sont conservés dans `package.json`. Les jobs historiques v31/v32 gardent leur couverture propre : un test historique en échec ne peut pas être ignoré sans analyse et décision documentée.

## Préconditions et sécurité

Node.js 24, pnpm 12.10 et dépendances installées. Les profils PostgreSQL exigent `SMN_TEST_DATABASE_URL` ou `SMN_DATABASE_URL` ; cette présence ne constitue **pas** une attestation de compatibilité effective du schéma. Ne jamais lancer un profil de migration sur la base personnelle ou de production. L'orchestrateur de validation n'appelle aucune migration destructive ou `db:upgrade --apply`.

Les échecs arrêtent les commandes suivantes et produisent `audit-output/version-validation-<profil>.json` contenant la liste des étapes passées et en échec. Chaque workflow ciblé archive son rapport même en cas d'échec.

## Limites et prochaines améliorations

La vérification du numéro de schéma réel et des migrations sur chaque base de test est encore portée par les tests spécialisés, non par une lecture SQL transversale de cet orchestrateur. L'initialisation et l'isolation des bases continuent à relever des jobs GitHub Actions. Le packaging Windows et les tests legacy d'I0 conservent leurs procédures spécifiques ; ils ne doivent pas être supprimés. Une CI verte requiert **tous** les jobs obligatoires réussis, et une validation de migration nécessite les tests v32 vers v33 et installation native v33.

## Traçabilité

PR de consolidation : https://github.com/JeanLamora75/SMN/pull/276
