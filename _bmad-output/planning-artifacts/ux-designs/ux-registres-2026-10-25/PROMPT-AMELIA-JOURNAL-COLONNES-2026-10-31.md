# Amelia — Mission SMN-248 / Journal de suivi — 31/10/2026

**Objectif** : aligner l'écran réel avec la maquette approuvée; brancher les opérations sur les API existantes; livrer sur main, sans ouvrir de PR.

## Lot de réalisation
- Composer chaque entrée via une grille responsive `120px 140px minmax(0,1fr) 96px`, en préservant une timeline visuelle dans la colonne Type.
- Date à gauche sur deux lignes (date puis heure) et type centré; contenu large, titre gras non souligné, commentaire/description en dessous; actions à droite.
- Commentaire : exposer modifier (formulaire existant) et retirer (confirmation explicite et retrait logique). Ne pas perdre versions/audit.
- Fiche liée : exposer modifier via `RegistryEditModal` ou navigation autorisée; ne pas afficher de suppression sans endpoint sécurisé attesté. Ne jamais mettre un bouton inerte.
- L'API journal actuelle fournit uniquement titre et métadonnées des liens : ne pas créer de description factice; si nécessaire étendre de manière sûre la lecture avec données et droits vérifiés, en préservant contrat et pagination.
- Vérifier tous les textes FR/EN et focus visible; menus mobiles sans débordement.

## Fichiers
`src/app/app/admin/registries/registry-journal.tsx`
`src/app/app/admin/registries/registry-cockpit.css`
`src/app/app/admin/registries/registry-edit-modal.tsx`
`src/i18n/{fr,en}.json`
Tests du journal et de la création liée.

## Critères de recette
AC-J01 : date et heure sur deux lignes, date alignée à gauche.
AC-J02 : type dans une colonne dédiée centrée.
AC-J03 : titre gras non souligné, description en dessous, textes tronqués uniquement visuellement et accessibles.
AC-J04 : deux icônes d'actions quand les deux sont possibles, retrait confirmé, aucun bouton fictif.
AC-J05 : données de l'équipe uniquement, filtres/tri inchangés, édition et audit intacts.
AC-J06 : FR/EN, clavier, thème, 320–1880px, tests exécutés lorsque environnement possible et rapport honnête.

**Contrat UX** : [Avenant](./AVENANT-JOURNAL-COLONNES-2026-10-31.md).
**Jira** : https://lmn24.atlassian.net/browse/SMN-248.
