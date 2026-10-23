# SMN-130 — Bibliothèque des rapports PDF archivés

Jira : https://lmn24.atlassian.net/browse/SMN-130 — Story 6.20.

## Publication main
- Bibliothèque distincte des aperçus : `/app/admin/reports/archives`, limitée à l'administrateur par contrôle serveur.
- Recherche SQL paramétrée sur les seuls PDF archivés, et bornage par installation / équipe existante (Sprint Scrum) ; filtres cycle UUID, dates d'export, modèle et statut d'archive.
- Résultats triés par date, identifiants et métadonnées utiles ; pagination 25 éléments et état vide explicite.
- Lien contextuel depuis le rapport d'un Sprint vers sa bibliothèque préfiltrée.
- Libellés français et anglais, tests de validation des filtres.

## Réserves
- Pas encore de lien de téléchargement des octets PDF : nécessite l'autorisation archive et les contrôles d'intégrité prévus au prochain incrément.
- Le stockage ne contient normalement aucun PDF avant la finalisation de SMN-127/128 : bibliothèque potentiellement vide.
- La bibliothèque couvre actuellement les sprints Scrum ; extension Kanban différée.
- L'URL de bibliothèque n'est pas encore intégrée au menu latéral global ; accessible depuis la fiche de rapport Sprint.
- Recette des restrictions d'accès et des archives masquées à compléter. Aucun test, typecheck, build ni recette DB/navigateur exécuté, Jira laissée ouverte.

Validation : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-130-archive-library.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
