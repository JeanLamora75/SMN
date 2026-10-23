# SMN-129 — Registre des archives PDF par cycle et version

Jira : https://lmn24.atlassian.net/browse/SMN-129 — Story 6.19.

## Incrément publié sur main
- Index en lecture seule des archives d'un Sprint, triées par date puis identifiant, avec Vn, modèle, langue, horodatage et manifeste conservé.
- Intégrité du fichier privé vérifiée par SHA-256 et taille ; états `verified`, `degraded`, `unavailable` sans reconstitution silencieuse.
- Préparation du rapport : liste des éditions pour le Sprint, y compris plusieurs V1/V2, avec accès administrateur et libellés FR/EN.
- Contrat de manifeste étendu pour enregistrer le nom de modèle et les options figées lors d'une future génération PDF serveur. Les anciens manifestes sans ces attributs restent consultables.
- Tests de contrat ajoutés : `tests/smn-129-archive-index.test.ts`.

## Blocages et limites
- Aucun PDF n'est automatiquement généré ni archivé par les parcours actuels ; SMN-127/128 restent prérequis. Le registre peut donc rester vide.
- Pas encore de lien de téléchargement privé (nécessite autorisation sur l'archive et son propriétaire), ni édition de modèle figée automatiquement dans le manifeste du producteur PDF.
- L'index ne modifie pas les fichiers existants mais l'immuabilité et la protection contre toute altération manuelle devront être vérifiées sur stockage et restauration.
- Aucun test, typecheck, build, essai PostgreSQL ou navigateur n'a été exécuté. Jira demeure ouverte.

Validation Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-129-archive-index.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
