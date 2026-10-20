# SMN-22 — Story 1.12 : navigation mode/rôle

**Source normative :** Jira SMN-22 ; FR-59/63/66, D-PRD-001/127/136, AD-5/7/31 et UX-DR01/11/12.

## Décisions de réalisation

1. Layout applicatif unique pour les pages privées, incluant l'en-tête et le contexte.
2. Modèle de navigation pur et centralisé ; groupe Administration réservé au rôle admin.
3. Les sections non livrées sont explicitement indisponibles : pas de fausses routes.
4. Le libellé des cycles suit le mode réellement chargé (Scrum/Kanban) ; un mode inconnu reste inconnu.
5. La vérification d'accès reste au serveur, conformément à la matrice MVP à deux profils.
6. Dictionnaires de libellés centralisés en FR et EN ; responsive et indicateur de page active.

## Critères et preuve

Voir `docs/NAVIGATION-SMN-22.md`. Tests créés `tests/private-navigation.test.ts`. Tests CI non attestés à ce stade.

**Statut BMAD :** implémentation fusionnée dans `main` par [PR #17](https://github.com/JeanLamora75/SMN/pull/17), validation fonctionnelle de l'Epic 1 déjà accordée ; vérification Windows/CI à compléter avant passage à « Terminé ».
