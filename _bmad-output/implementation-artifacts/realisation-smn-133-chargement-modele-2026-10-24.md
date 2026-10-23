# SMN-133 — Charger et adapter ponctuellement un modèle

Jira : https://lmn24.atlassian.net/browse/SMN-133, Story 6.12.

## Livré sur main
- Sélection d'un modèle Standard ou personnalisé et action explicite « Charger dans le rapport », avec confirmation avant remplacement des options du brouillon.
- Application transactionnelle et atomique de l'ordre/visibilité des six sections, des sélections d'indicateurs et informations qualitatives, et de la profondeur historique au Sprint choisi.
- Les modèles sources ne sont jamais modifiés par ce chargement. Les éditeurs déjà présents permettent des adaptations ponctuelles sans écriture dans le modèle.
- Rechargement de la page pour reprendre les préférences appliquées ; message dédié pour un modèle supprimé ou indisponible.
- Les modifications pérennes d'un modèle personnalisé restent une action séparée de l'éditeur de modèle, avec validation de révision.

## Limites et vérifications
- Une action de chargement enregistre directement les choix dans le brouillon du Sprint ; les anciennes options du brouillon sont remplacées après confirmation. Ce n'est pas un état transitoire non sauvegardé.
- Les modifications non sauvegardées dans les éditeurs frères ne sont pas encore détectées de manière coordonnée au moment du chargement. Prévoir une recette UX couvrant cet abandon.
- L'aperçu ne gère pas encore un rattachement indépendant par instance archivée ; les options restent par Sprint.
- Aucun test, typecheck, build ou recette PostgreSQL/navigateur exécuté ici. Jira reste ouverte.

Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-133-template-load.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
