# SMN-297 — Recette technique locale du lot 3 (Windows 11)

**Statut : procédure préparée, non exécutée.** Référence : PR #204, branche `feat/smn-287-agile-multi-teams-20261027`.

## Préconditions

Utiliser le dépôt local SMN via GitHub Desktop ; récupérer la branche de la PR #204. Ne pas travailler sur `main` et conserver une sauvegarde de la base PostgreSQL de développement avant toute recette impliquant des écritures. Vérifier que `src/lib/team-context-readiness.ts` contient toujours `MULTI_TEAM_CONTEXT_READY:boolean=false`. Ne pas modifier ce verrou : toutes les API multiéquipes restent volontairement fermées.

## Étape A — Contrôles sans écriture en base

Depuis PowerShell, à la racine du dépôt :

```powershell
node --version
pnpm --version
git branch --show-current
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm db:diagnose
```

Consigner pour chaque commande le code retour et la première erreur significative. `pnpm db:diagnose` est un diagnostic ; ne lancer ni `db:sync:ceremonies` ni une migration durant cette séquence. Ne pas interpréter les tests statiques comme une validation des comportements PostgreSQL.

Pour cibler d'abord le lot 3 :

```powershell
pnpm exec tsx --test tests/smn-297-*.test.ts
```

## Étape B — Vérifications fonctionnelles différées

Le verrou restant fermé, les endpoints multiéquipes doivent répondre `503 context-not-ready` à un administrateur authentifié. Ne pas tenter de contourner le verrou pour forcer une recette d'écriture. Préparer deux équipes distinctes A/B et des données de test uniquement dans la base de développement, puis attendre une phase de recette autorisée.

Scénarios à exécuter après déverrouillage décidé séparément : tentative de lecture et d'écriture d'une cérémonie B sous contexte A (refus, sans historique créé) ; Sprint fermé (refus) ; concurrence avec révision obsolète (conflit) ; tenue/non tenue/annulation et durée réelle ; décisions/actions/faits marquants liés au bon Registre ; absence couvrant uniquement A et absence chevauchant A/B (ne pas exposer cette dernière). Vérifier aussi l'intégrité transactionnelle en présence de tables d'audit manquantes.

## Étape C — Retour de recette

Fournir les sorties de `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm db:diagnose` et, si un démarrage est fait, `/api/diagnostic`. Masquer mots de passe, secrets et chaînes de connexion. Classer chaque anomalie en compilation, régression métier, prérequis de schéma ou isolation d'équipe.

**Critère de sortie :** aucune activation, migration ou fusion tant que les contrôles nécessaires ne sont pas vérifiés sur le PC de développement et les anomalies bloquantes traitées.
