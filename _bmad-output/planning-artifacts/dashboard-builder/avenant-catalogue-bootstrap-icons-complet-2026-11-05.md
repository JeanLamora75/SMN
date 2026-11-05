# BMAD — Catalogue Bootstrap Icons complet (Option B)
Date : 05/11/2026 | Projet : SMN v33 | Story : [SMN-383](https://lmn24.atlassian.net/browse/SMN-383) | Epic : SMN-353

## Décision validée
Le sélecteur d'icônes transversal de SMN doit proposer **toutes les icônes officielles de la version intégrée**, en plus des favoris et des icônes récemment utilisées. Pas de CDN ni de connexion Internet requise à l'exécution. Le catalogue chargé depuis `twbs/icons` **v1.13.2** (`font/bootstrap-icons.json`) contient **2078 icônes**.

## Contrat UX
- Conserver le composant `IconPicker` et sa fenêtre intégrée Cockpit Agile : recherche, filtre par catégories, compteur, aperçu et suppression de l'icône.
- Ajouter `Favoris` (marquer/démarquer avec étoile sans déclencher la sélection), et `Récentes` (dernières sélections, ordre décroissant). Conservation locale dans le navigateur; la configuration du dashboard ne contient que le nom de l'icône choisie. L'utilisateur n'a aucune action d'installation.
- Afficher les icônes sous forme de tuiles lisibles, résultat initial limité (chargement incrémental), recherche couvrant les noms exacts en anglais et les libellés métiers courants en français. Le filtre « Toutes » reste disponible.
- Clavier/ARIA/focus initial et restauré/Échap/contraste/mobile; pas de sérialisation de SVG ou HTML arbitraire.

## Architecture
- Dépendance versionnée `bootstrap-icons@1.13.2`, CSS et police `woff2` servis par Next.js en local. Aucun téléchargement par le navigateur hors de SMN.
- Catalogue statique généré depuis `font/bootstrap-icons.json` de **la même version**. S'assurer que les glyphes affichés correspondent à la liste blanche utilisée pour valider `DashboardBlock.icon` et `DashboardSlot.icon`.
- Rendu générique `SMNIcon` indépendant du Builder. Le composant SVG historique `bootstrap-icon.tsx` reste inchangé pour éviter les régressions des écrans existants.
- Persistance de favoris/récents uniquement en `localStorage` (identifiants d'icônes non sensibles), stockage JSONB v1 des dispositions inchangé.
- Opérations existantes de copie et de duplication conservées; les 28 noms précédents doivent rester valides.

## Recette
1. Vérifier que les **2078** noms de v1.13.2 sont proposés et passent la validation serveur; un nom inconnu est refusé.
2. Confirmer les tuiles après recherche/catégorie/favoris/récents et le rendu des icônes en consultation.
3. Vérifier favori sans sélection et récents mis à jour à la sélection; résistance à un stockage navigateur désactivé.
4. Tester retour clavier, focus, Échap, light/dark, écrans étroits, pagination et commandes initiales.
5. Exécuter `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm exec tsx --test tests/smn-382-383-dashboard-actions-icons.test.ts` via CI, puis recette sur Windows. Ne pas déclarer Terminé sans preuves.

## Références
- [Bootstrap Icons 1.13.2](https://github.com/twbs/icons/tree/v1.13.2)
- [Source officielle du catalogue](https://github.com/twbs/icons/blob/v1.13.2/font/bootstrap-icons.json)
- [Skill Amelia](https://github.com/JeanLamora75/SMN/blob/main/.agents/skills/bmad-agent-dev/SKILL.md)

**Adaptation d'exécution** : accès GitHub par connecteur, pas de script uv local; les tests doivent être prouvés par Actions et/ou poste utilisateur. Le document décrit les exigences et ne constitue pas une preuve de livraison.

## Publication effective
- Version de bibliothèque : `bootstrap-icons@1.13.2` dans `package.json` et `pnpm-lock.yaml`; empreinte SHA-512 confirmée dans le verrou pour installer avec `--frozen-lockfile`.
- `src/lib/dashboard-builder/icon-catalog.ts` : **2078 identifiants** issus du registre officiel v1.13.2, catégories et libellés métier FR lorsque disponibles; validation serveur inchangée mais étendue au registre complet.
- `src/app/app/smn-icon.tsx` : affichage commun des glyphes locaux; `src/app/layout.tsx` : CSS officiel importé dans le bundle Next.js.
- `src/app/app/icon-picker.tsx` : favoris et récents stockés dans le navigateur, sélection indépendante de la mise en favori, recherche et affichage par 72 entrées.
- `src/app/app/dashboard-builder/dashboard-consultation.tsx` : rendu des icônes arbitraires validées dans les blocs et les emplacements.
- `tests/smn-382-383-dashboard-actions-icons.test.ts` : tests de catalogue complet et d'intégration ajoutés.
- Validation initiale GitHub Actions du commit `c097ac66` : **installation pnpm verrouillée OK et étape TypeScript OK (Linux)**; autres jobs en cours au moment de la rédaction. Recette navigateur locale non effectuée.
- Activation par connecteurs GitHub/Jira; script `uv` BMAD non exécuté dans cet environnement.
