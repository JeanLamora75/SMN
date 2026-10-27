# Passe A — contrôle statique des contrats

Date : 27 octobre 2026. Relecture de la liste des équipes, des routes de cycles, des cadences et des faits marquants.

Défaut corrigé : lorsque la table optionnelle `smn_team_context` n'existe pas, `listInstallationTeams` renvoie maintenant les colonnes de mode et archivage, en v29, au lieu d'une forme de ligne incomplète. Test de non-régression ajouté dans `tests/smn-287-team-list-schema.test.ts`.

Vérifications locales recommandées depuis la branche de la PR sous PowerShell :

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Ces commandes n'ont pas été exécutées ici : leurs résultats restent inconnus. Les erreurs doivent être relevées avant de considérer la passe A terminée. Aucun déverrouillage multiéquipes ni migration exécuté.
