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

## Évolution demandée le 26/10/2026 — non arbitrée

La [Story 3.26 / SMN-282](https://lmn24.atlassian.net/browse/SMN-282), demandée le 26 octobre 2026, vise la **création d'une nouvelle équipe et l'édition d'équipes depuis « Paramètres > Équipes »** avec quatre champs dont seul le nom de l'équipe est obligatoire. Voir l'[avenant de cadrage](../../ux-designs/ux-equipe-membres-2026-10-22/AVENANT-GESTION-EQUIPES-SMN-282-2026-10-26.md).

Cette nouvelle demande **entre en conflit** avec D-PRD-137 et avec les contraintes actuelles d'unicité sur équipe/produit par installation. **Jusqu'à décision produit explicite de changement de périmètre et mise à jour des contrats d'architecture, D-PRD-137 continue de s'appliquer.** La création de la Story et la documentation associée n'autorisent ni un contournement API ni une migration implicite. À arbitrer : mono/multiéquipes Scrum/Kanban, produit partagé ou par équipe et facultatif, sélection d'équipe active, autorisations et non-régression.


## Avenant D-PRD-137 — Validation multiéquipes le 26 octobre 2026

**Décision produit explicitement validée : plusieurs équipes internes sont autorisées dans une installation Scrum ou Kanban dès le MVP.** La restriction monoéquipe de D-PRD-137 du 19/10/2026 est remplacée **uniquement sur le nombre d'équipes**. Les descriptions de monoéquipe ci-dessus sont conservées à titre d'historique et ne sont plus le comportement produit cible.

**Non encore arbitré** : produit partagé ou produit propre à chaque équipe, possibilité d'absence de produit (seul le nom d'équipe est obligatoire dans SMN-282), sélection de l'équipe active, portée des membres, cycles, capacités, calendriers, registres, rapports, droits et historiques. La cible SAFe et les autres décisions du 19/10 ne sont pas implicitement modifiées. La gestion multi-affectations d'un même membre entre plusieurs équipes n'est pas autorisée par ce seul avenant.

**Écart technique vérifié** : `SmnTeam.installationId @unique`, `SmnProduct.installationId @unique`, `SmnTeam.productId` obligatoire et `SmnProduct.name` obligatoire (Prisma). Ce modèle doit évoluer de manière contrôlée après les arbitrages restants, avec migration sans perte de données et isolation serveur. L'approbation produit n'est pas une autorisation de supprimer immédiatement les protections applicatives sans solution cohérente.

Voir [Story 3.26 / SMN-282](https://lmn24.atlassian.net/browse/SMN-282) et [avenant d'architecture UX Équipes](../../ux-designs/ux-equipe-membres-2026-10-22/AVENANT-GESTION-EQUIPES-SMN-282-2026-10-26.md).
