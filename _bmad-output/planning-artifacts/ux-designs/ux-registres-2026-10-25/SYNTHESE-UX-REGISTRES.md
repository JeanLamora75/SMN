# SMN — Synthèse approuvée des 21 décisions UX Registres

**Date :** 25 octobre 2026. **Validation :** décision UX-REG-21 acceptée explicitement ; les 21 arbitrages de présentation et comportement ont été validés progressivement en conversation. **Statut technique :** spécification, non livrée/non testée.

| Référence | Décision normative |
|---|---|
| UX-REG-01 | Liste et Cartes ; Liste par défaut ; préférence indépendante |
| UX-REG-02 | Septième catégorie « Tous les registres » par défaut |
| UX-REG-03 | Liste enrichie : type/icône, titre, description 2 lignes, statut, responsable permis, échéance, menu |
| UX-REG-04 | Points d'attention : bandeau compact repliable, compteur permanent |
| UX-REG-05 | Toute l'équipe par défaut, cycle optionnel, sans duplication multi-cycle |
| UX-REG-06 | Fiche détaillée avec bandeau et onglets communs/métier pertinents |
| UX-REG-07 | Édition par section via crayon et modale |
| UX-REG-08 | Synthèse sur 2 colonnes : description/journal à gauche, contexte à droite |
| UX-REG-09 | Journal chronologique enrichi et vraies fiches liées (Actions, Décisions, Faits marquants) |
| UX-REG-10 | Commentaire rapide sans modale ; création de fiche liée par commande séparée |
| UX-REG-11 | Correction/retrait logique des commentaires avec traçabilité visible |
| UX-REG-12 | Relations groupées par catégorie, cycles dans section séparée |
| UX-REG-13 | Historique chronologique avec valeurs Avant/Après dépliables |
| UX-REG-14 | Conserver densité compacte validée de la maquette |
| UX-REG-15 | Type, statut et signal d'attention métier distincts |
| UX-REG-16 | Liste adaptative desktop/tablette/mobile, sans scroll horizontal forcé |
| UX-REG-17 | Création **complète** en modale (OPTION A demandée par utilisateur, pas création rapide) |
| UX-REG-18 | Après création, retour contextualisé, « Voir la fiche » et « Créer une autre » |
| UX-REG-19 | Confirmation systématique avant dissociation ; jamais suppression de fiche |
| UX-REG-20 | Actifs d'abord, puis états finaux, tous consultables et tri possible |
| UX-REG-21 | Fil d'Ariane et restauration recherche/filtre/tri/page/position possible |

## Périmètre et références
- **Epic UX :** [SMN-228](https://lmn24.atlassian.net/browse/SMN-228), lot [SMN-239](https://lmn24.atlassian.net/browse/SMN-239) à [SMN-253](https://lmn24.atlassian.net/browse/SMN-253).
- **Socle métier existant :** Epic 5 (SMN-89, 90, 97, 104, 106..110, 111/112), ne pas dupliquer ; applications Scrum et Kanban monoéquipe ; rôles admin/user.
- **Zones :** index global `/app/admin/registries`, fiche globale, journal, relations, historique ; ne pas remplacer les comportements historiques de la fiche Sprint SMN-234.
- **Document d'apparence :** [DESIGN.md](DESIGN.md) ; **parcours :** [EXPERIENCE.md](EXPERIENCE.md) ; **transmission :** [CONTRAT-DEVELOPPEMENT.md](CONTRAT-DEVELOPPEMENT.md) ; **qualité :** [RECETTE-UX.md](RECETTE-UX.md).

## Existant confirmé sur `main` lors du cadrage
- `registry-list.tsx` : recherche, filtres d'un type, pagination, liste Bootstrap.
- `registry-create.tsx` : création/édition, unique champ `comment`, révision, contrôle conflit, champs métier associés.
- `registry-history.tsx` : révisions et avant/après sous accordéon, présentation technique.
- `registry-relations.tsx` : relations avec saisie d'UUID à remplacer.
- `registry-cycles.tsx` : associations multi-cycle et blocage des changements sur cycles clos.
- `attention-cockpit.tsx` : alertes du producteur SMN-104.
- Règles du référentiel `docs/UX-REFERENTIEL-BMAD.md` : snapshots Vn et modales particulières fiche Sprint, i18n et confidentialité.

## Écarts / décisions en suspens
Journal multi-commentaires avec audit, retour contextuel, cartes mémorisées, UI par onglets, modales par section à développer. Quatre arbitrages : `highlight.recorded` dans les états ; seuils d'attention ; lecteur user et historique détaillé ; suppression générale hors périmètre. Ne pas simuler ces décisions ou des résultats de test.

**La documentation a été rédigée selon les contrats BMAD en mode connecteurs.** Les scripts locaux `uv run`, `resolve_customization`, `resolve_config`, `memlog`, sous-agents, tests TypeScript, build et recette navigateur n'ont pas été exécutés ici. Ne pas prétendre le contraire.
