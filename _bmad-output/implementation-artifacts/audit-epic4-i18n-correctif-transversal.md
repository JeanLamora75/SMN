# Epic 4 — Correctif transversal i18n (SMN-65 à SMN-88)

## Branche
`fix/epic4-i18n-crosscutting` issue de `feat/smn-88-reschedule-review-warnings`.

## Corrections intégrées
- Retrait des libellés français codés en dur dans les liens et titres de navigation Sprint/Bilan ; composants clients localisés.
- Centralisation de la présentation des types d'événements (`standard`, `custom`, `exceptional`) et statuts planifiés, courants et clôturés.
- Localisation des dates et horaires affichés, via la langue applicative `useLocale()` et `Intl.DateTimeFormat`, référence de fuseau `Europe/Paris`.
- Application aux écrans de tenue, durée réelle, capacité exceptionnelle, état des Sprints, réunion exceptionnelle et clôture.
- Introduction de la section `epic4Ui` dans les catalogues français et anglais.

## Vérifications effectuées
- Lecture GitHub des composants modifiés et des deux catalogues.
- Contrôle statique : 1 523 clés de traduction par langue, aucune clé divergente.
- Contrôle des clés littérales `t("...")` dans les composants modifiés : aucune absente.
- Suppression des occurrences UTC hardcodées identifiées dans ces composants.

## Réserves
- Compilation TypeScript/Next.js et tests UI réels **non exécutés** ; GitHub Actions indisponible.
- Les historiques JSON de correction et les instantanés de clôture sont encore rendus en JSON technique et nécessitent une future vue métier traduite.
- Les anciennes valeurs de texte métier renvoyées par d'autres APIs doivent être contrôlées en recette.
- Le fuseau applicatif de présentation est Europe/Paris ; vérifier la politique de timezone par équipe pour l'usage international.
- Aucun changement des données en base ni des valeurs techniques persistées.
