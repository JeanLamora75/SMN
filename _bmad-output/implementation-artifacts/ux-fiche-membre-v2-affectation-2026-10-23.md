# Fiche membre V2 — Onglet Affectation, historique et modale (23/10/2026)

## Demande validée par l'utilisateur
À partir de deux captures du pilote SMN :
1. Le bloc **Rôles et affectation**, dans l'onglet **Affectation** de la fiche membre, doit afficher **l'Historique des versions**, déjà disponible dans l'ancien formulaire d'édition.
2. Dans la modale **Modifier assignment** : **Date d'effet** sur une ligne distincte ; **Temps contractuel / Affectation à l'équipe / Coefficient de contribution** sur la même ligne (3 colonnes) ; **Scrum Master / Product Owner / Développeur** sur une même ligne (3 colonnes).
3. Retirer de la modale la table **Historique des versions** et sa note ; laisser la modale réservée aux données modifiables.
4. Reprendre les autres onglets séparément après validation de celui-ci.

Ces décisions complètent les critères normatifs **V2-11 / V2-12** de
`_bmad-output/planning-artifacts/ux-designs/ux-equipe-membres-2026-10-22/FICHE-MEMBRE-V2-RECETTE.md`.

## Implémentation publiée sur main
- `src/app/app/admin/members/[id]/member-assignment-history.tsx` : nouvelle vue **lecture seule** de l'historique, sous le résumé SM/PO/Dev dans la carte. Lecture de l'endpoint existant `GET /api/admin/members/[id]/assignment` avec cache `no-store`, libellés FR/EN existants, états de chargement/erreur/sans version, date d'effet et toutes les valeurs enregistrées.
- `src/app/app/admin/members/[id]/member-detail.tsx` : affiche la vue dans l'onglet Affectation et relance la lecture après un enregistrement réussi via `assignmentRefreshKey`.
- `src/app/app/admin/members/assignment-editor.tsx` : fenêtre d'édition réduite aux champs et à leurs validations, trois lignes fonctionnelles suivant la demande. **La lecture de `state.versions` reste nécessaire** au préremplissage et à la concurrence optimiste ; seule sa restitution en tableau est déplacée.
- `tests/member-assignment-ux.test.ts` : 6 tests statiques de non-régression sur le placement, la source de données, les états, le rafraîchissement après sauvegarde, les 3 lignes du formulaire et les traductions.

## Invariants conservés
- Un seul historique en base, lu depuis l'API existante ; aucune duplication, ni migration, ni altération des versions antérieures.
- Ajouts de versions datées avec révision, refus des valeurs incohérentes et droits d'accès inchangés.
- Historique consultable sans ouvrir de modale et pour les membres non éditables, dans les limites des droits existants.
- Versionnements futurs conservés ; valeurs historiques non devinées.
- Autres onglets (Calendrier, Absences, Historique global) hors périmètre de cette itération.

## Contrôles et recette
Contrôle statique effectué après publication sur GitHub : présence du tableau dans l'onglet, endpoint réel utilisé, relecture après sauvegarde, absence de tableau dans la modale, ligne date isolée, 3 champs taux sur une ligne, 3 rôles sur une ligne, traductions existantes FR/EN, fichier de six tests présent. **9 assertions de structure vérifiées via les sources distantes.**

Non exécutés par l'assistant : `pnpm exec tsx --test tests/member-assignment-ux.test.ts`, `pnpm typecheck`, `pnpm build`, recette écran/UX et intégration PostgreSQL sur poste Windows 11. Pas de GitHub Actions conformément à la politique du projet.

### Commandes proposées sur le poste pilote
```powershell
pnpm exec tsx --test tests/member-assignment-ux.test.ts
pnpm typecheck
pnpm build
pnpm dev
```

### Recette fonctionnelle à valider
- Affectation : tableau sous les badges et dans le bloc, sans ouvrir la modale ; toutes les révisions du membre affichées (dates, taux et rôles).
- Édition : date seule sur sa ligne, trois pourcentages alignés, trois rôles alignés, aucune table d'historique.
- Enregistrer une nouvelle version datée puis fermer la modale : nouveau numéro présent dans l'onglet sans rechargement manuel.
- Contrôler le repli mobile, FR/EN et la lecture d'un membre archivé ; aucune écriture en simple lecture.

**Statut : publié sur `main`, en attente des tests locaux et de la validation UX utilisateur.**
