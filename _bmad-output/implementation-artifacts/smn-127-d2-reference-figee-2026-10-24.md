# SMN-127 — D2 : référence figée commune HTML/PDF

Date : 24 octobre 2026. Décision : Puppeteer Core et Chrome (D1).

## Livré sur main

- Référence figée de rapport `smn_report_render_reference` persistée en PostgreSQL (UUID, Sprint, auteur, horodatage, charge JSON, SHA-256 canonique).
- Lecture du Sprint, de sa composition, des options, notes, métriques, tendances, langue et logo dans une transaction `REPEATABLE READ` avant enregistrement du document figé.
- API POST administrateur `/api/admin/reports/sprints/[id]/render-references` qui crée une nouvelle référence explicite.
- La page de préparation propose « Figer et prévisualiser ». L'aperçu avec `?reference=<uuid>` utilise exclusivement la charge figée et vérifie son empreinte SHA-256 et son périmètre ; aucun repli silencieux vers des données à jour en cas de référence absente ou dégradée.
- L'aperçu sans paramètre conserve son mode dynamique historique. Aucun PDF ni archive finale n'est créé lors de la préparation.
- Normalisation du Base64 des logos PostgreSQL et libellés FR/EN.

## Limites et prochaines étapes

- Le moteur PDF (D3) n'est pas encore raccordé ; il devra être alimenté par `readFrozenReportReference` et exactement le même rendu que l'aperçu figé.
- Une référence figée est un **instantané de rendu préparatoire**, pas une archive PDF finale. Gestion de rétention et suppression d'instantanés à définir pour éviter une croissance illimitée.
- Les critères de confidentialité des textes libres restent à auditer avant téléchargement et archivage. Les données sont persistées sous forme JSON en base et nécessitent la protection et sauvegarde de l'Epic 2.
- La transaction REPEATABLE READ stabilise le cliché SQL ; vérifier les lectures de données dépendantes de services extérieurs lorsqu'ils seront raccordés.
- Aucun test, typecheck, build ou recette navigateur/PostgreSQL n'a été exécuté depuis les connecteurs.

Vérifications : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-127-d2-reference.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
