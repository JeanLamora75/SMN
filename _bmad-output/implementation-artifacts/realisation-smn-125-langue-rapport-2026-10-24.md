# SMN-125 — Langue FR/EN indépendante du rapport

Jira : https://lmn24.atlassian.net/browse/SMN-125 — Story 6.14.

## Publié sur main

- Contrat `ReportLanguage` FR/EN et repli français explicite, sans libellé technique pour une langue inconnue.
- Préférence indépendante de la langue de session, enregistrée par Sprint avec révision optimiste et droit d’écriture Admin.
- Sélecteur FR/EN dans la préparation et lecture de ce choix par la prévisualisation HTML pour les titres, rubriques, alertes et noms des mesures.
- Les champs libres (objectifs, notes de sections, introduction, conclusion et contexte d’équipe) restent bruts ; les notes conservant leur attribut `lang` d'origine, sans traduction IA.
- La prévisualisation HTML porte `lang=fr|en`. Tests unitaires préparés.

## Limites

- Le moteur d'export PDF n'est pas encore développé : la concordance des libellés PDF/HTML (AC3) sera à vérifier au moment de son raccordement. 
- La langue est pour le moment enregistrée par brouillon/Sprint, pas encore par archive ou par rapport distinct. Les données historiques restent inchangées.
- La couverture complète des libellés métier comme les statuts bruts et codes d'évaluation devra être vérifiée ; quelques valeurs peuvent apparaître telles qu'en base dans l'aperçu.
- Aucune exécution de tests, typecheck, build ou recette Postgres/navigateur. Jira reste ouverte.

Vérifications Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-125-report-language.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
