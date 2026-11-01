# SMN-347 — Habilitations nominatives par équipe (option A)

## Décision appliquée
Les définitions globales d'indicateurs sont administrées exclusivement par les administrateurs.
Les comptes `user` explicitement habilités peuvent consulter le catalogue et gérer les sélections et préférences uniquement des équipes attribuées. Une préférence d'équipe ou un `teamId` fourni par le client n'est jamais un droit d'accès.

## Architecture et sécurité
- `smn_indicator_team_grant` contient les droits nominatifs révocables, par installation, compte et équipe ; aucune attribution implicite.
- `src/server/indicators/team-access.ts` résout les équipes accessibles à partir d'un compte actif, initialisé et dont le mot de passe est confirmé.
- `src/server/indicators/catalog.ts` vérifie les droits avant toute lecture ou mutation locale, et interdit les mutations de définition globale aux comptes `user`.
- Les routes de catalogue et d'habilitations relisent la session sur le serveur et contrôlent l'origine des mutations. Les habilitations sont administrées par un administrateur uniquement.
- La page et la navigation n'affichent que les équipes autorisées. La sélection d'équipe de l'interface ne remplace pas le garde serveur.
- L'activation et la révocation s'appliquent aux nouvelles requêtes, sans réinitialisation de session.

## Migration
- Installation native v33 neuve : le SQL des droits est appliqué dans la transaction d'installation, séparément du DDL canonique v33, pour conserver son checksum.
- Installation v33 existante : `pnpm db:upgrade --check` indique si la table manque ; après sauvegarde vérifiée, renseigner `SMN_V33_BACKUP_VERIFIED=YES` et exécuter `pnpm db:upgrade --apply`.
- La migration est additive, ne supprime aucune table ni donnée, et initialise les habilitations à **aucun droit**.
- Les comptes existants ne sont pas promus implicitement. L'administrateur doit attribuer les droits dans Indicateurs dynamiques > Habilitations par équipe.

## Recette automatisée
- `pnpm test:smn-347` : contrat UI, parité FR/EN, RBAC et migration.
- `pnpm db:test:smn-347` : base PostgreSQL jetable, création globale, sélection, isolation, préférences, révocation et refus d'une écriture globale pour un compte utilisateur.
- `pnpm typecheck`, `pnpm lint`, `pnpm i18n:check` et `pnpm db:diagnose`.
- Vérifier manuellement avec deux équipes et un compte Scrum Master : non habilité = refus ; équipe A attribuée = lecture et écriture locales ; équipe B = refus ; révocation = refus immédiat ; seules les actions globales sont visibles par un administrateur.

## Limites de preuve
Les tests automatisés GitHub Actions s'exécutent sur bases jetables, pas sur l'installation Windows de l'utilisateur. La recette visuelle et la migration sur cette installation exigent une exécution locale. La suite globale du projet peut avoir des régressions indépendantes de ce périmètre, à documenter séparément. Le script uv BMAD n'est pas exécutable dans cet environnement ChatGPT ; le skill d'Amelia et les sources ont été lus via GitHub.
