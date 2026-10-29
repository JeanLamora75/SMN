# SMN-332 — Contrôle CI contre la réintroduction des gardes locaux

Date : 29 octobre 2026.

## Contrat implémenté
- `scripts/check-new-schema-guards.mjs` : compare les lignes ajoutées entre deux révisions Git, dans `src/app/api/**/*.ts(x)`, et bloque les comparaisons de `schema_version`, les bornes JS de versions et les listes de versions codées localement.
- La sortie d'échec précise chemin, ligne, règle et extrait. Le script échoue si les références Git sont invalides ou si le diff ne peut être calculé.
- Lignes supprimées et fichiers hors API exclus; les gardes existants ne font pas échouer rétroactivement l'introduction du contrôle.
- Exception ciblée via commentaire `smn-schema-guard-exception: <justification détaillée> test=tests/<preuve>.test.ts` sur la ligne ou immédiatement au-dessus. Le fichier de test doit exister. Les exceptions nécessitent une revue humaine et ne sont pas un contournement général.
- `tests/smn-332-new-schema-guards.test.mjs` : scénarios de refus, d'autorisation hors API, de contrat central, de suppression et d'exception.
- `.github/workflows/verify-i0.yml` : job indépendant `schema-guard-regression`, exécute les tests et contrôle le diff des révisions `github.event.before` (push) ou `github.event.pull_request.base.sha` (PR), avec checkout complet.

## Adaptation volontaire
Le scan ne compare que les **lignes ajoutées**, non les modifications sémantiquement équivalentes réparties sur plusieurs lignes, ni le contenu de nouveaux gardes dans un fichier serveur. L'inventaire complet reste assuré par `scripts/audit-schema-version-guards.mjs` et les futurs contrôles de SMN-333. Un adaptateur technique reste possible avec justification et preuve de test.

## Validation
Les commits ont été publiés sur main. Les résultats du job CI ajouté doivent être consultés avant de clôturer SMN-332. Aucune exécution locale n'est revendiquée.
