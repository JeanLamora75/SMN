# SMN-25 — Socle responsive et accessibilité des commandes

**Story :** https://lmn24.atlassian.net/browse/SMN-25 (1.16, I0)

## Périmètre réellement implémenté

1. **Navigation clavier** : lien d'évitement unique et traduit « Aller au contenu principal » sur les pages publiques et privées, cible `#smn-main`, navigation de la page dans l'ordre DOM ; contours de focus visibles sur liens, boutons et champs.
2. **Smartphone/tablette** : largeur adaptable pour les panneaux Bootstrap, formulaires et cartes, libellés et textes longs pouvant revenir à la ligne, boutons/champs de 44 pixels CSS de hauteur minimum sur petit écran, navigation privée sans défilement horizontal imposé. Les composants à venir devront reprendre ces règles.
3. **Comptes utilisateurs** : le tableau desktop reste un tableau, mais les lignes deviennent des **fiches** sur mobile et gardent accessibles les sélecteurs rôle/accès et l'action Enregistrer. Des libellés de colonnes sont rendus dans chaque cellule mobile, avec noms accessibles existants pour les contrôles.
4. **Messages et aides** : erreurs de connexion, changement de mot de passe, installation, sauvegarde des réglages, récupération et administration des comptes reliées à leur formulaire via `aria-describedby` ; `aria-invalid` en cas de validation applicable ; messages de succès `role=status`, erreurs `role=alert`. Les aides des sélecteurs des paramètres possèdent leurs identifiants. Les erreurs ne sont pas signalées par la couleur seule.
5. **Accessibilité motrice** : animations réduites sous `prefers-reduced-motion: reduce`; les icônes décoratives sont masquées des aides techniques et les libellés restent visibles.

## Traçabilité AC

| Critère | Implémentation | Vérification |
|---|---|---|
| AC1 | `src/app/globals.css` : adaptatif ; `src/app/app/admin/users/users-admin.tsx` fiches mobiles ; `src/app/dashboard.css` | Contrôle source / recette réelle à faire à 320, 375, 768, 1024, 1440 px |
| AC2 | `src/app/layout.tsx` et pages publiques : skip-link; styles `:focus-visible` ; contrôles natifs | Test statique et parcours Tab / Shift+Tab / Entrée requis |
| AC3 | Champs avec libellés et `aria-describedby`, `aria-invalid`, messages explicites | Tests sources et annonce par lecteur d'écran à réaliser |
| AC4 | Navigation avec texte et icônes décoratives `aria-hidden`; sélecteurs de compte avec `aria-label` | Inspecter nom accessible, focus visible, usage sans souris |
| AC5 | Aucune certification WCAG, mesure de performance ou version de navigateur non testée annoncée | Journal de validation et réserves ci-dessous |

## Tests et limites
- **Écrits** : `tests/responsive-accessibility.test.ts` vérifie les composants et tokens source ; `scripts/verify-http-ci.mjs` vérifie la présence réelle de la cible et du lien d'évitement dans les pages publiques/privées.
- **Non exécutés ici** : interactions réelles sur appareils, test navigateur mobile, ordre de tabulation à l'écran, capture à zoom 200 %, lecteur d'écran (NVDA/VoiceOver), contraste visuel systématique et audit WCAG.
- Les styles adaptatifs et l'usage de contrôles natifs diminuent les risques, mais **ne prouvent pas une conformité WCAG 2.x**.

À vérifier sur le PC après `Fetch origin` / `Pull origin` sur `main` :

```powershell
pnpm install --frozen-lockfile
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Recette manuelle : au clavier, ouvrir Installation, Connexion, Renouvellement du mot de passe, Tableau de bord, Fiche d'équipe, Paramètres et Comptes ; vérifier focus, messages d'erreur et actions. Sur mobile, vérifier qu'une action de compte ne demande pas un défilement horizontal.
