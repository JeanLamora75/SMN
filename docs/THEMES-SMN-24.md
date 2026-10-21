# SMN-24 — Thèmes clair/sombre et palettes lisibles

- Jira : https://lmn24.atlassian.net/browse/SMN-24
- Périmètre : MVP I0 ; Bootstrap 5, deux thèmes autorisés, pas de migration SQL.
- Statut : **fusionné dans `main` via [PR #19](https://github.com/JeanLamora75/SMN/pull/19)** ; vérification Windows/CI à faire.

## Fonctionnement
Le paramètre général `theme` (déjà existant en PostgreSQL) conserve **light** ou **dark**. Le serveur lit ce paramètre à chaque requête via `src/server/theme/current.ts` et émet `data-bs-theme` sur la balise HTML. En cas d'absence, d'erreur ou de valeur inconnue, le repli sûr est **light**.

Les palettes claires et sombres sont **deux jeux autorisés prédéfinis**, pas un champ couleur libre : variables `--smn-*`, variables Bootstrap `--bs-*`, contraste texte/surface testé. Les menus, cartes, formulaires et liens des pages existantes utilisent les variables Bootstrap ou leurs dérivées SMN. L'administrateur peut choisir la palette **Clair** ou **Sombre** dans Paramètres généraux, puis l'interface se recharge après enregistrement. Aucun changement de cycle, de métrique, d'autorisation ou de texte libre.

Une configuration de couleur personnalisée arbitraire n'est pas proposée dans le MVP : cela évite de sauvegarder une combinaison illisible et reste cohérent avec le choix de palettes autorisées.

Les badges « Non disponible », « À venir », les messages de sécurité et les validations possèdent des mots/états indépendants de la couleur. Les contraintes de contraste sont contrôlées par `tests/theme.test.ts`.

## Traçabilité
- AC1 : thème sur `<html data-bs-theme>`, CSS à tokens Bootstrap.
- AC2 : `src/app/app/admin/settings/settings-form.tsx`, route PATCH existante et `src/server/settings/manager.ts`, rechargement après enregistrement.
- AC3 : statuts et libellés existants restent explicites indépendamment de la couleur.
- AC4 : choix strict `light|dark`, repli `light` côté lecture et validation de paramètres déjà existante, conservation des réglages en cas d'erreur.
- AC5 : `src/app/api/admin/settings/route.ts` contrôle l'autorisation serveur avant toute modification, inchangée.

## Tests et recette
```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
Tester manuellement la persistance après navigation/rechargement, les pages d'installation, login, tableau de bord, fiches, administration, contrastes des formulaires et impossibilité de mise à jour globale par le profil Utilisateur.

**Attention :** écrire ces tests et fournir le code ne signifie pas que la CI ou la recette Windows les ont exécutés.
