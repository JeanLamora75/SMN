# SMN — Refonte progressive de la sidebar (lot 1)

Date : 24 octobre 2026 · agent : Amelia (BMAD v6.12.4) · branche : `ux/smn-sidebar-first-pass-20261024`.

## Problème et décision
Le panneau latéral réaffichait le contexte produit/équipe/mode Scrum déjà fourni par l'en-tête ; les libellés de navigation pouvaient être coupés en deux lignes ; les icônes étaient de petits symboles Unicode et le menu conservait des accès redondants. L'utilisateur a demandé une refonte inspirée d'une référence visuelle, **par étapes**. Seul ce premier lot est traité.

## Modification livrée sur la branche
- `src/lib/private-navigation.ts` : les trois premiers menus sont **Tableau de Bord / Équipe / Calendrier** ; groupe Pilotage consolidé, suppressions des entrées `security` et `events`, maintien des routes et modes réellement disponibles, icônes Bootstrap typées. Sécurité reste accessible à travers `settingsCatalog`.
- `src/app/app/private-navigation.tsx` : retrait complet de `smn-nav-workspace` ; titres des groupes visuellement cachés mais accessibles ; utilisation de `BootstrapIcon` pour chaque ligne.
- `src/app/app/private-shell.tsx` : plus aucun passage du produit ou de l'équipe à la sidebar ; la sélection d’équipe et le Sprint demeurent dans le header ; le produit reste présent dans les pages métier où il est pertinent. Comportement collapse et fermeture menu mobile inchangé.
- `src/app/app/bootstrap-icon.tsx` : pictogramme maison `house-fill` embarqué dans le jeu d'icônes SVG du projet, sans CDN.
- `src/app/dashboard.css` : menu visuellement continu avec icônes 22 × 22 px, conteneur de 26 px, hauteur de ligne minimale 46 px, labels sans retour à la ligne, largeur de menu 242 px, ombre et fond actif discrets, maintien des tooltips en mode replié et de la navigation mobile.
- `src/i18n/fr.json` et `src/i18n/en.json` : nouveau libellé bref « Calendrier » / « Calendar » ; libellé « Tableau de Bord » demandé.
- `tests/private-navigation.test.ts`, `tests/smn-227-settings-navigation.test.ts` et `tests/smn-sidebar-first-pass-20261024.test.ts` : assertions de navigation, traduction, sécurité, accessibilité et responsive ajustées.

## Contraintes et non-régressions
- La disparition du lien latéral « Sécurité du compte » **ne supprime pas** `/app/security` ni le changement de mot de passe.
- La suppression de « Événements Agile » **ne supprime aucune donnée** du calendrier ni d’événement.
- La page Equipe ne devient pas accessible à un rôle user auquel elle est interdite par les contrats de sécurité.
- Les rubriques restantes restent dans leur état actuel (pages actives, placeholders ou modes Scrum/Kanban). L'utilisateur pourra demander la suite de la refonte visuelle.
- GitHub Actions est désactivé. La consultation et les modifications effectuées via GitHub ne prouvent **pas** l'exécution de `pnpm typecheck`, des tests TSX, du build ni d'une comparaison visuelle navigateur.

## Recette Windows/PowerShell
```powershell
git switch main
git pull origin main
pnpm typecheck
pnpm exec tsx --test tests/smn-sidebar-first-pass-20261024.test.ts tests/private-navigation.test.ts tests/smn-227-settings-navigation.test.ts
pnpm build
pnpm dev
```
Ouvrir `http://localhost:3003/app` : vérifier absence du bloc en haut à gauche, ordre des trois premiers items, icônes, libellés FR/EN non coupés, clic Calendrier, accès Sécurité dans Paramètres, disparition des anciens items, utilisateur admin/user, mode Kanban, navigation pliée et mobile, clavier/focus. La validation fonctionnelle finale dépend de la recette locale.

## Adaptation BMAD
Le fichier du skill Amelia a été inspecté dans le dépôt. Les scripts `uv run` de résolution/personnalisation BMAD et les tests locaux ne sont pas exécutables dans cette session GitHub connectée, faute d'un checkout de projet exploitable ; aucun résultat d'exécution n'est revendiqué.
