# Epic 4 — Consolidation et vérification avant main

Date : 2026-10-22
Branche de consolidation : `fix/epic4-consolidation-verification`
Base : `fix/smn-p0-04-snapshot-consistency` (PR #87) ; cette base inclut les PR empilées #80–#86. **Pas de fusion dans main.**

## Périmètre
SMN-65 à SMN-88, correctif i18n #80, correctifs P0 #81 à #87, modèles Prisma, migrations SQL et fonctionnalités de capacité.

## Contrôles réellement effectués
- GitHub : lecture des fichiers techniques de Sprint, capacité, clôture, replanification, configuration des plages de travail.
- Vérification statique des dictionnaires FR/EN : 1534 clés dans chaque langue ; aucune clé orpheline dans un seul catalogue.
- Vérification du code de tendances : utilise les snapshots versionnés ; ne lit plus la table vivante des Story Points pour calculer les tendances.
- Nouvelle protection ajoutée : rejet prudent des calculs de capacité lorsque le fuseau des horaires d'équipe diffère du fuseau du Sprint concerné.
- Comparaison GitHub `main` vs branche de base : changements très étendus (139 fichiers signalés au moment du contrôle). Cela ne prouve pas l'absence de conflits fonctionnels.

## Vérifications NON exécutées
L'environnement de vérification ne contient pas de clone du dépôt, ne peut pas joindre GitHub avec git et ne dispose ni de Node 24 ni de pnpm 12.10.0. **Aucune commande pnpm, tsc, eslint, test, Prisma migrate ou connexion PostgreSQL n'a été exécutée.**

## Procédure Windows 11 (sur clone de la branche de consolidation)
Depuis le dossier du dépôt, après synchronisation GitHub Desktop sur la branche indiquée :

```powershell
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm exec prisma validate
pnpm typecheck
pnpm i18n:check
pnpm lint
pnpm test
pnpm exec tsx --test src/server/capacity/meeting-intervals.test.ts src/server/capacity/work-slots.test.ts
pnpm build
```

Avant migration SQL, **sauvegarder la base** et consulter la politique existante du projet : ne jamais appliquer `migrate dev` ou `db push` sur une base contenant les données réelles sans procédure approuvée. Valider la liste et l'ordre des migrations, puis exécuter la procédure de déploiement sur une base de test PostgreSQL 18.6. Tester le parcours complet de Sprint, clôture et réouverture, capacité exceptionnelle, changements d'heure, permissions et replanification.

## Décision
**NO-GO** : vérifications techniques et intégration PostgreSQL encore requises ; P0-03 reste partiel (mode de recalcul automatique non implémenté), et les règles horaires individuelles / durées réelles divergentes restent à cadrer. Cette PR n'est pas une certification de conformité.
