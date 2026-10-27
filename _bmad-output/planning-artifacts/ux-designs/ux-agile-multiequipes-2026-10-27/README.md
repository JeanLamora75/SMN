# SMN-287 — Avenant UX final : Scrum/Kanban multiéquipes

**Agent :** Sally — UX Designer BMAD v6.12.4  
**Décisions :** D-AGILE-01 à 24 et UX-01 à UX-04 validées par le Product Owner.  
**Statut :** contrats UX **finalisés**, publiés sur `main` le 27/10/2026. Il ne s'agit ni de code livré ni d'une recette applicative réalisée.

## Références normatives
1. [DESIGN.md](./DESIGN.md) — apparence, composition, badges, états visuels.
2. [EXPERIENCE.md](./EXPERIENCE.md) — interactions, modes, autorisations, archivage et cas limites.
3. [BRIEF-AMELIA-UX.md](./BRIEF-AMELIA-UX.md) — transmission ciblée au développeur.
4. [RECETTE-UX.md](./RECETTE-UX.md) — critères de recette manuelle, non exécutés.

## Traçabilité
- Epic : [SMN-287](https://lmn24.atlassian.net/browse/SMN-287)
- Stories UX : [SMN-289](https://lmn24.atlassian.net/browse/SMN-289), [SMN-290](https://lmn24.atlassian.net/browse/SMN-290), [SMN-291](https://lmn24.atlassian.net/browse/SMN-291), [SMN-292](https://lmn24.atlassian.net/browse/SMN-292)
- Sécurité, reporting et recette : SMN-295, SMN-296, SMN-297
- Fondation multiéquipes : [SMN-282](https://lmn24.atlassian.net/browse/SMN-282)
- Brief fonctionnel : [BRIEF-PRODUIT.md](../../briefs/agile-par-equipe-2026-10-27/BRIEF-PRODUIT.md)
- Architecture : [ARCHITECTURE-SPINE-PROPOSITION.md](../../briefs/agile-par-equipe-2026-10-27/ARCHITECTURE-SPINE-PROPOSITION.md)
- Référentiel visuel : [DESIGN Cockpit Équipe — 26/10/2026](../ux-equipe-cockpit-2026-10-26/DESIGN.md)

## Arbitrages UX validés
- **UX-01** : historique d'équipe archivée consultable en lecture seule par un administrateur autorisé.
- **UX-02** : équipe archivée inaccessible en écriture métier, contrôle côté serveur.
- **UX-03** : dernière équipe active de l'installation non archivable, y compris en concurrence.
- **UX-04** : mode Agile modifiable uniquement via **Paramètres > Équipes** ; affichage lecture seule dans la modale de la page Équipe.

**Règle de précédence :** DESIGN.md et EXPERIENCE.md de ce dossier sont normatifs pour ces seuls nouveaux comportements. Les écrans Cockpit Agile déjà approuvés restent inchangés par ailleurs.
