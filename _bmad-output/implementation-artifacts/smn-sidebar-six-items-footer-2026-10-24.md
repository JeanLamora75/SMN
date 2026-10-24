# SMN — Sidebar simplifiée : six menus et Paramètres en bas (lot 2)

**Date :** 24 octobre 2026
**Méthode :** BMAD v6.12.4 — Amelia, développement incrémental
**Branche :** `ux/smn-sidebar-six-items-footer-20261024`

## Demande
Finaliser l'ordre du menu gauche après le premier lot : Tableau de Bord, Équipe, Sprint, Calendrier, Registre, Rapports ; en bas et séparé par une fine ligne : Paramètres.

## Contrats et réalisation
- `src/lib/private-navigation.ts` : réordonne les six entrées du groupe principal et déplace `settings` dans le seul groupe additionnel de pied. Supprime de la sidebar les anciennes entrées de bilan de cycles et briefs IA, sans modifier les données ni les écrans distincts. L'identifiant technique du registre `risks` est conservé pour maintenir la détection des routes actives et les tests antérieurs, mais le libellé visible devient **Registre**.
- **Sprint** correspond à `/app/admin/sprints` en mode Scrum ; en Kanban, conserver `Périodes Kanban` sans destination inexistante.
- **Rapports** est affiché avec son icône et sans destination : aucune page de reporting dédiée n'est actuellement fournie par ce contrat de navigation. Une future livraison métier pourra activer le lien.
- `src/app/app/private-navigation.tsx` : rend le groupe administration avec la classe `smn-nav-group--footer`, sans changer les liens clavier, les libellés accessibles ou la fermeture mobile.
- `src/app/dashboard.css` : nav en colonne flex occupant la hauteur de la sidebar ; `margin-top:auto` repousse Paramètres au bas de l'écran desktop ; `border-top:1px solid var(--smn-border)` sépare le pied. Sur mobile, Paramètres suit normalement la liste avec la même séparation.
- `src/i18n/fr.json`, `src/i18n/en.json` : nouveaux libellés FR/EN pour `Sprint` et `Registre`, et simplification de l'intitulé `Paramètres`.
- `tests/private-navigation.test.ts` et `tests/smn-sidebar-first-pass-20261024.test.ts` : attentes historiques adaptées ; `tests/smn-sidebar-second-pass-20261024.test.ts` : nouveau contrat vérifiant six lignes, ordre, lien de Registre, droits, footer, traduction, responsive et repli.
- `docs/UX-REFERENTIEL-BMAD.md` : décision UX consolidée.

## Sécurité et non-régression
- Aucune création de page ou d'API, aucune modification SQL ou migration.
- L'entrée `Équipe` reste soumise à la permission admin ; `Paramètres` demeure réservée à admin, conformément au MVP.
- Les routes déjà livrées restent accessibles, les liens vers les pages non disponibles ne sont pas inventés.
- Les menus réduits et mobiles conservent leurs icônes, labels accessibles, navigations et contraintes de largeur.
- Les textes des menus restent sur une seule ligne grâce au premier lot.

## Vérifications
Revue des contrats de navigation, du composant, des clés FR/EN, des styles CSS et des tests effectuée au niveau des fichiers GitHub. **Aucune exécution réelle** de `pnpm typecheck`, des tests TSX, du build ou de la recette navigateur n'est attestée ici. GitHub Actions est désactivé ; la validation UX dépend du poste local.

### PowerShell de recette
```powershell
git switch main
git pull origin main

pnpm typecheck
pnpm exec tsx --test tests/private-navigation.test.ts tests/smn-sidebar-first-pass-20261024.test.ts tests/smn-sidebar-second-pass-20261024.test.ts tests/smn-227-settings-navigation.test.ts
pnpm build
pnpm dev
```
Sur `http://localhost:3003/app`, vérifier à hauteur d'écran standard et réduite les six entrées, la ligne fine et Paramètres au bas de la sidebar, l'état actif, la navigation par clavier, la vue repliée, l'ouverture mobile et les labels FR/EN, puis les profils admin et utilisateur.

**Statut :** correctif préparé pour publication ; recette utilisateur nécessaire avant validation définitive.
