# SMN-131 — Masquer ou supprimer exceptionnellement une archive

Jira : https://lmn24.atlassian.net/browse/SMN-131 — Story 6.22.

## Incrément publié sur main
- Masquage administratif d'un PDF existant avec motif obligatoire dans une table séparée `smn_report_archive_visibility`. Aucun cycle, bilan ni autre fichier n'est modifié.
- Action proposée dans la bibliothèque privée, avec saisie du motif et confirmation explicite ; annulation sans effet.
- API POST réservée aux administrateurs et vérification du rattachement de l'archive à l'installation.
- Bibliothèque générale et liste d'archives de Sprint filtrent les documents masqués.
- Suppression exceptionnelle refusée par défaut : aucune suppression physique de document introduite sans politique d'effacement, audit durable et contrôle de cohérence disque/DB.

## Réserves
- AC3 (suppression exceptionnelle confirmée) non réalisé ; mécanisme d'audit plus complet et politique de suppression/restauration à élaborer.
- Les routes futures de téléchargement doivent vérifier également l'état masqué, sans s'en remettre uniquement aux listes.
- Le service d'archivage réel reste bloqué par SMN-127/128 ; recette sur les archives existantes à prévoir.
- Aucun test, typecheck, build ou recette DB/navigateur exécuté. Jira demeure ouverte.

Validation Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-131-archive-visibility.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
