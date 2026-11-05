# BMAD — Couleur des icônes des blocs et des emplacements du Dashboard Builder

**Date :** 05/11/2026  
**Epic :** [SMN-353](https://lmn24.atlassian.net/browse/SMN-353)  
**Story :** [SMN-383](https://lmn24.atlassian.net/browse/SMN-383) — avenant AC13–AC17  
**Statut :** spécification validée, à implémenter et vérifier.

## Besoin
Permettre de définir **indépendamment**, en mode Personnalisation du Dashboard Builder, une couleur facultative pour l'icône de chaque bloc et de chacun de ses emplacements, y compris les zones d'en-tête dynamiques.

## Règles UX
1. Réutiliser la palette commune déjà présente dans les cérémonies, avec ses neuf teintes, libellés accessibles et valeur « Par défaut ». Pas de nouveau composant métier divergent; préférer une généralisation de son nom si elle ne casse pas les imports existants.
2. Placer la commande de couleur près d'IconPicker, sur la même fiche de configuration; couleur optionnelle et aperçu immédiat.
3. Appliquer la teinte **au seul pictogramme**, jamais au titre, à la valeur d'indicateur ni au fond du bloc. L'icône reste cachée si elle n'est pas définie.
4. Restitution cohérente pour les différents états du rendu : chargement, liste, valeur, source indisponible, en-tête, responsive et thèmes clair/sombre.
5. Les anciennes dispositions sans couleur continuent à fonctionner, sans modification.

## Architecture et données
- Champs facultatifs `iconColor?: CeremonyIconColor` dans `DashboardBlock` et `DashboardSlot`, validés par la liste blanche partagée `isCeremonyIconColor`.
- Modèle JSONB `smn_dashboard_layout` v1 inchangé, sans migration SQL et sans recalcul d'indicateurs.
- Fonctions de personnalisation `setBlockIconColor` / `setSlotIconColor` liées au brouillon uniquement. Annuler n'écrit rien; Enregistrer réutilise la gestion existante des révisions.
- En duplication/copie, les propriétés sont conservées; lors du changement de modèle, seules les couleurs des emplacements conservés suivent les emplacements. Supprimer un bloc coloré doit respecter les règles de confirmation.
- Validation côté serveur refuse toute couleur non autorisée, y compris une chaîne CSS arbitraire. La couleur n'est pas utilisée comme unique information sémantique.

## Critères d'acceptation
**AC13** Sélection indépendante pour chaque bloc et emplacement, y compris en-tête, palette partagée et couleur par défaut.  
**AC14** Le rendu colore uniquement les icônes, dans tous les chemins de restitution.  
**AC15** Persistance JSONB rétrocompatible, validation serveur stricte.  
**AC16** Fonctionnement avec brouillon, copie, duplication, modèle et suppression.  
**AC17** Tests du domaine, des composants et de la non-régression; typecheck/lint/CI et recette visuelle Windows vérifiés avant clôture.

## Références
- [Catalogue Bootstrap Icons SMN](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/dashboard-builder/avenant-catalogue-bootstrap-icons-complet-2026-11-05.md)
- [Palette de cérémonie](https://github.com/JeanLamora75/SMN/blob/main/src/lib/ceremony-appearance.ts)
- [Structure Dashboard Builder](https://github.com/JeanLamora75/SMN/blob/main/src/server/dashboard-builder/layout.ts)
- [User Story](https://lmn24.atlassian.net/browse/SMN-383)

**Démarche d'exécution :** connecteurs GitHub/Jira, sans outil local uv/IDE. Les tests ne sont pas présumés exécutés tant que les résultats n'en apportent pas la preuve.

## Réalisation publiée sur `main` — 05/11/2026

- `src/server/dashboard-builder/layout.ts` : champs `iconColor?: CeremonyIconColor` ajoutés aux blocs et emplacements; liste blanche validée serveur pour chaque propriété sans versionner davantage JSONB v1.
- `src/app/app/dashboard-builder/dashboard-editor.tsx` : choix de couleur individuel en en-tête, dans les blocs et dans les emplacements, connecté au brouillon et aux commandes de sauvegarde existantes.
- `src/app/app/dashboard-builder/dashboard-consultation.tsx` : couleur appliquée au seul pictogramme pour blocs et emplacements sur les chemins de rendu standard, chargement, listes et résultats.
- `src/app/app/ceremony-color-picker.tsx` : `useId` isole les groupes de boutons radio par instance; bénéfice partagé avec les cérémonies.
- `src/lib/dashboard-builder/block-actions.ts` : les couleurs seules comptent comme contenu configuré pour la confirmation de suppression; duplication et changement de modèle conservent les propriétés via clonage structurel existant.
- `tests/smn-383-dashboard-icon-colors.test.ts` : tests de validation, rétrocompatibilité, copie, changement de modèle et contrôle des éléments UI.
- Aucun changement PostgreSQL nécessaire pour les couleurs du Dashboard Builder.
- **Validation :** code et tests publiés; exécution des tests CI et recette visuelle Windows non prouvées lors de cette rédaction. Ne pas clôturer Jira avant les résultats.

