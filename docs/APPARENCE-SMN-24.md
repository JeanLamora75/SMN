# SMN-24 — Thèmes clair/sombre et palettes contrôlées

**Story Jira :** https://lmn24.atlassian.net/browse/SMN-24 — Story 1.15 de l'Epic SMN-1

**Code fusionné dans `main` :** [PR #19](https://github.com/JeanLamora75/SMN/pull/19) (socle des thèmes clair/sombre), [PR #20](https://github.com/JeanLamora75/SMN/pull/20) (palettes d'accent persistées, migration v6). **Tests CI/Windows non attestés.**

## Fonctionnement

Dans **Administration → Paramètres généraux**, un Administrateur peut désormais sélectionner un **thème global** (Clair, Sombre) et une **palette prédéfinie** (Océan, Forêt ou Violet). La sauvegarde est une transaction PostgreSQL auditée et protégée par révision optimiste (HTTP 409 si configuration concurrente). Un choix invalide déclenche HTTP 400 avant toute écriture ; le serveur n'accepte aucun code hexadécimal ou CSS venant du navigateur. Les préférences sont visibles après rechargement et navigation. Les anciennes requêtes PATCH de SMN-18 sans palette sont supportées et préservent la palette enregistrée.

À chaque chargement SSR, `src/server/settings/appearance.server.ts` lit les valeurs via connexion SELECT, sans migration automatique. La racine HTML porte `data-bs-theme="light|dark"` pour Bootstrap 5 et `data-smn-palette="ocean|forest|violet"`. Si l'installation, la table ou la valeur n'est pas exploitable, l'interface utilise une apparence sûre `light/ocean` ; une ancienne base v5 conserve son thème tant que la migration v6 n'est pas encore appliquée.

Les thèmes s'appliquent au socle public et privé, aux menus, aux fiches, au tableau de bord et aux formulaires. Les couleurs d'accent, fonds, surfaces, bordures et états de focus sont regroupés dans `src/app/appearance.css`, sans dépendance CSS externe. Aucun texte libre, historique Scrum/Kanban, droit, métrique ou données produit/équipe n'est modifié par l'apparence.

## Migration de données

La migration **`20261021_smn24_appearance_palette`** passe le schéma de **v5 à v6** et ajoute seulement :

```sql
ALTER TABLE public.smn_general_settings
  ADD COLUMN palette text NOT NULL DEFAULT 'ocean'
  CHECK (palette IN ('ocean','forest','violet'));
```

Une installation existante garde son thème, sa langue, ses comptes, son équipe, son pays et ses révisions. La migration est verrouillée/transactionnelle par le moteur existant `ensureAccountsSchema`, et historisée dans `_prisma_migrations` avec checksum. Le diagnostic accepte la version v6 complète et refuse tout état partiel. **Aucun SQL n'est à exécuter manuellement sur la base locale**.

## Validation par AC

| Critère | Preuve de conception et tests à exécuter |
| --- | --- |
| AC1 | `src/app/layout.tsx`, `src/app/appearance.css`; chargement SSR clair/sombre et navigation Bootstrap |
| AC2 | `src/app/app/admin/settings/settings-form.tsx`, `src/server/settings/manager.ts`, migration v6 et audit |
| AC3 | Libellés textuels explicites des états, erreurs, indisponibilités ; états de focus et variables Bootstrap |
| AC4 | `src/lib/appearance.ts` et validation allowlist serveur / contrainte SQL ; repli SSR ; `tests/appearance.test.ts` |
| AC5 | `src/app/api/admin/settings/route.ts` inchangé ; `authorizeApi` et `canAccess` ; tests HTTP existants et nouveaux |

### Recette sur le poste Windows

Après synchronisation **GitHub Desktop → main → Fetch origin → Pull origin**, démarrer l'application puis tester les 2 thèmes × 3 palettes, tous les écrans disponibles, le contraste des champs/alertes et l'accessibilité au clavier.

```powershell
pnpm install --frozen-lockfile
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Les tests ajoutés incluent `tests/appearance.test.ts`, `tests/general-settings.test.ts` et les scénarios du pilote HTTP PostgreSQL éphémère dans `scripts/verify-http-ci.mjs`. **Tests/CI et recette Windows non attestés comme exécutés à ce stade** ; conserver Jira **En cours** jusqu'à confirmation.


## Contrats UX du tableau de bord — validés le 21 octobre 2026

**Référence obligatoire pour les agents BMAD (PM, Analyst, UX, Architect, Dev, QA) et pour les futures User Stories :** [DESIGN.md](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/DESIGN.md) · [EXPERIENCE.md](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/EXPERIENCE.md) · [Synthèse UXD-01 à UXD-27](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/SYNTHESE-CADRAGE-UX-SMN.md) · [Sommaire et maquette décrite](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/README.md).

**Décisions validées :** écran pleine largeur, sidebar rétractable, sélecteurs équipe/cycle dans le header, cartes J/H prévu/réel, SP et tickets **initialement engagés**/réalisés, compteur en jours ouvrés **du lundi au vendredi**, pas de carte « Avancement global » sans règle validée, quatre colonnes (obstacles, risques, événements, notes/alertes), 5 éléments actifs maximum par colonne, tri automatique, actions rapides contrôlées, historique fidèle ou message exact **« Aucun éléments à ce jour »**, personnalisation des métriques/colonnes, responsive 4/2/1.

**Statut :** contrats UX approuvés et publiés, **pas** de nouvelle fonctionnalité ou de recette attestée. Les producteurs de données, règles d'historisation, droits et catalogues FR/EN restent à vérifier avant implémentation.

**Implication spécifique :** Les tokens visuels proposés par DESIGN.md s'adossent aux thèmes et palettes existants SMN-24 ; aucun nouveau thème ni changement de réglage global n'est prescrit. Les variables exactes restent à éprouver.
