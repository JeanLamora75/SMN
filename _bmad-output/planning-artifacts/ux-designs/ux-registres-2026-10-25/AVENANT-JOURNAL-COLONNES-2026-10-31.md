# Contrat UX — Journal de suivi : lignes en quatre colonnes (31 octobre 2026)

## Décision validée sur les deux captures
La vue réelle actuelle ne respecte pas la maquette de référence. L'onglet « Journal de suivi » adopte une liste/timeline pleine largeur à **quatre colonnes**, sans double carte interne par élément.

1. **Date (120 px)** : alignement à gauche; date localisée sur la première ligne et heure locale sur la deuxième; ne jamais modifier l'horodatage enregistré.
2. **Type (140 px)** : badge avec couleur et pictogramme spécifiques, centré horizontalement et verticalement; Commentaire / Décision / Action / Fait marquant.
3. **Contenu (largeur flexible)** : titre sur une ligne en **gras sans soulignement**, puis commentaire ou description à la ligne. Pour une fiche liée, conserver un lien accessible sur le titre sans soulignement permanent; ne pas simuler de description absente de l'API; l'afficher uniquement lorsque fournie par la source autorisée.
4. **Actions (96 px)** : deux boutons icône (crayon Modifier, corbeille Supprimer/Retirer) avec titres/aria-label; confirmation obligatoire avant retrait. Les actions impossibles au regard des droits ou API ne sont pas affichées. Pour le commentaire, retrait **logique**, jamais DELETE physique; conserver la consultation des versions de manière secondaire si nécessaire. Pour les fiches Action/Décision/Fait marquant, l'édition peut réutiliser le formulaire existant; **aucun DELETE de fiche n'existe sur /api/admin/registries/[id] à la date du contrat** : ne pas inventer une suppression ni la faire passer pour un retrait de lien sans validation métier.

## Interactions et non-régression
- La barre de recherche/filtre/tri et **+ Commentaire / + Journal** demeure conforme aux validations précédentes.
- Auteur réel, type, dates, révisions et lien vers la fiche source sont conservés; pas de données fictives.
- Les commentaires retirés restent tracés et ne sont pas effacés de l'historique.
- Clavier, focus, infobulles, textes alternatifs, FR/EN, thèmes, responsive et zoom 200 %.
- Un bouton caché faute de capacité doit être signalé dans la recette et ne pas constituer une pseudo-action.
- Les tests doivent couvrir 0/1/N entrées, tri ancien/nouveau, texte long, droits admin/user, retrait confirmable, modale modification et affichage mobile.

## Implémentation Amelia
Lire d'abord `src/app/app/admin/registries/registry-journal.tsx`, `registry-cockpit.css`, `registry-edit-modal.tsx`, `src/app/api/admin/registries/[id]/route.ts`, `src/app/api/admin/registries/[id]/comments/[commentId]/route.ts`. Réutiliser les contrôles métier et modales existants. CSS limité au composant. Implémenter sur `main` avec autorisation explicite de l'utilisateur. Aucun DDL sans justification. Recette locale Windows requise pour clôture.
