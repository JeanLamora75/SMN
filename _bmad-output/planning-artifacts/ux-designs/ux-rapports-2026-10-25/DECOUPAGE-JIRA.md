# SMN — Refonte UX du Studio de rapports : découpage Jira

**Date :** 2026-10-25 · **Epic :** [SMN-228](https://lmn24.atlassian.net/browse/SMN-228) · **16 Stories créées et vérifiées**.

Ce lot est une **extension UX transverse** des capacités métier [SMN-6](https://lmn24.atlassian.net/browse/SMN-6), pas leur duplication. L'existant reste accessible jusqu'à validation d'une nouvelle destination réelle. Les liens vers les Stories renvoient à des tickets effectivement créés.

| Jira | Lot | Périmètre | Vague | Dépendances / analyse préalable |
|---|---|---|---|---|
| [SMN-254](https://lmn24.atlassian.net/browse/SMN-254) | R01 | Socle multi-rapports et persistance | Préparation/schéma | SMN-113 à 135 ; audit migrations |
| [SMN-255](https://lmn24.atlassian.net/browse/SMN-255) | R02 | Centre Rapports, recherche et contexte | S1 Navigation | 254, 113, 130 |
| [SMN-256](https://lmn24.atlassian.net/browse/SMN-256) | R03 | Bibliothèque des modèles et droits | S1 Modèles | SMN-122, 123 |
| [SMN-257](https://lmn24.atlassian.net/browse/SMN-257) | R04 | Versions modèles et mise à jour volontaire | S2 Modèles | 256 |
| [SMN-258](https://lmn24.atlassian.net/browse/SMN-258) | R05 | Génération automatique du brouillon | S2 Génération | 254, 256, SMN-114, 116, 119 |
| [SMN-259](https://lmn24.atlassian.net/browse/SMN-259) | R06 | Studio Composition/Rédaction/Aperçu | S3 Studio | 254, 258, SMN-124 |
| [SMN-260](https://lmn24.atlassian.net/browse/SMN-260) | R07 | Blocs modulables et propriétés | S3 Composition | 259, SMN-117 |
| [SMN-261](https://lmn24.atlassian.net/browse/SMN-261) | R08 | Métriques sous forme graphique/tableau/mixte | S4 Métriques | 260, SMN-118, 119, 121 |
| [SMN-262](https://lmn24.atlassian.net/browse/SMN-262) | R09 | Commentaires et sélection IA externe | S4 Rédaction | 259, SMN-115, 199 |
| [SMN-263](https://lmn24.atlassian.net/browse/SMN-263) | R10 | Autosave et dernier enregistrement prioritaire | S3 Transverse | 254, 259 |
| [SMN-264](https://lmn24.atlassian.net/browse/SMN-264) | R11 | Comparaison et actualisation volontaire | S4 Données | 258, 263, SMN-119 |
| [SMN-265](https://lmn24.atlassian.net/browse/SMN-265) | R12 | A4, couverture, sommaire, identité | S4 Document | 256, 259, SMN-125, 134 |
| [SMN-266](https://lmn24.atlassian.net/browse/SMN-266) | R13 | Pagination intelligente et débordements | S5 Document | 265, SMN-124, 127 |
| [SMN-267](https://lmn24.atlassian.net/browse/SMN-267) | R14 | Contrôle qualité non intrusif | S5 Export | 264, 266 |
| [SMN-268](https://lmn24.atlassian.net/browse/SMN-268) | R15 | Export direct et archives volontaires | S5 Export | 267, SMN-127, 129, 130, 135 |
| [SMN-269](https://lmn24.atlassian.net/browse/SMN-269) | R16 | Responsive, FR/EN, a11y, non-régression | S6 Recette | 255–268, SMN-214 |

## Conventions de Story

Chaque ticket expose : valeur utilisateur, cinq critères d'acceptation vérifiables, impacts/dépendances, protections droits admin/user, i18n, données historiques et recette. Les dépendances ci-dessus sont **des relations de planification documentées**, non des liens Jira « blocks » créés automatiquement.

**Invariants de livraison :** modèle standard protégé, modèles personnalisés administrables, plusieurs rapports indépendants/Sprint, A4 à orientation unique, brouillon autosauvegardé sans historique durable, dernier enregistrement serveur prioritaire entre sessions, IA uniquement par insertion volontaire de briefs externes, actualisation contrôlée des données, contrôle qualité non intrusif, PDF direct sans archive forcée, gel immuable sur demande.

**Transverse :** Scrum monoéquipe au MVP ; Kanban/SAFe sans activation anticipée. FR/EN JSON ; thèmes SMN existants ; sources fiables et sécurité serveur ; SP engagés initiaux distincts des révisions, J/H de disponibilité distincts de consommation ; qualités/provenances indiquées ; archives Vn préservées.

## Preuves requises pour clore une Story

Tests ciblés et non-régression réellement exécutés, `pnpm typecheck`, `pnpm build`, tests existants compatibles, vérification manuelle navigateur desktop/tablette/mobile en tenant compte des droits admin/user, et preuves de rendu PDF lorsque le périmètre le concerne. Les tests GitHub Actions ne sont pas présumés disponibles.

## Documents de référence

[DESIGN.md](DESIGN.md) · [EXPERIENCE.md](EXPERIENCE.md) · [RECETTE-UX.md](RECETTE-UX.md) · [CONTRAT-DEVELOPPEMENT.md](CONTRAT-DEVELOPPEMENT.md) · [Maquettes](MAQUETTES-REFERENCE.md) · [Synthèse des 21 décisions](SMN-SYNTHESE-UX-STUDIO-RAPPORTS-2026-10-25.md).
