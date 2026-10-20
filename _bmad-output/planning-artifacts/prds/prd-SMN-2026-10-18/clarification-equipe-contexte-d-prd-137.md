# SMN — Clarification du périmètre équipe et du contexte Agile

## D-PRD-137 — Équipe unique MVP et rattachement du contexte Agile

**19 octobre 2026 — décision explicitement validée par l'utilisateur, puis mise à jour de Jira et de la documentation autorisée.**

| Règle | Scrum / Kanban — MVP | SAFe — v1.0 |
| --- | --- | --- |
| Équipes par installation | Exactement une équipe | Plusieurs équipes dans le train |
| Vision et Product Goal | Rattachés à l'équipe | Rattachés au train (ART) |
| DoD et DoR | Rattachées à l'équipe | Rattachées au train (ART), communes aux équipes |

Le produit reste unique et fixe pour la durée de l'installation. Le MVP n'expose aucun ajout de seconde équipe interne, aucune affectation multiéquipes interne et aucun écran ART. Le serveur doit refuser ces opérations même par API. Les dépendances vers des équipes externes restent permises par nom libre, sans créer d'équipe interne ni de compte. Les règles multiéquipes antérieures sont réservées à SAFe v1.0 ; elles ne constituent plus des critères MVP.

Vision et Product Goal restent distincts et facultatifs, saisissables/modifiables par l'Administrateur, avec versions datées conservées. DoD et DoR restent facultatives, sous forme de texte interne ou de lien externe ; les révisions enregistrées restent identifiables. Un historique d'URL ne garantit ni l'archivage ni l'historicité du contenu distant. Ces contenus ne changent pas le produit fixe, les KPI ou les objectifs de cycle et ne réécrivent pas les anciens PDF. L'Utilisateur n'a aucun droit de modification ; sa consultation collective autorisée conserve les protections de D-PRD-136.

**Découpage explicite :** Story 3.24 / [SMN-221](https://lmn24.atlassian.net/browse/SMN-221) (vision/Product Goal) et Story 3.25 / [SMN-222](https://lmn24.atlassian.net/browse/SMN-222) (DoD/DoR), sous Epic 3, I1–I2 ; Story 6.9 / SMN-120 consomme ces données et leurs versions. Les contrats peuvent prévoir le propriétaire ART futur, sans implémentation SAFe au MVP.

Cet amendement complète les FR existantes (notamment FR-1/5/7/27/28/61/66/70/71) et les décisions F-26–34/F-58–63/F-116–124, sans renumérotation ni annulation de l'historique. Il prévaut sur les passages antérieurs incompatibles et clôt les ambiguïtés métier C1/C2 du contrôle de préparation, une fois la correspondance Jira vérifiée. Les réserves techniques C3/C4 et le séquencement I0–I6 demeurent. Aucun développement ni test applicatif effectué.

