# SMN-52 — Story 3.11 — Administrer les catégories et couleurs des absences

**Jira :** https://lmn24.atlassian.net/browse/SMN-52 · Epic 3. Reprise après SMN-53 : la migration v19 de SMN-53 a déjà créé le schéma et les quatre catégories de base. **Aucune nouvelle migration n'est nécessaire ni souhaitée** pour le catalogue.

## Contrat d'acceptation et correspondances

| Critère | Contrat mis en œuvre |
| --- | --- |
| **AC1** | Page privée **Administration → Membres → Gérer les catégories d’absence** (`/app/admin/absence-categories`). Lecture de `smn_absence_category` et de ses quatre lignes initiales **Congés**, **Formation**, **Maladie**, **Autre** avec couleurs hexadécimales. Affichage du nom, couleur, statut actif et nombre d'absences qui référencent chaque catégorie. |
| **AC2** | Formulaire pour **créer** ou **modifier** une catégorie. Champs requis **nom** (1–100 caractères après normalisation, sans caractère de contrôle) et **couleur** strictement `#RRGGBB` ; palette graphique et valeur hexadécimale. Identifiant généré côté serveur `cat_<uuid-sans-tirets>`, stable et conforme au schéma v19. Toute création est active. Les noms déjà utilisés (comparaison insensible à la casse) sont refusés, limite de 100 catégories. |
| **AC3** | Renommer/recolorer met à jour uniquement `smn_absence_category`, **sans réécrire les motifs ni les absences**. La lecture de SMN-53 fait un `JOIN` du catalogue sur `category_id` à chaque GET : les noms/couleurs actuels apparaissent aussi sur les absences anciennes dès rechargement du calendrier. Les PDF déjà archivés sont inchangés. |
| **AC4** | La désactivation/réactivation s'effectue via `is_active`. Les lignes ne sont jamais détruites. `readMemberAbsences` reste lisible pour toutes les catégories, même inactives. Les créations d'absences dans SMN-53 refusent les catégories inactives et la saisie ne propose pas celles-ci. Une correction d'une absence existante peut préserver sa catégorie devenue inactive. |
| **AC5** | **Aucune suppression définitive n'est exposée**, ni en interface ni dans l'API ; la contrainte `ON DELETE RESTRICT` de SMN-53 protège également les références existantes en base. Aucun champ de diagnostic médical, symptôme ni justificatif médical n'est sollicité : le formulaire d'absence SMN-53 conserve son avertissement pour la catégorie **Maladie** et accepte un motif générique non vide. |

## Architecture

- **Socle de données réutilisé** : `smn_absence_category(id,name,color,is_active,created_at,updated_at)` et `smn_member_absence(category_id)` (schéma v19). Aucune migration, aucun changement de version.
- **Service** : `src/server/members/absence-categories.ts` fournit `parseCategoryChange`, `listAbsenceCategories`, `saveAbsenceCategory`. Validation stricte des champs, interdiction du verbe delete, verrou consultatif transactionnel `pg_advisory_xact_lock(20261021,52)` pour sérialiser les mutations du catalogue, contrôle du jeton `updatedAt` (`updated_at::text`) pour éviter les pertes lors de modifications simultanées, `BEGIN/COMMIT/ROLLBACK`.
- **Intégration SMN-53** : `src/server/members/absence.ts` lit la catégorie avec `FOR SHARE` dans la transaction d'écriture pour interdire une course entre désactivation et création. La sélection d'une catégorie devenue inactive reste impossible pour une nouvelle absence.
- **API** : `src/app/api/admin/absence-categories/route.ts`, GET et POST, contrôles de session/autorisation Administrateur et d'origine des mutations par `authorizeApi`; GET renvoie les catégories (actives et inactives) + nombre d'absences liées ; POST accepte uniquement les actions `create` et `update`. Erreurs 400 (validation), 404 (catégorie inconnue), 409 (conflit/nom déjà utilisé/plafond), 403 (autorisation), 503 (incident serveur). Pas de route DELETE.
- **UI** : `src/app/app/admin/absence-categories/page.tsx` et `absence-categories-admin.tsx` (sélection, sauvegarde, désactivation/réactivation, liste de références, prévention des données non sauvegardées). Accès depuis `src/app/app/admin/members/page.tsx` et l'éditeur des absences SMN-53. Pastille colorée *et* nom textuel, aucun renseignement médical.
- **Traductions** : `src/i18n/fr.json` et `src/i18n/en.json` (section `absenceCategories`).
- **Tests de contrat** : `tests/absence-categories.test.ts` : valeurs obligatoires, couleur, doublon, création, identité stable, renommage/recoloration, désactivation/réactivation, concurrence, absence de suppression et respect de la confidentialité.

## Décisions de périmètre

La mise à jour du catalogue change la **présentation dynamique** des absences, pas les entrées historiques : les anciens motifs sont conservés. Il n'y a **pas d'historique propre aux changements du catalogue** dans le schéma actuel : `updated_at` donne le dernier changement et la version de concurrence, tandis que l'historique des absences de SMN-53 demeure intact. Une éventuelle traçabilité exhaustive de l'administration du catalogue nécessiterait une évolution distincte du modèle. La logique de capacité finale et les exports PDF historiques restent hors périmètre.

**Qualification** : vérifications statiques et tests écrits, sans exécution attestée de `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, PostgreSQL ni recette UI Windows. GitHub Actions indisponible selon la politique. Jira **En cours** et BMAD **review** tant que la recette locale est à faire. Workflow BMAD adapté aux connecteurs : aucun renderer natif `uv` lancé ni revendiqué.
